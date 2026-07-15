import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const urgency = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
)

const topicUrgency = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
)

const source = v.object({
  title: v.string(),
  publisher: v.string(),
  year: v.number(),
  url: v.string(),
  note: v.string(),
})

const stat = v.object({
  value: v.string(),
  label: v.string(),
  sourceIndexes: v.array(v.number()),
})

const argument = v.object({
  title: v.string(),
  claim: v.string(),
  counterpoint: v.string(),
  sourceIndexes: v.array(v.number()),
})

const finding = v.object({
  title: v.string(),
  body: v.string(),
  sourceIndexes: v.array(v.number()),
})

const statusBrief = v.object({
  headline: v.string(),
  summary: v.string(),
  latestDevelopment: v.string(),
  nextDecisionPoint: v.string(),
  whoCanAct: v.string(),
  urgency: topicUrgency,
  lastChecked: v.string(),
})

const action = v.object({
  title: v.string(),
  description: v.string(),
  audience: v.string(),
  difficulty: v.string(),
  urgency: topicUrgency,
  ctaLabel: v.string(),
  ctaUrl: v.optional(v.string()),
  script: v.string(),
})

const timelineItem = v.object({
  date: v.string(),
  title: v.string(),
  description: v.string(),
  sourceIndexes: v.array(v.number()),
})

const update = v.object({
  title: v.string(),
  publisher: v.string(),
  publishedAt: v.string(),
  url: v.string(),
  summary: v.string(),
  tag: v.string(),
})

const module = v.union(
  v.object({
    type: v.literal("briefing"),
    title: v.string(),
    eyebrow: v.string(),
    body: v.array(v.string()),
    bullets: v.optional(v.array(v.string())),
    sourceIndexes: v.optional(v.array(v.number())),
  }),
  v.object({
    type: v.literal("statGrid"),
    title: v.string(),
    eyebrow: v.string(),
    stats: v.array(stat),
  }),
  v.object({
    type: v.literal("evidenceMatrix"),
    title: v.string(),
    eyebrow: v.string(),
    summary: v.optional(v.string()),
    rows: v.array(
      v.object({
        label: v.string(),
        evidence: v.string(),
        caveat: v.string(),
        sourceIndexes: v.array(v.number()),
      })
    ),
  }),
  v.object({
    type: v.literal("claimLedger"),
    title: v.string(),
    eyebrow: v.string(),
    rows: v.array(
      v.object({
        claim: v.string(),
        status: v.union(
          v.literal("documented"),
          v.literal("contested"),
          v.literal("unsupported"),
          v.literal("watch")
        ),
        finding: v.string(),
        sourceIndexes: v.array(v.number()),
      })
    ),
  }),
  v.object({
    type: v.literal("tracker"),
    title: v.string(),
    eyebrow: v.string(),
    columns: v.array(v.string()),
    rows: v.array(
      v.object({
        cells: v.array(v.string()),
        sourceIndexes: v.array(v.number()),
      })
    ),
  }),
  v.object({
    type: v.literal("moneyTrail"),
    title: v.string(),
    eyebrow: v.string(),
    rows: v.array(
      v.object({
        actor: v.string(),
        mechanism: v.string(),
        impact: v.string(),
        sourceIndexes: v.array(v.number()),
      })
    ),
  }),
  v.object({
    type: v.literal("policyLevers"),
    title: v.string(),
    eyebrow: v.string(),
    levers: v.array(
      v.object({
        actor: v.string(),
        lever: v.string(),
        pressurePoint: v.string(),
        sourceIndexes: v.array(v.number()),
      })
    ),
  }),
  v.object({
    type: v.literal("actionList"),
    title: v.string(),
    eyebrow: v.string(),
    actions: v.array(action),
  }),
  v.object({
    type: v.literal("timeline"),
    title: v.string(),
    eyebrow: v.string(),
    items: v.array(timelineItem),
  })
)

