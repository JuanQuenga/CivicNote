# Topic review worker (Codex / ChatGPT subscription)

CivicNote's automated editor runs on the operator's ChatGPT subscription through
the Codex CLI. There is no API key and no third-party model provider.

Convex cannot host a Codex session — the ChatGPT login lives in the CLI on a
machine you control — so review is a **leased job queue**:

1. Convex writes a prompt into `topicReviewJobs` (a reader's topic request, or a
   batch of crawled drafts).
2. A local worker claims the job over an authenticated HTTP endpoint, runs it
   through `codex exec`, and submits the structured result.
3. Convex re-validates everything before it changes a single row.

**The consequence to know up front:** review only progresses while the worker is
running. A queued job that nobody claims within 10 minutes fails with a reason
the reader can see, and the retry cron re-queues it.

## What the model can and cannot do

The verdict is advisory. Every fact it returns is re-derived in code or dropped:

- An `approve` verdict missing any part of the topic definition is not an
  approval — it is recorded as a rejection with an explanation.
- Jurisdiction keys that do not match `^[a-z]{2}(-[a-z0-9-]{1,20})?$` are
  dropped, because an invented key silently filters a topic out of every
  reader's feed.
- A `duplicate` pointer survives only if the named slug actually exists.
- A draft decision about an item the job did not ask about is discarded.
- Published items always get `notificationMode: "digest"`. A machine-reviewed
  item never sends a push.
- Reader text is sanitized before it reaches a prompt, and the prompts state
  that reader text is data, not instructions.

## Setup

### 1. Install and log in to Codex

```sh
codex login          # ChatGPT account, not an API key
codex login status   # must print "logged in"
```

### 2. Set the deployment environment

In the Convex dashboard (or `npx convex env set`):

| Variable                     | Value                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `TOPIC_REVIEW_ENABLED`       | `true` — without it nothing is ever queued              |
| `TOPIC_REVIEW_WORKER_SECRET` | a long random string, e.g. `openssl rand -hex 32`       |

### 3. Set the worker environment

In `.env.local` at the repo root or in `apps/web`:

| Variable                     | Required | Default         | Notes                                     |
| ---------------------------- | -------- | --------------- | ----------------------------------------- |
| `CONVEX_SITE_URL`            | yes      | —               | `https://<deployment>.convex.site`        |
| `TOPIC_REVIEW_WORKER_SECRET` | yes      | —               | must match the deployment value           |
| `TOPIC_REVIEW_CODEX_MODEL`   | no       | `gpt-5.6-luna`  | the fast tier; do not default to Sol       |
| `CODEX_BIN`                  | no       | `codex`         | path to the CLI                           |
| `TOPIC_REVIEW_WORKER_POLL_MS`| no       | `5000`          | idle poll interval                        |
| `TOPIC_REVIEW_CODEX_TIMEOUT_MS` | no    | `300000`        | per-run kill timeout                      |

### 4. Run it

```sh
cd apps/web
pnpm ai:codex-worker
```

It verifies the CLI and the login before polling, then stays running. Stop it
with Ctrl-C; any claim it holds expires server-side.

## How a run is sandboxed

`codex exec` is invoked with the narrowest options that still allow web search:

```
--ephemeral --skip-git-repo-check --ignore-user-config --ignore-rules
--strict-config --disable code_mode_host -c tools.web_search=true
-s read-only -C <empty scratch dir> -m <model>
--json --output-schema <schema.json> -o <last-message.json> --color never -
```

The prompt goes in on **stdin**, never argv, so no reader-supplied text lands in
a process listing. The scratch directory is created per run and removed after.
The worker never reads, writes, or transmits `~/.codex/auth.json`.

## Endpoints

All four require `Authorization: Bearer $TOPIC_REVIEW_WORKER_SECRET`, compared
in constant time. They return 503 when the secret is unset on the deployment.

| Path                          | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `POST /api/v1/topic-review/claim`  | take the oldest claimable job         |
| `POST /api/v1/topic-review/renew`  | heartbeat, extends the 3-minute lease |
| `POST /api/v1/topic-review/submit` | hand back validated JSON              |
| `POST /api/v1/topic-review/fail`   | report a sanitized error code         |

## Failure modes

| What happened                          | What the reader sees                                    |
| -------------------------------------- | ------------------------------------------------------- |
| `TOPIC_REVIEW_ENABLED` unset           | "waiting for a person" — nothing is queued              |
| No worker running                      | job expires after 10 min; retry cron re-queues it       |
| Codex not installed / not logged in    | terminal: job fails, worker exits with the reason       |
| Rate limit or timeout                  | one retry, then the request is marked failed            |
| Model returned malformed JSON          | one retry, then failed; nothing is written              |
| Model approved without a full topic    | recorded as a rejection with an explanation             |

Error codes reported back to Convex are a fixed enum. Raw model output and raw
stderr never leave the worker.

## Crons

| Cron                          | Every  | Does                                       |
| ----------------------------- | ------ | ------------------------------------------ |
| `queue draft review`          | 10 min | queues one batch of up to 12 crawled drafts |
| `retry stalled topic requests`| 15 min | re-queues requests pending over 10 minutes  |
