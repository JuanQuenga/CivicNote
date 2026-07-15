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

crons.interval("refresh topic news", { minutes: 30 }, refreshAllTopicNews)
crons.interval("match civic alerts", { minutes: 5 }, matchPendingEvents)
crons.interval("dispatch civic alerts", { minutes: 5 }, dispatchPending)
crons.interval("check push receipts", { minutes: 15 }, checkReceipts)

export default crons
