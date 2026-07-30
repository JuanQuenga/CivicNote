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
const enqueueDraftReview = makeFunctionReference<"mutation">(
  "topicReviewJobs:enqueueDraftReview"
)
const retryStalledRequests = makeFunctionReference<"mutation">(
  "topicReviewJobs:retryStalledRequests"
)

crons.interval("refresh topic news", { minutes: 30 }, refreshAllTopicNews)
// Queues a review batch for whatever the crawl just filed. The local Codex
// worker is what actually drains it.
crons.interval("queue draft review", { minutes: 10 }, enqueueDraftReview)
crons.interval("retry stalled topic requests", { minutes: 15 }, retryStalledRequests)
crons.interval("match civic alerts", { minutes: 5 }, matchPendingEvents)
crons.interval("dispatch civic alerts", { minutes: 5 }, dispatchPending)
crons.interval("check push receipts", { minutes: 15 }, checkReceipts)

export default crons
