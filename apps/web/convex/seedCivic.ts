import { internalMutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"

export const civicFoundation = internalMutation({
  args: {},
  handler: seedCivicFoundation,
})

export async function seedCivicFoundation(ctx: MutationCtx) {
  const jurisdictions = [
    {
      key: "us",
      name: "United States",
      kind: "country" as const,
      countryCode: "US",
      timezone: "America/New_York",
    },
    {
      key: "us-mi",
      name: "Michigan",
      kind: "state" as const,
      countryCode: "US",
      stateCode: "MI",
      parentKey: "us",
      fipsCode: "26",
      timezone: "America/Detroit",
    },
    {
      key: "us-mi-washtenaw",
      name: "Washtenaw County",
      kind: "county" as const,
      countryCode: "US",
      stateCode: "MI",
      parentKey: "us-mi",
      fipsCode: "26161",
      timezone: "America/Detroit",
    },
    {
      key: "us-mi-washtenaw-saline-township",
      name: "Saline Township",
      kind: "township" as const,
      countryCode: "US",
      stateCode: "MI",
      parentKey: "us-mi-washtenaw",
      timezone: "America/Detroit",
    },
  ]
  for (const jurisdiction of jurisdictions) {
    const existing = await ctx.db
      .query("jurisdictions")
      .withIndex("by_key", (q) => q.eq("key", jurisdiction.key))
      .unique()
    if (existing) await ctx.db.patch(existing._id, jurisdiction)
    else await ctx.db.insert("jurisdictions", jurisdiction)
  }

  const sources = [
    {
      key: "umich-michigan-data-centers-guide-2026",
      title: "What Michigan Local Governments Should Know About Data Centers",
      publisher: "University of Michigan Graham Sustainability Institute",
      url: "https://graham.umich.edu/product/michigan-data-centers-guide",
      documentType: "research" as const,
      publishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: "2026-05-19T00:00:00.000Z",
      jurisdictionKeys: ["us-mi"],
      provenanceNote:
        "University guidance for Michigan local governments; used for impact questions and local policy options.",
      reliability: "authoritative" as const,
    },
    {
      key: "wkar-michigan-data-center-tracker-2026",
      title: "Michigan Data Center Tracker",
      publisher: "WKAR Public Media",
      url: "https://www.wkar.org/wkar-news/2026-02-27/michigan-data-center-tracker-moratoria-legislation-and-grid-impact",
      documentType: "reporting" as const,
      publishedAt: "2026-02-27T00:00:00.000Z",
      retrievedAt: "2026-05-19T00:00:00.000Z",
      jurisdictionKeys: ["us-mi"],
      provenanceNote:
        "Statewide public-media tracker for reported projects, moratoria, legislation, and grid impacts.",
      reliability: "reported" as const,
    },
    {
      key: "lbl-data-center-electricity-demand-2024",
      title: "2024 United States Data Center Energy Usage Report",
      publisher: "Lawrence Berkeley National Laboratory",
      url: "https://eta.lbl.gov/news/berkeley-lab-report-evaluates-increase-electricity-demand-data-centers",
      documentType: "research" as const,
      publishedAt: "2024-12-20T00:00:00.000Z",
      retrievedAt: "2026-05-19T00:00:00.000Z",
      jurisdictionKeys: ["us"],
      provenanceNote:
        "Federal-laboratory research used only for general electricity-demand context, not project-specific claims.",
      reliability: "authoritative" as const,
    },
  ]
  const sourceIds = []
  for (const source of sources) {
    const existing = await ctx.db
      .query("sourceDocuments")
      .withIndex("by_key", (q) => q.eq("key", source.key))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, source)
      sourceIds.push(existing._id)
    } else {
      sourceIds.push(await ctx.db.insert("sourceDocuments", source))
    }
  }

  const key = "michigan-data-center-local-safeguards-watch-2026"
  const existingEvent = await ctx.db
    .query("civicEvents")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique()
  const eventData = {
    key,
    topicSlugs: ["michigan-data-centers"],
    headline: "Michigan communities are weighing data-center safeguards",
    summary:
      "Local governments are considering moratoria and standards while residents ask for power, water, noise, diesel, tax, and permanent-jobs disclosures before approvals.",
    whyItMatters:
      "Zoning and utility commitments can harden before the public sees maximum-demand numbers or who pays for infrastructure. Early local participation is the strongest leverage point.",
    eventKind: "policy" as const,
    geographicScope: "state" as const,
    jurisdictionKeys: ["us-mi"],
    urgency: "high" as const,
    confidence: "verified" as const,
    lifecycleStatus: "open" as const,
    publicationStatus: "published" as const,
    notificationStatus:
      existingEvent?.notificationStatus ?? ("pending" as const),
    notificationMode: "digest" as const,
    publishedAt: "2026-02-27T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
    sourceDocumentIds: sourceIds,
    deepLinkPath: `/alerts/${key}`,
  }
  const eventId =
    existingEvent?._id ?? (await ctx.db.insert("civicEvents", eventData))
  if (existingEvent) await ctx.db.patch(existingEvent._id, eventData)

  const existingClaims = await ctx.db
    .query("evidenceClaims")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect()
  for (const claim of existingClaims) await ctx.db.delete(claim._id)
  await ctx.db.insert("evidenceClaims", {
    eventId,
    claim:
      "Large data centers can create substantial new electricity demand and require grid planning.",
    context:
      "This is a general risk supported by national research; the actual load and rate impact must be established for each Michigan proposal.",
    classification: "general_risk",
    evidenceStrength: "strong",
    sourceDocumentIds: [sourceIds[2]],
    sortOrder: 0,
  })
  await ctx.db.insert("evidenceClaims", {
    eventId,
    claim:
      "Michigan local approvals can address water, noise, backup generation, tax, and decommissioning conditions.",
    context:
      "The University of Michigan guide identifies questions and policy tools; it does not establish that every project will cause each impact.",
    classification: "documented_local_impact",
    evidenceStrength: "moderate",
    sourceDocumentIds: [sourceIds[0]],
    sortOrder: 1,
  })

  const existingActions = await ctx.db
    .query("civicActions")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect()
  for (const action of existingActions) await ctx.db.delete(action._id)
  await ctx.db.insert("civicActions", {
    eventId,
    title: "Ask for maximum-demand disclosures before a vote",
    description:
      "Request peak electric load, maximum daily water use, backup-generator testing, noise modeling, tax concessions, and permanent job counts in the public packet.",
    actionKind: "email",
    audience: "Township board or planning commission",
    ctaLabel: "Open the Michigan local guide",
    ctaUrl: sources[0].url,
    script:
      "Before any vote, please publish maximum daily water demand, peak electric load, backup-generator plans, noise modeling, tax concessions, and separate permanent jobs from temporary construction work.",
    sourceDocumentIds: [sourceIds[0]],
    sortOrder: 0,
  })
  await ctx.db.insert("civicActions", {
    eventId,
    title: "Find the responsible local body and its next agenda",
    description:
      "Use the statewide tracker to identify the community, then verify meeting dates and public-comment rules on the local government's official site.",
    actionKind: "research",
    audience: "Michigan residents and local organizers",
    ctaLabel: "Open Michigan tracker",
    ctaUrl: sources[1].url,
    sourceDocumentIds: [sourceIds[0], sourceIds[1]],
    sortOrder: 1,
  })

  return {
    jurisdictions: jurisdictions.length,
    sources: sourceIds.length,
    eventId,
  }
}
