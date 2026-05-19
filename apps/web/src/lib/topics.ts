import { seedTopics } from "../../convex/seedTopics"
import type { ResearchTopic } from "../../convex/seedTopics"


export const topics = seedTopics

export function getTopicBySlug(slug: string): ResearchTopic | undefined {
  return topics.find((topic) => topic.slug === slug)
}

export function getAllStats() {
  return topics.flatMap((topic) =>
    topic.stats.map((stat) => ({
      ...stat,
      topic: topic.shortTitle,
      slug: topic.slug,
      theme: topic.theme,
    })),
  )
}
