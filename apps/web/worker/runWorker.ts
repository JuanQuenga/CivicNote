// Local topic-review worker for CivicNote.
//
// Polls the Convex deployment for queued review jobs, runs each one through
// the locally authenticated Codex CLI (the ChatGPT login is managed entirely
// by codex; this process never reads or transmits tokens), and submits
// validated structured output back to Convex.
//
// Start with: pnpm ai:codex-worker
// See docs/topic-review-codex-worker.md for setup.

import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { hostname, tmpdir } from "node:os"
import { join } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import {
  DEFAULT_CODEX_MODEL,
  buildCodexExecArgs,
  classifyCodexFailure,
  parseCodexEvents,
  validateReviewOutput,
} from "./codexHarness.ts"
import type { CodexUsage, JobKind, WorkerErrorCode } from "./codexHarness.ts"

type ClaimedJob = {
  jobId: string
  kind: JobKind
  prompt: string
  outputSchema: string
  leaseMs: number
}

type WorkerConfig = {
  siteUrl: string
  secret: string
  model: string
  codexBin: string
  pollMs: number
  codexTimeoutMs: number
}

function fail(message: string): never {
  console.error(`[topic-review-worker] ${message}`)
  process.exit(1)
}

function loadConfig(): WorkerConfig {
  const siteUrl = process.env.CONVEX_SITE_URL?.replace(/\/$/, "")
  const secret = process.env.TOPIC_REVIEW_WORKER_SECRET
  if (!siteUrl) {
    fail(
      "CONVEX_SITE_URL is not set. Use your deployment HTTP actions URL, e.g. https://<deployment>.convex.site"
    )
  }
  if (!secret) {
    fail(
      "TOPIC_REVIEW_WORKER_SECRET is not set. Generate a long random value and set the same value in the Convex deployment env."
    )
  }
  return {
    siteUrl,
    secret,
    model: process.env.TOPIC_REVIEW_CODEX_MODEL || DEFAULT_CODEX_MODEL,
    codexBin: process.env.CODEX_BIN || "codex",
    pollMs: Number(process.env.TOPIC_REVIEW_WORKER_POLL_MS) || 5_000,
    codexTimeoutMs:
      Number(process.env.TOPIC_REVIEW_CODEX_TIMEOUT_MS) || 5 * 60_000,
  }
}

const config = loadConfig()
const workerId = `${hostname()}-${process.pid}-${randomBytes(4).toString("hex")}`
let shuttingDown = false
let activeChild: ReturnType<typeof spawn> | null = null

function log(message: string) {
  console.log(`[topic-review-worker] ${new Date().toISOString()} ${message}`)
}

