// Pure helpers for driving `codex exec` as CivicNote's topic reviewer.
// No Node imports here: this module can be read and reasoned about without
// spawning codex and without spending anyone's ChatGPT quota.

import {
  draftBatchVerdictSchema,
  topicRequestVerdictSchema,
} from "../convex/lib/topicReviewSchemas.ts"

export { DEFAULT_CODEX_MODEL } from "../convex/lib/topicReviewSchemas.ts"

export type JobKind = "request" | "drafts"

export type WorkerErrorCode =
  | "codex_not_found"
  | "not_logged_in"
  | "model_unsupported"
  | "rate_limited"
  | "timeout"
  | "malformed_output"
  | "exec_failed"

export type CodexUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

// The narrowest supported invocation: ephemeral session, no user config or
// rules, read-only sandbox anchored in an empty scratch directory, shell
// tooling disabled, web search on, final message constrained by a JSON schema
// and written to a file. The prompt goes on stdin ('-') so no reader-supplied
// text ever touches the argv.
export function buildCodexExecArgs(args: {
  model: string
  workdir: string
  schemaPath: string
  lastMessagePath: string
}): Array<string> {
  return [
    "exec",
    "--ephemeral",
    "--skip-git-repo-check",
    "--ignore-user-config",
    "--ignore-rules",
    "--strict-config",
    "--disable",
    "code_mode_host",
    "-c",
    "tools.web_search=true",
    "-s",
    "read-only",
    "-C",
    args.workdir,
    "-m",
    args.model,
    "--json",
    "--output-schema",
    args.schemaPath,
    "-o",
    args.lastMessagePath,
    "--color",
    "never",
    "-",
  ]
}

// Extracts the thread id and token usage from `codex exec --json` JSONL
// events (thread.started / turn.completed).
export function parseCodexEvents(jsonl: string): {
  threadId?: string
  usage?: CodexUsage
} {
  let threadId: string | undefined
  let usage: CodexUsage | undefined
  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("{")) continue
    let event: unknown
    try {
      event = JSON.parse(trimmed)
    } catch {
      continue
    }
    if (typeof event !== "object" || event === null) continue
    const record = event as Record<string, unknown>
    if (record.type === "thread.started" && typeof record.thread_id === "string") {
      threadId = record.thread_id
    }
    if (record.type === "turn.completed") {
      const rawUsage =
        typeof record.usage === "object" && record.usage !== null
          ? (record.usage as Record<string, unknown>)
          : undefined
      const toCount = (value: unknown) =>
        typeof value === "number" && Number.isFinite(value) && value >= 0
          ? value
          : undefined
      const inputTokens = toCount(rawUsage?.input_tokens)
      const outputTokens = toCount(rawUsage?.output_tokens)
      if (inputTokens !== undefined || outputTokens !== undefined) {
        usage = {
          inputTokens,
          outputTokens,
          totalTokens:
            inputTokens !== undefined && outputTokens !== undefined
              ? inputTokens + outputTokens
              : undefined,
        }
      }
    }
  }
  return { threadId, usage }
}

// Validates the final codex message before submission and returns the
// canonical JSON the server expects. Convex re-validates all of it; this
// exists so a malformed run fails locally with a readable reason.
export function validateReviewOutput(
  kind: JobKind,
  raw: string
): { ok: true; output: string } | { ok: false; reason: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: "final message is not valid JSON" }
  }
  const schema =
    kind === "request" ? topicRequestVerdictSchema : draftBatchVerdictSchema
  const result = schema.safeParse(parsed)
  if (!result.success) {
    const issue = result.error.issues[0]
    return {
      ok: false,
      reason: `output schema mismatch at ${issue.path.join(".") || "(root)"}: ${issue.message}`,
    }
  }
  return { ok: true, output: JSON.stringify(result.data) }
}

// Maps a codex exec failure to a sanitized error code plus a short local
// diagnostic. Raw model output is never included.
export function classifyCodexFailure(args: {
  exitCode: number | null
  stderr: string
  timedOut?: boolean
}): { errorCode: WorkerErrorCode; detail: string } {
  if (args.timedOut) {
    return { errorCode: "timeout", detail: "codex exec exceeded the time limit" }
  }
  const stderr = args.stderr.toLowerCase()
  if (
    stderr.includes("not logged in") ||
    stderr.includes("login required") ||
    stderr.includes("please run codex login") ||
    stderr.includes("401 unauthorized")
  ) {
    return {
      errorCode: "not_logged_in",
      detail: "codex reports no active ChatGPT login",
    }
  }
  if (
    stderr.includes("rate limit") ||
    stderr.includes("too many requests") ||
    stderr.includes("429")
  ) {
    return { errorCode: "rate_limited", detail: "codex reported a rate limit" }
  }
  if (
    (stderr.includes("model") &&
      (stderr.includes("not found") ||
        stderr.includes("unsupported") ||
        stderr.includes("unknown") ||
        stderr.includes("not supported"))) ||
    stderr.includes("invalid model")
  ) {
    return {
      errorCode: "model_unsupported",
      detail: "codex rejected the configured model",
    }
  }
  return {
    errorCode: "exec_failed",
    detail: `codex exec exited with code ${args.exitCode ?? "unknown"}`,
  }
}