export default defineSchema({
  topics: defineTable({
    slug: v.string(),
    topicNumber: v.string(),
    title: v.string(),
    shortTitle: v.string(),
    tagline: v.string(),
    summary: v.string(),
    region: v.string(),
    status: v.string(),
    theme: v.union(
      v.literal("ethics"),
      v.literal("surveillance"),
      v.literal("infrastructure"),
      v.literal("future")
    ),
    updatedAt: v.string(),
    stats: v.array(stat),
    arguments: v.array(argument),
    findings: v.array(finding),
    statusBrief,
    actions: v.array(action),
    timeline: v.array(timelineItem),
    updates: v.array(update),
    modules: v.array(module),
    sources: v.array(source),
  }).index("by_slug", ["slug"]),

  topicNewsItems: defineTable({
    topicSlug: v.string(),
    title: v.string(),
    publisher: v.string(),
    publishedAt: v.string(),
    url: v.string(),
    summary: v.string(),
    tag: v.string(),
    fetchedAt: v.string(),
  })
    .index("by_topic", ["topicSlug"])
    .index("by_url", ["url"]),

  jurisdictions: defineTable({
    key: v.string(),
    name: v.string(),
    kind: v.union(
      v.literal("country"),
      v.literal("state"),
      v.literal("county"),
      v.literal("city"),
      v.literal("township"),
      v.literal("district")
    ),
    countryCode: v.string(),
    stateCode: v.optional(v.string()),
    parentKey: v.optional(v.string()),
    fipsCode: v.optional(v.string()),
    timezone: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_state_kind", ["stateCode", "kind"]),

  civicProfiles: defineTable({
    installationId: v.string(),
    authSubject: v.optional(v.string()),
    displayName: v.optional(v.string()),
    homeJurisdictionKeys: v.array(v.string()),
    notificationPermission: v.union(
      v.literal("unknown"),
      v.literal("granted"),
      v.literal("denied")
    ),
    notificationsEnabled: v.boolean(),
    digestHourUtc: v.number(),
    digestDayOfWeekUtc: v.number(),
    quietHoursStartUtc: v.optional(v.number()),
    quietHoursEndUtc: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_installation", ["installationId"])
    .index("by_auth_subject", ["authSubject"]),

  apiRateLimits: defineTable({
    key: v.string(),
    windowStartedAt: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  subscriptions: defineTable({
    profileId: v.id("civicProfiles"),
    topicSlug: v.string(),
    position: v.union(
      v.literal("oppose"),
      v.literal("support"),
      v.literal("monitor")
    ),
    cadence: v.union(
      v.literal("instant"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    minimumUrgency: urgency,
    jurisdictionKeys: v.array(v.string()),
    eventKinds: v.array(
      v.union(
        v.literal("permit"),
        v.literal("meeting"),
        v.literal("vote"),
        v.literal("public_comment"),
        v.literal("filing"),
        v.literal("investigation"),
        v.literal("policy"),
        v.literal("court_ruling"),
        v.literal("breaking_news")
      )
    ),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_topic", ["profileId", "topicSlug"])
    .index("by_topic_active", ["topicSlug", "isActive"]),

  pushDevices: defineTable({
    profileId: v.id("civicProfiles"),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    appVersion: v.optional(v.string()),
    deviceLabel: v.optional(v.string()),
    isActive: v.boolean(),
    lastRegisteredAt: v.string(),
    lastAcceptedAt: v.optional(v.string()),
    lastDeliveredAt: v.optional(v.string()),
    disabledReason: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_profile", ["profileId"])
    .index("by_profile_active", ["profileId", "isActive"]),

  sourceDocuments: defineTable({
    key: v.string(),
    title: v.string(),
    publisher: v.string(),
    url: v.string(),
    archivedUrl: v.optional(v.string()),
    documentType: v.union(
      v.literal("agenda"),
      v.literal("minutes"),
      v.literal("permit"),
      v.literal("filing"),
      v.literal("government"),
      v.literal("research"),
      v.literal("reporting"),
      v.literal("advocacy")
    ),
    publishedAt: v.optional(v.string()),
    retrievedAt: v.string(),
    jurisdictionKeys: v.array(v.string()),
    provenanceNote: v.string(),
    reliability: v.union(
      v.literal("primary"),
      v.literal("authoritative"),
      v.literal("reported"),
      v.literal("perspective")
    ),
  })
    .index("by_key", ["key"])
    .index("by_url", ["url"]),

  meetings: defineTable({
    key: v.string(),
    jurisdictionKeys: v.array(v.string()),
    title: v.string(),
    description: v.string(),
    bodyName: v.string(),
    meetingType: v.union(
      v.literal("city_council"),
      v.literal("township_board"),
      v.literal("planning_commission"),
      v.literal("county_board"),
      v.literal("legislative"),
      v.literal("agency"),
      v.literal("other")
    ),
    startsAt: v.string(),
    endsAt: v.optional(v.string()),
    timezone: v.string(),
    locationName: v.optional(v.string()),
    address: v.optional(v.string()),
    remoteUrl: v.optional(v.string()),
    agendaUrl: v.optional(v.string()),
    publicCommentDeadline: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    sourceDocumentIds: v.array(v.id("sourceDocuments")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_start", ["startsAt"]),

  civicEvents: defineTable({
    key: v.string(),
    topicSlugs: v.array(v.string()),
    headline: v.string(),
    summary: v.string(),
    whyItMatters: v.string(),
    eventKind: v.union(
      v.literal("permit"),
      v.literal("meeting"),
      v.literal("vote"),
      v.literal("public_comment"),
      v.literal("filing"),
      v.literal("investigation"),
      v.literal("policy"),
      v.literal("court_ruling"),
      v.literal("breaking_news")
    ),
    geographicScope: v.union(
      v.literal("local"),
      v.literal("state"),
      v.literal("regional"),
      v.literal("national"),
      v.literal("international")
    ),
    jurisdictionKeys: v.array(v.string()),
    urgency,
    confidence: v.union(
      v.literal("developing"),
      v.literal("corroborated"),
      v.literal("verified")
    ),
    lifecycleStatus: v.union(
      v.literal("proposed"),
      v.literal("scheduled"),
      v.literal("open"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("withdrawn")
    ),
    publicationStatus: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    notificationStatus: v.union(
      v.literal("pending"),
      v.literal("matched"),
      v.literal("suppressed")
    ),
    notificationMode: v.union(
      v.literal("instant"),
      v.literal("digest"),
      v.literal("none")
    ),
    happenedAt: v.optional(v.string()),
    startsAt: v.optional(v.string()),
    deadlineAt: v.optional(v.string()),
    publishedAt: v.string(),
    updatedAt: v.string(),
    sourceDocumentIds: v.array(v.id("sourceDocuments")),
    meetingId: v.optional(v.id("meetings")),
    deepLinkPath: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_publication_notification", [
      "publicationStatus",
      "notificationStatus",
    ])
    .index("by_publication_published", ["publicationStatus", "publishedAt"])
    .index("by_published", ["publishedAt"]),

  evidenceClaims: defineTable({
    eventId: v.id("civicEvents"),
    claim: v.string(),
    context: v.string(),
    classification: v.union(
      v.literal("documented_local_impact"),
      v.literal("general_risk"),
      v.literal("advocacy_position"),
      v.literal("uncertain")
    ),
    evidenceStrength: v.union(
      v.literal("limited"),
      v.literal("moderate"),
      v.literal("strong")
    ),
    sourceDocumentIds: v.array(v.id("sourceDocuments")),
    sortOrder: v.number(),
  }).index("by_event", ["eventId", "sortOrder"]),

  civicActions: defineTable({
    eventId: v.id("civicEvents"),
    meetingId: v.optional(v.id("meetings")),
    title: v.string(),
    description: v.string(),
    actionKind: v.union(
      v.literal("attend"),
      v.literal("public_comment"),
      v.literal("call"),
      v.literal("email"),
      v.literal("research"),
      v.literal("organize"),
      v.literal("vote")
    ),
    audience: v.string(),
    deadlineAt: v.optional(v.string()),
    ctaLabel: v.string(),
    ctaUrl: v.optional(v.string()),
    script: v.optional(v.string()),
    sourceDocumentIds: v.array(v.id("sourceDocuments")),
    sortOrder: v.number(),
  }).index("by_event", ["eventId", "sortOrder"]),

  notificationCandidates: defineTable({
    key: v.string(),
    profileId: v.id("civicProfiles"),
    subscriptionId: v.id("subscriptions"),
    eventId: v.id("civicEvents"),
    topicSlug: v.string(),
    matchedJurisdictionKeys: v.array(v.string()),
    reason: v.string(),
    title: v.string(),
    body: v.string(),
    deepLinkPath: v.string(),
    urgency,
    cadence: v.union(
      v.literal("instant"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("skipped"),
      v.literal("failed")
    ),
    scheduledAt: v.string(),
    createdAt: v.string(),
    lastAttemptAt: v.optional(v.string()),
    digestLeaderId: v.optional(v.id("notificationCandidates")),
    completedAt: v.optional(v.string()),
    skipReason: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_status_scheduled", ["status", "scheduledAt"])
    .index("by_digest_leader", ["digestLeaderId"])
    .index("by_profile", ["profileId"]),

  notificationDeliveries: defineTable({
    candidateId: v.id("notificationCandidates"),
    deviceId: v.id("pushDevices"),
    attempt: v.number(),
    provider: v.literal("expo"),
    status: v.union(
      v.literal("sending"),
      v.literal("accepted"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("device_disabled")
    ),
    providerTicketId: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    attemptedAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_device", ["deviceId"])
    .index("by_status", ["status"]),
})
