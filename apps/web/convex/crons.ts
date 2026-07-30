import { cronJobs, makeFunctionReference } from "convex/server"

const crons = cronJobs()

const refreshAllTopicNews = makeFunctionReference<"action">(
  "news:refreshAllTopicNews"
)
const matchPendingEvents = makeFunctionReference<"mutation">(
  "notifications:matchPendingEvents"
)
const dispatchPending = makeFunctionReference<"action">("push:dispatchPending")
const checkReceipts = makeFunctionReference<"action">("push:checkReceipts")
const reviewDrafts = makeFunctionReference<"action">(
  "topicReviewNode:reviewDrafts"
)
const retryStalledRequests = makeFunctionReference<"action">(
  "topicReviewNode:retryStalledRequests"
)

crons.interval("refresh topic news", { minutes: 30 }, refreshAllTopicNews)
// Runs offset from the crawl so it works through what the crawl just filed.
crons.interval("review crawled drafts", { minutes: 10 }, reviewDrafts)
crons.interval("retry stalled topic requests", { minutes: 15 }, retryStalledRequests)
crons.interval("match civic alerts", { minutes: 5 }, matchPendingEvents)
crons.interval("dispatch civic alerts", { minutes: 5 }, dispatchPending)
crons.interval("check push receipts", { minutes: 15 }, checkReceipts)

export default crons
