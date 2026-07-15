export type CivicEventUrgency = "urgent" | "important" | "watch"

export type CivicEvent = {
  id: string
  topicSlug: string
  topic: string
  title: string
  summary: string
  whyItMatters: string
  location: string
  jurisdiction: string
  checkedAt: string
  startsAt?: string
  venue?: string
  scheduleVerified?: true
  deadline?: string
  urgency: CivicEventUrgency
  eventType: "meeting" | "hearing" | "vote" | "filing" | "report"
  decisionMaker: string
  actionLabel: string
  actionUrl: string
  script: string
  evidence: Array<{
    label: string
    publisher: string
    url: string
  }>
}

export const civicEvents: Array<CivicEvent> = [
  {
    id: "saline-data-center-hearing",
    topicSlug: "michigan-data-centers",
    topic: "Data Centers",
    title: "Ypsilanti Township hosts a data-center information session",
    summary:
      "The township has scheduled an informational session and public comment on local data-center proposals for Wednesday evening. This is not an approval vote.",
    whyItMatters:
      "The strongest leverage exists before zoning and utility commitments harden. Ask for maximum demand and who pays—not project averages or headline job counts.",
    location: "Ypsilanti Township, Michigan",
    jurisdiction: "Ypsilanti Township",
    checkedAt: "2026-07-14T12:00:00-04:00",
    startsAt: "2026-07-15T18:00:00-04:00",
    venue: "Civic Center, 7200 S Huron River Dr",
    scheduleVerified: true,
    urgency: "urgent",
    eventType: "meeting",
    decisionMaker: "Township board and planning officials",
    actionLabel: "Check the official township files",
    actionUrl: "https://files.ypsitownship.org/",
    script:
      "Before any vote, please publish peak electric load, maximum daily water demand, generator testing schedules, noise modeling, tax concessions, and who pays for every public-system upgrade.",
    evidence: [
      {
        label: "Official township public files",
        publisher: "Ypsilanti Township",
        url: "https://files.ypsitownship.org/",
      },
      {
        label: "Washtenaw Data Center Watch tracks local votes and meetings",
        publisher: "The Sun Times News",
        url: "https://thesuntimesnews.com/washtenaw-data-center-watch-tracks-local-votes-and-meetings/",
      },
      {
        label: "Michigan Data Centers Guide",
        publisher: "University of Michigan Graham Sustainability Institute",
        url: "https://graham.umich.edu/product/michigan-data-centers-guide",
      },
      {
        label: "Michigan tracker: moratoria, legislation, and grid impact",
        publisher: "WKAR Public Media",
        url: "https://www.wkar.org/wkar-news/2026-02-27/michigan-data-center-tracker-moratoria-legislation-and-grid-impact",
      },
    ],
  },
  {
    id: "michigan-flock-contract-review",
    topicSlug: "michigan-surveillance-stack",
    topic: "Surveillance Stack",
    title: "Before a camera vote, ask what other agencies can search",
    summary:
      "A local camera can become part of a much larger searchable network through retention, hotlists, and outside-agency access.",
    whyItMatters:
      "Contract approval is the moment to require a public-use policy, audit access, deletion rules, and a new vote before AI or face-search tools are added.",
    location: "Michigan",
    jurisdiction: "City and county governments",
    checkedAt: "2026-05-19T12:00:00-04:00",
    urgency: "important",
    eventType: "report",
    decisionMaker: "City councils and county boards",
    actionLabel: "Review the public camera map",
    actionUrl: "https://deflock.me/map",
    script:
      "Please publish the contract, retention period, all outside agencies with access, search audit logs, hotlist rules, and any planned AI or facial-recognition integrations before this vote.",
    evidence: [
      {
        label: "ALPR surveillance map",
        publisher: "DeFlock / ALPR Watch",
        url: "https://deflock.me/map",
      },
    ],
  },
  {
    id: "stock-trading-disclosure-watch",
    topicSlug: "congressional-stock-trading",
    topic: "Congressional Stock Trading",
    title: "Financial disclosures create an accountability opening",
    summary:
      "Transaction reports are most useful when they are checked against committee work, votes, contracts, and bill movement.",
    whyItMatters:
      "Disclosure shows the conflict after the fact. A durable reform restricts individual holdings and covers spouses and dependents.",
    location: "United States",
    jurisdiction: "U.S. Congress",
    checkedAt: "2026-05-19T12:00:00-04:00",
    urgency: "watch",
    eventType: "report",
    decisionMaker: "Members of Congress",
    actionLabel: "Check official disclosures",
    actionUrl: "https://disclosures-clerk.house.gov/",
    script:
      "Will you support a ban on individual stock ownership and trading that also covers spouses and dependents, while preserving diversified retirement funds?",
    evidence: [
      {
        label: "Financial Disclosure Reports",
        publisher: "U.S. House Clerk",
        url: "https://disclosures-clerk.house.gov/",
      },
    ],
  },
]

export function getCivicEvent(id: string) {
  return civicEvents.find((event) => event.id === id)
}