async function api(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${config.siteUrl}/api/v1/topic-review/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secret}`,
    },
    body: JSON.stringify(body),
  })
  if (response.status === 401) {
    fail(
      "Convex rejected the worker secret (401). Check TOPIC_REVIEW_WORKER_SECRET matches the deployment env."
    )
  }
  if (response.status === 503) {
    fail(
      "Convex reports the worker endpoint is not configured (503). Set TOPIC_REVIEW_WORKER_SECRET on the deployment."
    )
  }
  let json: unknown = null
  try {
    json = await response.json()
  } catch {
    // some error statuses have no body
  }
  return { status: response.status, json }
}

async function checkCodexReady() {
  const probe = (args: Array<string>) =>
    new Promise<{ code: number | null; out: string; err: string }>(
      (resolve, reject) => {
        const child = spawn(config.codexBin, args, {
          stdio: ["ignore", "pipe", "pipe"],
        })
        let out = ""
        let err = ""
        child.stdout.on("data", (chunk: Buffer) => (out += chunk.toString()))
        child.stderr.on("data", (chunk: Buffer) => (err += chunk.toString()))
        child.on("error", reject)
        child.on("close", (code) => resolve({ code, out, err }))
      }
    )

  try {
    const version = await probe(["--version"])
    if (version.code !== 0) fail("`codex --version` failed — reinstall Codex.")
    log(`codex found: ${version.out.trim()}`)
  } catch {
    fail(
      `Codex CLI not found (looked for '${config.codexBin}'). Install it and run 'codex login', or set CODEX_BIN.`
    )
  }
  const login = await probe(["login", "status"])
  const loginText = `${login.out}\n${login.err}`.toLowerCase()
  if (login.code !== 0 || !loginText.includes("logged in")) {
    fail("Codex is not logged in. Run 'codex login' and try again.")
  }
  log("codex login verified (ChatGPT)")
}

type CodexRunResult =
  | { ok: true; output: string; threadId?: string; usage?: CodexUsage }
  | { ok: false; errorCode: WorkerErrorCode; detail: string }

async function runCodexJob(job: ClaimedJob): Promise<CodexRunResult> {
  const scratch = await mkdtemp(join(tmpdir(), "civicnote-codex-"))
  const workdir = join(scratch, "workdir")
  const schemaPath = join(scratch, "output-schema.json")
  const lastMessagePath = join(scratch, "last-message.json")
  try {
    await mkdir(workdir)
    await writeFile(schemaPath, job.outputSchema, "utf8")

    const args = buildCodexExecArgs({
      model: config.model,
      workdir,
      schemaPath,
      lastMessagePath,
    })

    const result = await new Promise<{
      code: number | null
      stdout: string
      stderr: string
      timedOut: boolean
      spawnFailed: boolean
    }>((resolve) => {
      const child = spawn(config.codexBin, args, {
        stdio: ["pipe", "pipe", "pipe"],
      })
      activeChild = child
      let stdout = ""
      let stderr = ""
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        child.kill("SIGKILL")
      }, config.codexTimeoutMs)
      child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()))
      child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()))
      child.on("error", () => {
        clearTimeout(timer)
        activeChild = null
        resolve({ code: null, stdout, stderr, timedOut, spawnFailed: true })
      })
      child.on("close", (code) => {
        clearTimeout(timer)
        activeChild = null
        resolve({ code, stdout, stderr, timedOut, spawnFailed: false })
      })
      child.stdin.write(job.prompt)
      child.stdin.end()
    })

    if (result.spawnFailed) {
      return {
        ok: false,
        errorCode: "codex_not_found",
        detail: "failed to spawn the codex binary",
      }
    }
    if (result.code !== 0 || result.timedOut) {
      const classified = classifyCodexFailure({
        exitCode: result.code,
        stderr: result.stderr,
        timedOut: result.timedOut,
      })
      log(`codex exec failed: ${classified.errorCode} (${classified.detail})`)
      return { ok: false, ...classified }
    }

    let lastMessage: string
    try {
      lastMessage = await readFile(lastMessagePath, "utf8")
    } catch {
      return {
        ok: false,
        errorCode: "malformed_output",
        detail: "codex did not write a final message",
      }
    }
    const validated = validateReviewOutput(job.kind, lastMessage)
    if (!validated.ok) {
      return { ok: false, errorCode: "malformed_output", detail: validated.reason }
    }
    const events = parseCodexEvents(result.stdout)
    return {
      ok: true,
      output: validated.output,
      threadId: events.threadId,
      usage: events.usage,
    }
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}

async function processJob(job: ClaimedJob) {
  log(`claimed job ${job.jobId} (${job.kind})`)
  const renewEvery = Math.max(15_000, Math.floor(job.leaseMs / 3))
  const renewTimer = setInterval(() => {
    api("renew", { jobId: job.jobId, workerId })
      .then(({ status }) => {
        if (status !== 200) log(`claim renewal for ${job.jobId} was rejected`)
      })
      .catch(() => {
        log(`claim renewal for ${job.jobId} failed (network); will retry`)
      })
  }, renewEvery)

  try {
    const result = await runCodexJob(job)
    if (!result.ok) {
      await api("fail", {
        jobId: job.jobId,
        workerId,
        errorCode: result.errorCode,
        detail: result.detail,
      })
      if (
        result.errorCode === "codex_not_found" ||
        result.errorCode === "not_logged_in"
      ) {
        fail(`stopping: ${result.detail}`)
      }
      return
    }

    const submit = await api("submit", {
      jobId: job.jobId,
      workerId,
      output: result.output,
      modelName: config.model,
      modelRequestId: result.threadId,
      usage: result.usage,
    })
    const submitStatus =
      typeof submit.json === "object" && submit.json !== null
        ? (submit.json as Record<string, unknown>).status
        : undefined
    if (submit.status === 200) {
      log(`job ${job.jobId} submitted (${String(submitStatus)})`)
    } else {
      log(
        `job ${job.jobId} submission rejected (${submit.status} ${String(submitStatus)})`
      )
    }
  } finally {
    clearInterval(renewTimer)
  }
}

async function main() {
  log(`starting worker ${workerId}`)
  log(`deployment: ${config.siteUrl}`)
  log(`model: ${config.model}`)
  await checkCodexReady()

  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true
    log("shutting down (current claim will expire server-side)")
    activeChild?.kill("SIGKILL")
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  log("polling for review jobs — leave this running")
  while (!shuttingDown) {
    let claimed: ClaimedJob | null = null
    try {
      const { status, json } = await api("claim", {
        workerId,
        model: config.model,
      })
      if (status === 200 && typeof json === "object" && json !== null) {
        claimed = (json as { job: ClaimedJob | null }).job
      } else if (status !== 200) {
        log(`claim request failed with status ${status}; retrying`)
      }
    } catch (error) {
      log(
        `cannot reach Convex (${error instanceof Error ? error.message : "network error"}); retrying`
      )
    }

    if (claimed) {
      try {
        await processJob(claimed)
      } catch (error) {
        log(
          `job ${claimed.jobId} crashed locally: ${error instanceof Error ? error.message : "unknown"}`
        )
        await api("fail", {
          jobId: claimed.jobId,
          workerId,
          errorCode: "exec_failed",
          detail: "worker crashed while processing the job",
        }).catch(() => {})
      }
      continue
    }
    await sleep(config.pollMs)
  }
}

void main()
