import { cronJobs } from "convex/server"

import { api } from "./_generated/api"

const crons = cronJobs()

crons.interval("refresh topic news", { hours: 6 }, api.news.refreshAllTopicNews)

export default crons
