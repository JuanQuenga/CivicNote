export type TopicSource = {
  title: string
  publisher: string
  year: number
  url: string
  note: string
}

export type TopicStat = {
  value: string
  label: string
  sourceIndexes: Array<number>
}

export type TopicArgument = {
  title: string
  claim: string
  counterpoint: string
  sourceIndexes: Array<number>
}

export type TopicFinding = {
  title: string
  body: string
  sourceIndexes: Array<number>
}

export type TopicStatusBrief = {
  headline: string
  summary: string
  latestDevelopment: string
  nextDecisionPoint: string
  whoCanAct: string
  urgency: "low" | "medium" | "high"
  lastChecked: string
}

export type TopicAction = {
  title: string
  description: string
  audience: string
  difficulty: string
  urgency: "low" | "medium" | "high"
  ctaLabel: string
  ctaUrl?: string
  script: string
}

export type TopicTimelineItem = {
  date: string
  title: string
  description: string
  sourceIndexes: Array<number>
}

export type TopicUpdate = {
  title: string
  publisher: string
  publishedAt: string
  url: string
  summary: string
  tag: string
}

export type TopicModule =
  | {
      type: "briefing"
      title: string
      eyebrow: string
      body: Array<string>
      bullets?: Array<string>
      sourceIndexes?: Array<number>
    }
  | {
      type: "statGrid"
      title: string
      eyebrow: string
      stats: Array<TopicStat>
    }
  | {
      type: "evidenceMatrix"
      title: string
      eyebrow: string
      summary?: string
      rows: Array<{
        label: string
        evidence: string
        caveat: string
        sourceIndexes: Array<number>
      }>
    }
  | {
      type: "claimLedger"
      title: string
      eyebrow: string
      rows: Array<{
        claim: string
        status: "documented" | "contested" | "unsupported" | "watch"
        finding: string
        sourceIndexes: Array<number>
      }>
    }
  | {
      type: "tracker"
      title: string
      eyebrow: string
      columns: Array<string>
      rows: Array<{
        cells: Array<string>
        sourceIndexes: Array<number>
      }>
    }
  | {
      type: "moneyTrail"
      title: string
      eyebrow: string
      rows: Array<{
        actor: string
        mechanism: string
        impact: string
        sourceIndexes: Array<number>
      }>
    }
  | {
      type: "policyLevers"
      title: string
      eyebrow: string
      levers: Array<{
        actor: string
        lever: string
        pressurePoint: string
        sourceIndexes: Array<number>
      }>
    }
  | {
      type: "actionList"
      title: string
      eyebrow: string
      actions: Array<TopicAction>
    }
  | {
      type: "timeline"
      title: string
      eyebrow: string
      items: Array<TopicTimelineItem>
    }

export type ResearchTopic = {
  slug: string
  topicNumber: string
  title: string
  shortTitle: string
  tagline: string
  summary: string
  region: string
  status: string
  theme: "ethics" | "surveillance" | "infrastructure" | "future"
  updatedAt: string
  stats: Array<TopicStat>
  arguments: Array<TopicArgument>
  findings: Array<TopicFinding>
  statusBrief: TopicStatusBrief
  actions: Array<TopicAction>
  timeline: Array<TopicTimelineItem>
  updates: Array<TopicUpdate>
  modules: Array<TopicModule>
  sources: Array<TopicSource>
}

export const seedTopics: Array<ResearchTopic> = [
  {
    slug: "congressional-stock-trading",
    topicNumber: "01",
    title: "Ban Congressional Stock Trading",
    shortTitle: "Congressional Stock Trading",
    tagline: "Public office should not double as a private market advantage.",
    summary:
      "This topic tracks the case for banning individual stock trading by members of Congress, their spouses, and dependents, including the salary argument, the public-support record, and the bill-tracking path for forcing floor action.",
    region: "United States",
    status: "Federal ethics reform",
    theme: "ethics",
    updatedAt: "2026-05-12",
    stats: [
      {
        value: "$174K",
        label: "Base salary for a member of Congress",
        sourceIndexes: [0],
      },
      {
        value: "71-77%",
        label:
          "Voter support for banning congressional stock trading across party groups",
        sourceIndexes: [1],
      },
      {
        value: "218",
        label: "House discharge signatures needed to force a floor vote",
        sourceIndexes: [2],
      },
    ],
    arguments: [
      {
        title: "The insider-access problem",
        claim:
          "Members of Congress routinely receive market-moving briefings, shape federal spending, and vote on industry-specific rules while still being allowed to hold or trade individual securities.",
        counterpoint:
          "Broad-market funds, blind trusts, and diversified retirement accounts let officials build wealth without betting on companies affected by their public duties.",
        sourceIndexes: [2, 3],
      },
      {
        title: "The salary argument is not enough",
        claim:
          "Opponents of a trading ban often argue that congressional pay has been frozen and that members need investment flexibility.",
        counterpoint:
          "A $174,000 salary remains far above the typical worker's earnings, and financial pressure does not justify conflicts of interest in public office.",
        sourceIndexes: [0],
      },
    ],
    findings: [
      {
        title: "The reform path already exists",
        body: "Congress can ban covered officials from owning or trading individual stocks while still permitting diversified funds, Treasury securities, and properly structured blind trusts.",
        sourceIndexes: [2, 3],
      },
      {
        title: "The politics are cross-partisan",
        body: "Polling has shown strong support for a ban among Republican, Democratic, and independent voters.",
        sourceIndexes: [1],
      },
      {
        title: "Disclosure alone is not a cure",
        body: "Public transaction reports can reveal trades after the fact, but delayed transparency does not remove the conflict created by owning affected assets while legislating.",
        sourceIndexes: [3],
      },
    ],
    statusBrief: {
      headline: "The fix is already on the table",
      summary:
        "This issue needs clear yes-or-no answers from members of Congress, not more vague concern.",
      latestDevelopment:
        "The most useful check is still the official House record: bill movement, petition signatures, and financial disclosures.",
      nextDecisionPoint:
        "Whether members will back a ban that also covers spouses, dependents, and individual stocks.",
      whoCanAct: "Constituents, ethics groups, and congressional offices",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Ask for a public position",
        description:
          "Get your representative on record about a ban that covers spouses and dependents.",
        audience: "Constituents",
        difficulty: "5 minutes",
        urgency: "high",
        ctaLabel: "Find Representative",
        ctaUrl:
          "https://www.house.gov/representatives/find-your-representative",
        script:
          "Do you support a congressional stock-trading ban that covers members, spouses, and dependents while preserving diversified funds and blind trusts?",
      },
      {
        title: "Check the official record",
        description:
          "Use the House Clerk source to verify whether a discharge petition is active and who has signed.",
        audience: "Researchers",
        difficulty: "10 minutes",
        urgency: "medium",
        ctaLabel: "Open Clerk",
        ctaUrl: "https://clerk.house.gov/DischargePetition",
        script:
          "I am tracking the public record for stock-trading reform. Has this office signed or committed to signing any active discharge petition?",
      },
      {
        title: "Use disclosures to show the problem",
        description:
          "Treat transaction reports as conflict evidence to organize around, not as a substitute for reform.",
        audience: "Watchdogs",
        difficulty: "30 minutes",
        urgency: "medium",
        ctaLabel: "Open Disclosures",
        ctaUrl: "https://disclosures-clerk.house.gov/",
        script:
          "This disclosure shows why delayed reporting is not enough. Will your office support removing the conflict before trades happen?",
      },
    ],
    timeline: [
      {
        date: "2024",
        title: "Cross-party support stays high",
        description:
          "Polling has shown large majorities across party groups supporting a congressional stock-trading ban.",
        sourceIndexes: [1],
      },
      {
        date: "2025",
        title: "Salary context remains part of the debate",
        description:
          "CRS salary material gives the baseline for evaluating claims that member pay requires trading flexibility.",
        sourceIndexes: [0],
      },
      {
        date: "2026",
        title: "Official House records are the place to check",
        description:
          "The Clerk's discharge-petition and disclosure systems are the source of record for pressure campaigns.",
        sourceIndexes: [2, 3],
      },
    ],
    updates: [
      {
        title: "Verify discharge pressure through the House Clerk",
        publisher: "Office of the Clerk, U.S. House",
        publishedAt: "2026-05-19",
        url: "https://clerk.house.gov/DischargePetition",
        summary:
          "The most useful current check is whether a reform petition exists and which members have signed.",
        tag: "Bill tracking",
      },
      {
        title: "Financial disclosures show why the rule matters",
        publisher: "U.S. House Clerk",
        publishedAt: "2026-05-19",
        url: "https://disclosures-clerk.house.gov/",
        summary:
          "Transaction disclosures can document conflicts after the fact, which supports the case for preemptive rules.",
        tag: "Disclosure",
      },
    ],
    modules: [
      {
        type: "briefing",
        eyebrow: "What is wrong",
        title: "The problem is built into the rules",
        body: [
          "A member can comply with disclosure rules and still hold assets affected by committee work, classified or closed-door briefings, federal contracts, appropriations, and agency oversight.",
          "The useful reform frame is ownership and trading restrictions for officials, spouses, and dependents, with clear carve-outs for broad funds, Treasury securities, and qualified blind trusts.",
        ],
        bullets: [
          "Disclosure reports are evidence of the problem, not the remedy.",
          "The House Clerk is the pressure source for discharge petitions and transaction reports.",
          "A strong ban has to cover spouses and dependents or it leaves the main workaround intact.",
        ],
        sourceIndexes: [2, 3],
      },
      {
        type: "claimLedger",
        eyebrow: "Common arguments",
        title: "Separate real objections from distractions",
        rows: [
          {
            claim:
              "Members need individual-stock flexibility because congressional pay is frozen.",
            status: "contested",
            finding:
              "The salary baseline is real, but it does not justify holding assets directly affected by legislative power.",
            sourceIndexes: [0],
          },
          {
            claim:
              "Disclosure is enough because the public can inspect trades.",
            status: "unsupported",
            finding:
              "Delayed disclosure exposes conflicts after the fact; it does not prevent conflicted ownership or trading before votes and briefings.",
            sourceIndexes: [3],
          },
          {
            claim: "A ban can preserve ordinary retirement investing.",
            status: "documented",
            finding:
              "The reform lane already distinguishes individual securities from diversified funds and blind trusts.",
            sourceIndexes: [2, 3],
          },
        ],
      },
      {
        type: "policyLevers",
        eyebrow: "Next moves",
        title: "Where people can push",
        levers: [
          {
            actor: "Constituents",
            lever:
              "Get a public yes/no on a ban covering spouses and dependents.",
            pressurePoint:
              "District offices are sensitive to simple conflict questions that can be quoted back later.",
            sourceIndexes: [2],
          },
          {
            actor: "Researchers",
            lever:
              "Tie transaction disclosures to committee assignments and votes.",
            pressurePoint:
              "The most persuasive examples show a direct policy jurisdiction, not just a large trade.",
            sourceIndexes: [3],
          },
          {
            actor: "Ethics groups",
            lever:
              "Track discharge petitions and bill text, not only press statements.",
            pressurePoint:
              "Official Clerk records show whether members are moving the bill or only endorsing the idea.",
            sourceIndexes: [2],
          },
        ],
      },
    ],
    sources: [
      {
        title: "Congressional Salaries and Allowances",
        publisher: "Congressional Research Service",
        year: 2025,
        url: "https://crsreports.congress.gov/",
        note: "Salary baseline for member-compensation claims.",
      },
      {
        title: "Congressional Stock Trading Polling",
        publisher: "YouGov / The Economist",
        year: 2024,
        url: "https://today.yougov.com/",
        note: "Cross-party public-support snapshot.",
      },
      {
        title: "House Discharge Petitions",
        publisher: "Office of the Clerk, U.S. House",
        year: 2026,
        url: "https://clerk.house.gov/DischargePetition",
        note: "Official place to verify signatures when a discharge petition is active.",
      },
      {
        title: "Financial Disclosure Reports",
        publisher: "U.S. House Clerk",
        year: 2026,
        url: "https://disclosures-clerk.house.gov/",
        note: "Primary disclosure source for House personal financial transactions.",
      },
    ],
  },
  {
    slug: "michigan-surveillance-stack",
    topicNumber: "02",
    title: "Map America's Surveillance Stack",
    shortTitle: "Surveillance Stack",
    tagline:
      "Flock cameras are the visible layer. The networked data system runs deeper.",
    summary:
      "This civil-liberties topic tracks automatic license plate readers, private camera networks, real-time crime centers, data fusion platforms, and AI interfaces that make routine movement searchable across agencies and state lines.",
    region: "United States",
    status: "State and local surveillance oversight",
    theme: "surveillance",
    updatedAt: "2026-05-13",
    stats: [
      {
        value: "125+",
        label:
          "Michigan cities and counties reported using ALPR cameras, with similar deployments tracked nationwide",
        sourceIndexes: [0],
      },
      {
        value: "12M+",
        label: "Flock searches analyzed in EFF audit logs",
        sourceIndexes: [1],
      },
      {
        value: "3,900+",
        label: "Agencies represented in those audit logs",
        sourceIndexes: [1],
      },
    ],
    arguments: [
      {
        title: "The topic is network effect",
        claim:
          "A single camera may look local, but shared hotlists, regional access, and searchable audit trails can turn local capture into statewide or national surveillance.",
        counterpoint:
          "Oversight has to cover retention, sharing, outside-agency access, audit logs, and later software integrations, not only the pole-mounted hardware.",
        sourceIndexes: [0, 1],
      },
      {
        title: "Data fusion changes the stakes",
        claim:
          "When ALPR, CAD, RMS, jail, public-record, private-video, and open-source data are searched together, routine records can become investigative profiles.",
        counterpoint:
          "Public approval should be required before agencies add fusion, AI search, facial recognition, or real-time crime center integrations to existing camera programs.",
        sourceIndexes: [2, 3, 4],
      },
    ],
    findings: [
      {
        title: "ALPR deployment is already widespread",
        body: "State reporting says more than 125 Michigan cities and counties use ALPR cameras, while crowdsourced maps and public records show similar systems across the country.",
        sourceIndexes: [0, 5],
      },
      {
        title: "The vendor stack is broader than Flock",
        body: "Flock Nova, Palantir Gotham and AIP, Axon Fusus, Rekor Scout, and Clearview AI are related parts of the surveillance marketplace.",
        sourceIndexes: [2, 3, 4, 6, 7],
      },
      {
        title: "Auditability is the public-pressure point",
        body: "Organizers can ask who searched, why they searched, what outside agencies had access, and whether protest or immigration-related lookups occurred.",
        sourceIndexes: [1, 5],
      },
    ],
    statusBrief: {
      headline: "The rules need to cover the whole network",
      summary:
        "This is not just about approving cameras. It is about retention, sharing, audit logs, outside access, and the AI tools that can get added later.",
      latestDevelopment:
        "State reporting, crowdsourced camera maps, and civil-liberties groups now show ALPRs as part of a wider searchable surveillance system.",
      nextDecisionPoint:
        "Whether local governments require public approval before adding AI, data-sharing, real-time crime center, or facial-recognition tools.",
      whoCanAct:
        "Residents, city councils, county boards, and public-records requesters",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Ask for the operating record",
        description:
          "Ask for contracts, retention schedules, sharing agreements, and audit logs before any expansion vote.",
        audience: "Residents",
        difficulty: "20 minutes",
        urgency: "high",
        ctaLabel: "Read ALPR Reporting",
        ctaUrl:
          "https://www.michiganpublic.org/criminal-justice-legal-system/2026-04-08/police-say-license-plate-cameras-help-them-solve-crimes-but-residents-and-lawmakers-raise-concerns-over-privacy-data-sharing",
        script:
          "Please provide the current ALPR contract, data-retention policy, outside-agency sharing policy, hotlist policy, and the last 12 months of audit logs.",
      },
      {
        title: "Ask for a vote before systems are connected",
        description:
          "Separate basic camera use from AI search, data fusion, facial recognition, and real-time crime center integrations.",
        audience: "Local officials",
        difficulty: "15 minutes",
        urgency: "high",
        ctaLabel: "Review AI Policing Risks",
        ctaUrl:
          "https://www.brennancenter.org/our-work/research-reports/dangers-unregulated-ai-policing",
        script:
          "Will this agency commit to a public vote before adding AI search, data fusion, facial recognition, or real-time crime center integrations?",
      },
      {
        title: "List every connected system",
        description:
          "Document cameras, vendors, connected agencies, and search permissions before debating additional hardware.",
        audience: "Researchers",
        difficulty: "1-2 hours",
        urgency: "medium",
        ctaLabel: "Open EFF Analysis",
        ctaUrl:
          "https://www.eff.org/deeplinks/2025/11/how-cops-are-using-flock-safetys-alpr-network-surveil-protesters-and-activists",
        script:
          "A camera map is incomplete without the data-sharing map. Which agencies can search local scans, and under what written limits?",
      },
    ],
    timeline: [
      {
        date: "2025",
        title: "AI policing warnings sharpen",
        description:
          "Policy groups warned that unregulated AI tools can turn ordinary police records into broader investigative profiles.",
        sourceIndexes: [4],
      },
      {
        date: "2026",
        title: "ALPR deployment is publicly documented",
        description:
          "State reporting placed ALPR use across more than 125 Michigan cities and counties, while public mapping projects track reported ALPR locations across all states.",
        sourceIndexes: [0, 5],
      },
      {
        date: "2026",
        title: "Audit logs become the accountability lever",
        description:
          "EFF analysis of Flock audit logs put searches, outside agencies, and protest-related use at the center of the oversight debate.",
        sourceIndexes: [1],
      },
    ],
    updates: [
      {
        title: "ALPR privacy concerns move into mainstream reporting",
        publisher: "Michigan Public",
        publishedAt: "2026-04-08",
        url: "https://www.michiganpublic.org/criminal-justice-legal-system/2026-04-08/police-say-license-plate-cameras-help-them-solve-crimes-but-residents-and-lawmakers-raise-concerns-over-privacy-data-sharing",
        summary:
          "Coverage highlights local law-enforcement claims, resident privacy concerns, and data-sharing questions.",
        tag: "Michigan",
      },
      {
        title: "Civil-liberties groups focus on Flock audit logs",
        publisher: "Electronic Frontier Foundation",
        publishedAt: "2025-11-01",
        url: "https://www.eff.org/deeplinks/2025/11/how-cops-are-using-flock-safetys-alpr-network-surveil-protesters-and-activists",
        summary:
          "Audit-log analysis turns the oversight question toward who searched, why, and across which agencies.",
        tag: "Audit logs",
      },
    ],
    modules: [
      {
        type: "briefing",
        eyebrow: "How it works",
        title: "The public sees cameras, but the product is query power",
        body: [
          "A license-plate reader debate that stops at camera placement misses the main civil-liberties problem: who can search the scans, which hotlists trigger stops, how long the records live, and what other databases get connected later.",
          "The national issue is therefore a stack: ALPR collection, vendor-hosted storage, outside-agency access, audit logs, fusion platforms, real-time crime center integration, and AI search interfaces.",
        ],
        bullets: [
          "Camera approval should not silently authorize data fusion.",
          "Audit logs are the accountability document residents should request first.",
          "Every integration layer should require a separate public vote.",
        ],
        sourceIndexes: [0, 1, 4],
      },
      {
        type: "tracker",
        eyebrow: "System checklist",
        title: "What to ask about each layer",
        columns: ["Layer", "Risk", "Oversight question"],
        rows: [
          {
            cells: [
              "ALPR cameras",
              "Routine travel becomes searchable location history.",
              "What is captured, retained, and deleted?",
            ],
            sourceIndexes: [0, 5, 8],
          },
          {
            cells: [
              "Vendor network access",
              "Outside agencies can query local scans without local democratic review.",
              "Which agencies have access and what purpose codes are required?",
            ],
            sourceIndexes: [1],
          },
          {
            cells: [
              "Fusion and AI tools",
              "Separate records become investigative profiles.",
              "Will the agency require a public vote before adding AI or fusion products?",
            ],
            sourceIndexes: [2, 3, 4, 6],
          },
          {
            cells: [
              "Facial-recognition search",
              "Identity search can be layered onto camera and public-record systems.",
              "Is facial recognition prohibited, permitted, or subject to a warrant rule?",
            ],
            sourceIndexes: [4, 7],
          },
        ],
      },
      {
        type: "evidenceMatrix",
        eyebrow: "Public records",
        title: "What people can prove with records",
        summary:
          "The most useful record requests ask for operating documents, not generic assurances.",
        rows: [
          {
            label: "Deployment scale",
            evidence:
              "Michigan reporting places ALPR use across more than 125 local governments, and public camera maps track reported ALPR/Flock locations nationally.",
            caveat:
              "Counts change quickly as contracts are signed, cancelled, or expanded.",
            sourceIndexes: [0, 5],
          },
          {
            label: "Search behavior",
            evidence:
              "Audit logs can show queries, agency names, stated reasons, and outside access.",
            caveat:
              "Logs may be incomplete if vendors or agencies redact fields heavily.",
            sourceIndexes: [1],
          },
          {
            label: "Integration creep",
            evidence:
              "Vendor materials show ALPR, real-time crime center, AI, and fusion tools marketed as connected investigative products.",
            caveat:
              "A local camera contract does not automatically mean every product is deployed.",
            sourceIndexes: [2, 3, 6, 7],
          },
        ],
      },
      {
        type: "policyLevers",
        eyebrow: "Local rules",
        title: "Rules that stop quiet expansion",
        levers: [
          {
            actor: "City council",
            lever: "Require a surveillance impact report before procurement.",
            pressurePoint:
              "Force retention, sharing, hotlists, audits, and integrations into the public packet.",
            sourceIndexes: [0, 5],
          },
          {
            actor: "County board",
            lever:
              "Ban outside-agency access without a written agreement and public log.",
            pressurePoint:
              "The network effect depends on quiet cross-jurisdiction querying.",
            sourceIndexes: [1],
          },
          {
            actor: "Residents",
            lever: "Ask for audit logs every quarter.",
            pressurePoint:
              "The logs show whether the stated use case matches actual search behavior.",
            sourceIndexes: [1],
          },
        ],
      },
    ],
    sources: [
      {
        title:
          "Police say license plate cameras help them solve crimes, but residents and lawmakers raise concerns",
        publisher: "Michigan Public",
        year: 2026,
        url: "https://www.michiganpublic.org/criminal-justice-legal-system/2026-04-08/police-say-license-plate-cameras-help-them-solve-crimes-but-residents-and-lawmakers-raise-concerns-over-privacy-data-sharing",
        note: "Michigan deployment and privacy reporting.",
      },
      {
        title:
          "How Cops Are Using Flock Safety's ALPR Network to Surveil Protesters and Activists",
        publisher: "Electronic Frontier Foundation",
        year: 2026,
        url: "https://www.eff.org/deeplinks/2025/11/how-cops-are-using-flock-safetys-alpr-network-surveil-protesters-and-activists",
        note: "Audit-log analysis of searches across agencies.",
      },
      {
        title: "Flock Nova",
        publisher: "Flock Safety",
        year: 2026,
        url: "https://www.flocksafety.com/products/flock-nova",
        note: "Vendor description of search and investigation product.",
      },
      {
        title: "Palantir Platforms",
        publisher: "Palantir",
        year: 2026,
        url: "https://www.palantir.com/docs/foundry/architecture-center/platforms",
        note: "Vendor documentation for data and AI operations layers.",
      },
      {
        title: "The Dangers of Unregulated AI in Policing",
        publisher: "Brennan Center for Justice",
        year: 2025,
        url: "https://www.brennancenter.org/our-work/research-reports/dangers-unregulated-ai-policing",
        note: "Policy analysis of AI policing risks.",
      },
      {
        title:
          "Unregulated license plate readers are tracking Michigan drivers",
        publisher: "Michigan Advance",
        year: 2026,
        url: "https://michiganadvance.com/2026/03/06/unregulated-license-plate-readers-are-tracking-michigan-drivers-heres-whats-at-stake/",
        note: "State legal-gap framing.",
      },
      {
        title: "Axon Fusus",
        publisher: "Axon",
        year: 2026,
        url: "https://www.axon.com/partners/fusus2",
        note: "Vendor page for real-time crime center integrations.",
      },
      {
        title: "Clearview AI 2.0",
        publisher: "Clearview AI",
        year: 2026,
        url: "https://www.clearview.ai/clearview-2-0",
        note: "Vendor page describing facial-recognition search.",
      },
      {
        title: "DeFlock ALPR Map",
        publisher: "DeFlock / ALPR Watch",
        year: 2026,
        url: "https://deflock.me/map",
        note: "Crowdsourced national map for reported ALPR and Flock camera locations.",
      },
    ],
  },
  {
    slug: "michigan-data-centers",
    topicNumber: "03",
    title: "Data Centers Before Megawatts",
    shortTitle: "Data Centers",
    tagline:
      "Communities should know the water, power, noise, and tax tradeoffs before approvals.",
    summary:
      "This infrastructure-accountability topic tracks local impacts from AI and cloud data-center buildouts: water demand, grid upgrades, ratepayer exposure, diesel backup, waste heat, noise, land use, tax breaks, rushed approvals, and jobs claims.",
    region: "Michigan and U.S.",
    status: "Land use, utilities, and local control",
    theme: "infrastructure",
    updatedAt: "2026-05-19",
    stats: [
      {
        value: "5M",
        label: "Gallons per day a large data center campus can consume",
        sourceIndexes: [4, 8],
      },
      {
        value: "176 TWh",
        label:
          "U.S. data-center electricity use in 2023, estimated by Berkeley Lab",
        sourceIndexes: [3],
      },
      {
        value: "9 GW",
        label: "Full-buildout power scale proposed for Utah's Stratos campus",
        sourceIndexes: [13, 14],
      },
    ],
    arguments: [
      {
        title: "Local systems take the first hit",
        claim:
          "Large campuses can demand new water, sewer, substation, transmission, road, and emergency-service capacity before residents see durable benefits.",
        counterpoint:
          "Approvals should force companies and utilities to disclose maximum demand, expansion scenarios, and who pays for upgrades.",
        sourceIndexes: [0, 1, 2, 3],
      },
      {
        title: "Jobs claims need separation",
        claim:
          "Construction jobs can be significant, but permanent operations jobs are usually small compared with the land, power, water, and tax concessions involved.",
        counterpoint:
          "Communities should compare permanent local jobs and enforceable benefits against abatements, school-revenue losses, and ratepayer risk.",
        sourceIndexes: [0, 9, 10],
      },
    ],
    findings: [
      {
        title: "Power and heat are now planning topics",
        body: "Berkeley Lab reported U.S. data centers used 176 TWh of electricity in 2023, while Utah's proposed Stratos campus shows how hyperscale projects can raise local questions about gigawatt-scale power plants, waste heat, and thermal plumes.",
        sourceIndexes: [3, 13, 14],
      },
      {
        title: "Water, noise, and diesel backup are quality-of-life topics",
        body: "Cooling demand, generator testing, constant equipment noise, diesel exhaust, and dry-cooling tradeoffs can all become everyday local impacts that zoning rules and environmental permits can address.",
        sourceIndexes: [4, 5, 6, 8, 15],
      },
      {
        title: "Michigan communities need approval leverage",
        body: "Local governments can use moratoria, special land-use standards, utility disclosures, tax-transparency rules, and enforceable community-benefit agreements before approvals are locked in.",
        sourceIndexes: [1, 2, 11, 12],
      },
    ],
    statusBrief: {
      headline: "Communities have leverage before the vote",
      summary:
        "The best time to ask hard questions is before zoning, utility, tax, and infrastructure commitments are locked in.",
      latestDevelopment:
        "Utah's Stratos debate added a new warning sign: local approvals can move faster than independent public analysis of power, water, heat, air, and wildlife impacts.",
      nextDecisionPoint:
        "Whether communities require water, power, waste-heat, air, diesel, noise, tax, and permanent-jobs details before approvals.",
      whoCanAct:
        "Township boards, planning commissions, utility regulators, and residents",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Ask for the biggest power-use number",
        description:
          "Get peak electric load, daily water demand, waste-heat assumptions, backup-generator plans, and noise modeling into the public packet.",
        audience: "Residents",
        difficulty: "15 minutes",
        urgency: "high",
        ctaLabel: "Open Local Guide",
        ctaUrl: "https://graham.umich.edu/product/michigan-data-centers-guide",
        script:
          "Before any vote, please publish maximum daily water demand, peak electric load, waste-heat assumptions, diesel backup plans, generator testing schedules, and noise modeling.",
      },
      {
        title: "Follow the tax breaks and public costs",
        description:
          "Separate company-paid upgrades from utility-ratepayer exposure and school-revenue losses.",
        audience: "Local officials",
        difficulty: "30 minutes",
        urgency: "high",
        ctaLabel: "Review Tax Report",
        ctaUrl:
          "https://goodjobsfirst.org/wp-content/uploads/2026/04/Data-Center-Tax-Abatements-Why-States-and-Localities-Must-Disclose-These-Soaring-Revenue-Losses.pdf",
        script:
          "What tax abatements, special rates, grid upgrades, road upgrades, and school-revenue impacts are attached to this project, and who pays for each?",
      },
      {
        title: "Split construction from permanent jobs",
        description:
          "Require separate counts for temporary construction labor, permanent operations roles, and enforceable local hiring.",
        audience: "Journalists",
        difficulty: "10 minutes",
        urgency: "medium",
        ctaLabel: "Read Rural Impact Analysis",
        ctaUrl:
          "https://www.brookings.edu/articles/local-implications-data-centers-rural-communities-us/",
        script:
          "Please separate temporary construction jobs from permanent local operations jobs and identify which jobs are enforceable local commitments.",
      },
    ],
    timeline: [
      {
        date: "2025",
        title: "Community-impact research sets the checklist",
        description:
          "University and public-policy sources documented water, power, noise, tax, and local-control considerations.",
        sourceIndexes: [0, 1],
      },
      {
        date: "2026",
        title: "Michigan tracker follows moratoria and grid concerns",
        description:
          "Public media coverage created a running reference point for legislation, moratoria, and grid-impact debates.",
        sourceIndexes: [2],
      },
      {
        date: "2026",
        title: "Utah Stratos debate exposes heat-island concerns",
        description:
          "Salt Lake Tribune coverage and public technical analysis focused attention on gigawatt-scale waste heat, Great Salt Lake vulnerability, water-rights claims, and air-pollution estimates.",
        sourceIndexes: [13, 14, 15],
      },
      {
        date: "2026",
        title: "Large Michigan proposals escalate local stakes",
        description:
          "Reporting on the Saline Township proposal connected farmland, energy, climate, and local approval politics.",
        sourceIndexes: [11, 12],
      },
    ],
    updates: [
      {
        title:
          "Michigan tracker follows moratoria, legislation, and grid impact",
        publisher: "WKAR Public Media",
        publishedAt: "2026-02-27",
        url: "https://www.wkar.org/wkar-news/2026-02-27/michigan-data-center-tracker-moratoria-legislation-and-grid-impact",
        summary:
          "The tracker gives organizers a practical way to follow local policy movement and infrastructure concerns.",
        tag: "Tracker",
      },
      {
        title:
          "Saline Township proposal raises farmland and local-control questions",
        publisher: "Fortune",
        publishedAt: "2026-05-06",
        url: "https://fortune.com/2026/05/06/ai-data-center-michigan-saline-politics-farmland/",
        summary:
          "Coverage of the proposed OpenAI-Oracle campus shows why approvals need scrutiny before commitments become durable.",
        tag: "Local fight",
      },
      {
        title: "Utah Stratos proposal raises heat, water, and air questions",
        publisher: "The Salt Lake Tribune",
        publishedAt: "2026-05-07",
        url: "https://www.sltrib.com/news/environment/2026/05/07/utahs-data-center-could-create/",
        summary:
          "Scientists warned that the proposed hyperscale campus could create a major heat-island problem near the Great Salt Lake.",
        tag: "Utah watch",
      },
    ],
    modules: [
      {
        type: "briefing",
        eyebrow: "Before the vote",
        title:
          "The leverage exists before utility and zoning commitments harden",
        body: [
          "Data-center fights are often presented as ordinary land-use decisions, but the real deal stack includes zoning, water withdrawals, sewer capacity, electric load, transmission upgrades, backup generation, abatements, and emergency services.",
          "The Stratos debate in Utah shows why communities also need waste-heat and air-quality assumptions in the record, especially when projects propose on-site power generation at a scale usually handled by utility planning.",
          "Once a township, utility, and company align on infrastructure assumptions, residents are left debating details after the largest commitments have already become politically expensive to unwind.",
        ],
        bullets: [
          "Separate temporary construction jobs from permanent operations jobs.",
          "Demand maximum-demand numbers, not average-use talking points.",
          "Make companies disclose who pays for grid, road, water, sewer, and tax costs.",
        ],
        sourceIndexes: [0, 1, 2, 9, 10, 13, 14, 15],
      },
      {
        type: "tracker",
        eyebrow: "Impact checklist",
        title: "What each approval should spell out",
        columns: ["Impact", "Document to demand", "Why it matters"],
        rows: [
          {
            cells: [
              "Electric load",
              "Peak MW, expansion phases, generation source, substation and transmission plans.",
              "Ratepayer risk, grid reliability, fuel demand, and air permits depend on maximum demand.",
            ],
            sourceIndexes: [2, 3, 7, 14, 15],
          },
          {
            cells: [
              "Waste heat",
              "Thermal-output estimates, cooling design, plume modeling, and wildlife review.",
              "Large heat releases can become local land-use and ecosystem issues, not just building-engineering details.",
            ],
            sourceIndexes: [13, 14],
          },
          {
            cells: [
              "Water and sewer",
              "Maximum daily withdrawal, cooling design, discharge and drought assumptions.",
              "A campus can stress local systems before residents see benefits.",
            ],
            sourceIndexes: [1, 4, 8, 15],
          },
          {
            cells: [
              "Diesel backup and noise",
              "Generator count, testing schedule, emissions controls, and sound modeling.",
              "Quality-of-life impacts are continuous, local, and enforceable through permits.",
            ],
            sourceIndexes: [5, 6],
          },
          {
            cells: [
              "Tax concessions",
              "Abatements, school-revenue impacts, special rates, and clawbacks.",
              "Permanent jobs may be small relative to public cost.",
            ],
            sourceIndexes: [9, 10],
          },
        ],
      },
      {
        type: "moneyTrail",
        eyebrow: "Who pays",
        title: "Separate company spending from public costs",
        rows: [
          {
            actor: "Developer",
            mechanism:
              "Capital spending, land acquisition, construction contracts, and utility commitments.",
            impact:
              "Headline investment numbers can hide whether upgrades are privately paid or socialized.",
            sourceIndexes: [11, 12],
          },
          {
            actor: "Utility and ratepayers",
            mechanism:
              "Grid upgrades, special tariffs, new generation, and transmission planning.",
            impact:
              "Residents need to know whether ordinary customers subsidize hyperscale load.",
            sourceIndexes: [2, 3, 7],
          },
          {
            actor: "Local tax base",
            mechanism:
              "Abatements and exemptions promoted as recruitment tools.",
            impact:
              "School and municipal revenue losses should be disclosed before votes.",
            sourceIndexes: [9],
          },
        ],
      },
      {
        type: "policyLevers",
        eyebrow: "Local rules",
        title: "Practical standards before a vote",
        levers: [
          {
            actor: "Planning commission",
            lever: "Create special land-use standards for data centers.",
            pressurePoint:
              "Use enforceable conditions for noise, diesel testing, water, expansion, and decommissioning.",
            sourceIndexes: [1],
          },
          {
            actor: "Township board",
            lever: "Adopt a moratorium while standards are drafted.",
            pressurePoint:
              "A temporary pause keeps the community from negotiating under a rushed approval clock.",
            sourceIndexes: [2],
          },
          {
            actor: "Journalists",
            lever: "Ask for permanent jobs, not total job-years.",
            pressurePoint:
              "Construction labor and permanent operations roles should never be merged in one number.",
            sourceIndexes: [10],
          },
        ],
      },
    ],
    sources: [
      {
        title: "What Happens When Data Centers Come to Your Community",
        publisher: "University of Michigan Ford School",
        year: 2025,
        url: "https://stpp.fordschool.umich.edu/sites/stpp/files/2025-07/stpp-data-centers-2025.pdf",
        note: "Community-impact report.",
      },
      {
        title: "What Michigan Local Governments Should Know About Data Centers",
        publisher: "University of Michigan Graham Sustainability Institute",
        year: 2026,
        url: "https://graham.umich.edu/product/michigan-data-centers-guide",
        note: "Michigan local-government guide.",
      },
      {
        title: "Michigan Data Center Tracker",
        publisher: "WKAR Public Media",
        year: 2026,
        url: "https://www.wkar.org/wkar-news/2026-02-27/michigan-data-center-tracker-moratoria-legislation-and-grid-impact",
        note: "Tracker for moratoria, legislation, and grid impact.",
      },
      {
        title:
          "Berkeley Lab Report Evaluates Increase in Electricity Demand from Data Centers",
        publisher: "Lawrence Berkeley National Laboratory",
        year: 2025,
        url: "https://eta.lbl.gov/news/berkeley-lab-report-evaluates-increase-electricity-demand-data-centers",
        note: "Electricity-demand benchmark.",
      },
      {
        title: "Data Centers and Water Consumption",
        publisher: "Environmental and Energy Study Institute",
        year: 2025,
        url: "https://www.eesi.org/articles/view/data-centers-and-water-consumption",
        note: "Water-consumption overview.",
      },
      {
        title:
          "Communities Are Raising Noise Pollution Concerns About Data Centers",
        publisher: "Environmental and Energy Study Institute",
        year: 2026,
        url: "https://www.eesi.org/articles/view/communities-are-raising-noise-pollution-concernsabout-data-centers",
        note: "Noise concern overview.",
      },
      {
        title: "Learn About Impacts of Diesel Exhaust",
        publisher: "U.S. Environmental Protection Agency",
        year: 2025,
        url: "https://www.epa.gov/dera/learn-about-impacts-diesel-exhaust-and-diesel-emissions-reduction-act",
        note: "Health-risk baseline for diesel backup generators.",
      },
      {
        title:
          "Data Center Power Demands Are Contributing to Higher Energy Bills",
        publisher: "Environmental and Energy Study Institute",
        year: 2026,
        url: "https://www.eesi.org/articles/view/h",
        note: "Ratepayer-risk overview.",
      },
      {
        title: "Researcher explores how data centers affect water supply",
        publisher: "Virginia Tech",
        year: 2022,
        url: "https://news.vt.edu/articles/2022/01/Datacenters.html",
        note: "Water-resource research background.",
      },
      {
        title: "Data Center Tax Abatements",
        publisher: "Good Jobs First",
        year: 2026,
        url: "https://goodjobsfirst.org/wp-content/uploads/2026/04/Data-Center-Tax-Abatements-Why-States-and-Localities-Must-Disclose-These-Soaring-Revenue-Losses.pdf",
        note: "Tax-abatement transparency report.",
      },
      {
        title:
          "The local implications of data centers for rural communities in the US",
        publisher: "Brookings",
        year: 2026,
        url: "https://www.brookings.edu/articles/local-implications-data-centers-rural-communities-us/",
        note: "Rural community impact analysis.",
      },
      {
        title:
          "A Michigan farm town voted down plans for a giant OpenAI-Oracle data center",
        publisher: "Fortune",
        year: 2026,
        url: "https://fortune.com/2026/05/06/ai-data-center-michigan-saline-politics-farmland/",
        note: "Saline Township reporting.",
      },
      {
        title: "$7 billion Saline Township data center reignites concern",
        publisher: "Planet Detroit",
        year: 2025,
        url: "https://planetdetroit.org/2025/11/dte-openai-saline-township/",
        note: "Climate and energy planning coverage.",
      },
      {
        title:
          "'Hyperscale' data center could create massive heat island near Great Salt Lake",
        publisher: "The Salt Lake Tribune",
        year: 2026,
        url: "https://www.sltrib.com/news/environment/2026/05/07/utahs-data-center-could-create/",
        note: "Reporting on Stratos heat-island and Great Salt Lake concerns.",
      },
      {
        title: "The Stratos Project",
        publisher: "Utah's Next Chapter",
        year: 2026,
        url: "https://thestratosproject.com/",
        note: "Public technical overview of proposed Stratos scale, power, heat, and timeline.",
      },
      {
        title:
          "Estimated Emissions and Water Consumption from the Proposed Stratos Data Center",
        publisher: "Utah Clean Energy",
        year: 2026,
        url: "https://utahcleanenergy.org/estimated-emissions-and-water-consumption-from-the-proposed-stratos-data-center/",
        note: "Analysis of likely Stratos gas, NOx, emissions, and water impacts based on limited public information.",
      },
    ],
  },
  {
    slug: "glyphosate-health-environment",
    topicNumber: "04",
    title: "Glyphosate, Health, and Public Exposure",
    shortTitle: "Glyphosate",
    tagline:
      "The fight is not only whether glyphosate works. It is who bears the exposure risk.",
    summary:
      "Glyphosate is the most widely used herbicide in the United States and a recurring fight over cancer risk, environmental exposure, worker safety, food residues, labeling, litigation, and regulatory trust. This topic tracks the split between hazard findings, regulatory risk assessments, environmental monitoring, dietary exposure, and local policy options.",
    region: "United States",
    status: "Pesticide regulation and public-health oversight",
    theme: "future",
    updatedAt: "2026-05-19",
    stats: [
      {
        value: "Group 2A",
        label:
          "IARC classification for glyphosate: probably carcinogenic to humans",
        sourceIndexes: [0],
      },
      {
        value: "80K+ MT",
        label:
          "Annual U.S. glyphosate use exceeded 80,000 metric tons by 2007 in USGS reporting",
        sourceIndexes: [2],
      },
      {
        value: "2026",
        label:
          "EPA's public glyphosate page was still tracking registration-review mitigation",
        sourceIndexes: [1],
      },
      {
        value: "59%",
        label:
          "Approximate share of FDA corn and soy glyphosate-assignment samples with glyphosate or glufosinate residues",
        sourceIndexes: [6],
      },
    ],
    arguments: [
      {
        title: "Hazard and risk are being blurred",
        claim:
          "IARC classified glyphosate as a probable human carcinogen based on published hazard evidence, while EPA has said glyphosate is not likely to be carcinogenic to humans when used according to label directions.",
        counterpoint:
          "A credible public topic should show both frames: hazard classification asks whether a substance can cause cancer under some conditions, while regulatory risk assessment asks whether expected uses create unacceptable risk.",
        sourceIndexes: [0, 1, 3],
      },
      {
        title: "Exposure is the accountability question",
        claim:
          "Even when regulators disagree on cancer classification, glyphosate and its breakdown product AMPA have been found widely enough in the environment to justify monitoring and disclosure.",
        counterpoint:
          "Local policy can focus on reducing avoidable exposure near schools, parks, waterways, workers, and drift-prone applications without pretending the scientific dispute is simple.",
        sourceIndexes: [2, 4],
      },
      {
        title: "Food residues are a legal design choice",
        claim:
          "Glyphosate can make it back to consumers through residues in or on treated food and feed commodities, especially where crops are engineered for glyphosate tolerance or treated close to harvest under allowed labels.",
        counterpoint:
          "EPA treats this as a tolerance-setting and dietary-risk problem, so the public fight is whether tolerances, monitoring, crop-specific uses, and enforcement reflect real diets and cumulative exposure.",
        sourceIndexes: [5, 6, 7, 8],
      },
    ],
    findings: [
      {
        title: "The science dispute is real, not imaginary",
        body: "IARC, EPA, and European regulators have reached different conclusions because they apply different evidence standards and decision frames.",
        sourceIndexes: [0, 1, 3],
      },
      {
        title: "The public record supports exposure reduction",
        body: "USGS monitoring and summaries describe glyphosate and AMPA moving off-site from agricultural and urban sources into streams, soil, air, and water systems.",
        sourceIndexes: [2, 4],
      },
      {
        title: "Food monitoring is narrower than consumer exposure",
        body: "FDA's special glyphosate assignment found residues in corn and soybean samples while USDA's broader residue program reports most sampled foods below EPA benchmarks; both facts matter because legal compliance is not the same as zero residue.",
        sourceIndexes: [6, 7, 8],
      },
      {
        title: "Regulatory decisions are still the pressure point",
        body: "The most practical organizing asks are updated labels, drift controls, public-use restrictions, worker protections, water monitoring, and transparent pesticide-use records.",
        sourceIndexes: [1, 2],
      },
    ],
    statusBrief: {
      headline: "The practical fight is reducing exposure",
      summary:
        "The useful question is not one big slogan about safety. It is where glyphosate is used, who is exposed, and what rules would reduce that exposure.",
      latestDevelopment:
        "EPA's glyphosate registration-review materials remain the key U.S. regulatory checkpoint, while IARC's cancer classification remains central to public-health campaigns.",
      nextDecisionPoint:
        "Whether federal, state, and local agencies add stronger limits for public spaces, waterways, drift, and occupational exposure.",
      whoCanAct:
        "Local governments, school boards, park agencies, farmworker advocates, water utilities, and EPA commenters",
      urgency: "medium",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Ask for public-space disclosure",
        description:
          "Push schools, parks, and city departments to publish what herbicides they apply, where, when, and under what notice rules.",
        audience: "Residents",
        difficulty: "15 minutes",
        urgency: "medium",
        ctaLabel: "Open EPA Glyphosate",
        ctaUrl:
          "https://www.epa.gov/ingredients-used-pesticide-products/glyphosate",
        script:
          "Please publish current glyphosate-use locations, application dates, product labels, contractor records, and public-notice procedures for schools, parks, and rights-of-way.",
      },
      {
        title: "Target waterways and drift",
        description:
          "Focus local policy on buffers, timing, runoff, storm drains, and applications near sensitive sites.",
        audience: "Local officials",
        difficulty: "30 minutes",
        urgency: "medium",
        ctaLabel: "Read USGS Summary",
        ctaUrl:
          "https://www.usgs.gov/programs/environmental-health-program/science/common-weed-killer-widespread-environment",
        script:
          "Will this agency adopt buffer, runoff, drift, and notice standards for glyphosate applications near waterways, playgrounds, schools, homes, and public trails?",
      },
      {
        title: "Separate what each study is saying",
        description:
          "When organizing, distinguish cancer-hazard classification from regulatory risk findings and use sources for both.",
        audience: "Researchers",
        difficulty: "20 minutes",
        urgency: "low",
        ctaLabel: "Open IARC Monograph",
        ctaUrl: "https://publications.iarc.who.int/549",
        script:
          "This campaign is tracking both the IARC hazard finding and EPA's risk-assessment position. Which standard is the agency relying on, and why?",
      },
      {
        title: "Ask what is tested in food",
        description:
          "Press agencies and retailers for crop-specific glyphosate residue testing, especially grains, beans, and processed foods made from treated commodity crops.",
        audience: "Consumers and researchers",
        difficulty: "20 minutes",
        urgency: "medium",
        ctaLabel: "Read FDA Glyphosate Q&A",
        ctaUrl:
          "https://www.fda.gov/food/pesticides/questions-and-answers-glyphosate",
        script:
          "Which foods are being tested for glyphosate and AMPA residues, how often are grain and soybean-derived products tested, and are results published by commodity and brand-independent sample type?",
      },
    ],
    timeline: [
      {
        date: "2015",
        title: "IARC classifies glyphosate as probably carcinogenic",
        description:
          "The World Health Organization cancer agency placed glyphosate in Group 2A after reviewing human, animal, and mechanistic evidence.",
        sourceIndexes: [0],
      },
      {
        date: "2020",
        title: "EPA issues its interim registration-review decision",
        description:
          "EPA concluded there were no human-health risks of concern when glyphosate is used according to the label and required mitigation measures.",
        sourceIndexes: [1],
      },
      {
        date: "2026",
        title: "Environmental exposure remains the civic hook",
        description:
          "USGS environmental monitoring and EPA label decisions remain practical entry points for public records, local policy, and exposure-reduction campaigns.",
        sourceIndexes: [1, 2, 4],
      },
    ],
    updates: [
      {
        title: "EPA glyphosate registration-review materials remain active",
        publisher: "U.S. Environmental Protection Agency",
        publishedAt: "2026-05-19",
        url: "https://www.epa.gov/ingredients-used-pesticide-products/glyphosate",
        summary:
          "EPA's glyphosate page is the current federal source for registration review, mitigation, and risk-assessment materials.",
        tag: "Regulation",
      },
      {
        title: "IARC monograph remains central to cancer-risk debate",
        publisher: "International Agency for Research on Cancer",
        publishedAt: "2015-07-29",
        url: "https://publications.iarc.who.int/549",
        summary:
          "The IARC monograph is the source document for the probable-carcinogen classification used by many public-health advocates.",
        tag: "Cancer evidence",
      },
    ],
    modules: [
      {
        type: "briefing",
        eyebrow: "How to read it",
        title: "Glyphosate needs two questions at once",
        body: [
          "A serious glyphosate page should not collapse the dispute into a single safety slogan. IARC made a cancer-hazard classification, EPA made a U.S. label-based risk assessment, and environmental monitoring asks a third question about where the chemical and AMPA travel after use.",
          "The public-interest frame is exposure governance: which uses are avoidable, which workers and communities carry the burden, and what monitoring exists before agencies approve continued use.",
        ],
        bullets: [
          "Hazard classification and regulatory risk assessment answer different questions.",
          "Food residues turn this from a farm-only issue into a grocery-store and diet-exposure issue.",
          "Environmental occurrence turns this into a water, parks, schools, and rights-of-way issue.",
          "Local campaigns can win disclosure and public-space limits even while federal science disputes continue.",
        ],
        sourceIndexes: [0, 1, 2, 3, 4, 5, 6, 8],
      },
      {
        type: "evidenceMatrix",
        eyebrow: "Science split",
        title: "What the major evidence lanes say",
        summary:
          "The strongest page presents disagreements plainly and then focuses on exposure reduction.",
        rows: [
          {
            label: "Cancer hazard",
            evidence:
              "IARC classified glyphosate as Group 2A, probably carcinogenic to humans.",
            caveat:
              "Hazard classification does not estimate risk for every labeled use scenario.",
            sourceIndexes: [0, 3],
          },
          {
            label: "U.S. regulatory risk",
            evidence:
              "EPA's public materials continue to frame glyphosate through registration review and label mitigation.",
            caveat:
              "A label-based conclusion depends on compliance, enforcement, and assumptions about exposure.",
            sourceIndexes: [1],
          },
          {
            label: "Environmental movement",
            evidence:
              "USGS summaries describe glyphosate and AMPA in environmental samples including streams and rivers.",
            caveat:
              "Occurrence data alone does not settle health risk; it shows where monitoring and reduction may be warranted.",
            sourceIndexes: [2, 4],
          },
        ],
      },
      {
        type: "tracker",
        eyebrow: "Food residue route",
        title: "How glyphosate can move from the field back onto your plate",
        columns: ["Step", "How residue can remain", "What to demand"],
        rows: [
          {
            cells: [
              "Field use on tolerant crops",
              "Glyphosate can be sprayed over crops engineered or selected to tolerate it, leaving residues governed by crop-specific legal tolerances.",
              "Publish crop-by-crop use, tolerance, and residue-monitoring data together instead of treating them as separate systems.",
            ],
            sourceIndexes: [5, 8],
          },
          {
            cells: [
              "Late-season or harvest-adjacent uses",
              "Where labels allow pre-harvest applications, residues can remain on grain, beans, or other commodities entering storage and processing.",
              "Require clear reporting of pre-harvest uses, pre-harvest intervals, and residue testing for grain and legume commodities.",
            ],
            sourceIndexes: [5, 6, 8],
          },
          {
            cells: [
              "Processing into common foods",
              "Residues on corn, soybeans, oats, wheat, or other commodities can move into ingredients used in processed foods, animal feed, and grocery staples.",
              "Test finished foods and commodity ingredients, not only raw agricultural samples.",
            ],
            sourceIndexes: [6, 7],
          },
          {
            cells: [
              "Legal tolerance compliance",
              "A residue can be legal and still be present; EPA tolerances define the maximum allowed amount, not a promise of no residue.",
              "Show consumers the detected amount, the legal tolerance, and how often that food is tested.",
            ],
            sourceIndexes: [5, 8],
          },
        ],
      },
      {
        type: "evidenceMatrix",
        eyebrow: "Food exposure",
        title: "What official food testing does and does not prove",
        summary:
          "Dietary exposure is regulated through tolerances and monitoring, but the public needs to see what foods are tested, what is not tested, and how residues compare with legal limits.",
        rows: [
          {
            label: "EPA tolerance system",
            evidence:
              "EPA sets legal residue limits for pesticide residues that may remain in or on food and feed commodities.",
            caveat:
              "A tolerance is a legal maximum based on risk assessment assumptions; it is not a zero-residue standard.",
            sourceIndexes: [5, 8],
          },
          {
            label: "FDA glyphosate assignment",
            evidence:
              "FDA reported that roughly 59% of corn and soy samples in its glyphosate/glufosinate assignment had residues, all below EPA tolerances.",
            caveat:
              "That assignment focused on corn, soy, milk, and eggs; it does not answer every processed-food or produce pathway question.",
            sourceIndexes: [6],
          },
          {
            label: "USDA residue monitoring",
            evidence:
              "USDA's 2022 PDP summary reported more than 99% of tested samples below EPA benchmark levels.",
            caveat:
              "The PDP rotates commodities and pesticides; low exceedance rates do not mean every food type is routinely tested for glyphosate.",
            sourceIndexes: [7],
          },
        ],
      },
      {
        type: "tracker",
        eyebrow: "Exposure routes",
        title: "Who may be exposed and what record proves it",
        columns: ["Pathway", "Evidence to request", "Public-health question"],
        rows: [
          {
            cells: [
              "Farm and landscaping workers",
              "Product labels, application logs, PPE rules, training records.",
              "Are workers protected under real-use conditions, not ideal label assumptions?",
            ],
            sourceIndexes: [1],
          },
          {
            cells: [
              "Schools, parks, and rights-of-way",
              "Spray schedules, contractor invoices, public notice, buffer rules.",
              "Can avoidable public-space exposure be reduced or replaced?",
            ],
            sourceIndexes: [1, 2],
          },
          {
            cells: [
              "Food and produce residues",
              "EPA tolerances, FDA/USDA residue data, crop labels, and commodity-specific testing results.",
              "Which foods are tested for glyphosate or AMPA, and are results reported in a way consumers can understand?",
            ],
            sourceIndexes: [5, 6, 7, 8],
          },
          {
            cells: [
              "Streams and stormwater",
              "Water testing, rainfall timing, runoff controls, application maps.",
              "Are waterways monitored where repeated application is likely?",
            ],
            sourceIndexes: [2, 4],
          },
        ],
      },
      {
        type: "policyLevers",
        eyebrow: "Practical rules",
        title: "The next step can be narrower than a total ban",
        levers: [
          {
            actor: "School board",
            lever:
              "Require public notice and integrated pest management before glyphosate use.",
            pressurePoint:
              "Parents can evaluate avoidable exposure only if application records are public.",
            sourceIndexes: [1],
          },
          {
            actor: "City or parks department",
            lever:
              "Restrict routine cosmetic use in parks, playgrounds, and rights-of-way.",
            pressurePoint:
              "Public-space policy can reduce nonessential exposure while federal review continues.",
            sourceIndexes: [1, 2],
          },
          {
            actor: "Water utility",
            lever: "Add glyphosate and AMPA monitoring where use is heavy.",
            pressurePoint:
              "Occurrence data makes monitoring a concrete, source-backed ask.",
            sourceIndexes: [2, 4],
          },
          {
            actor: "Retailers and food agencies",
            lever:
              "Publish glyphosate and AMPA testing for high-use commodity foods and finished products.",
            pressurePoint:
              "Consumers cannot evaluate dietary exposure if monitoring is hidden in broad compliance summaries.",
            sourceIndexes: [6, 7, 8],
          },
        ],
      },
    ],
    sources: [
      {
        title: "IARC Monograph on Glyphosate",
        publisher: "International Agency for Research on Cancer",
        year: 2015,
        url: "https://www.iarc.who.int/featured-news/media-centre-iarc-news-glyphosate/",
        note: "Cancer-hazard classification and evidence summary.",
      },
      {
        title: "Glyphosate",
        publisher: "U.S. Environmental Protection Agency",
        year: 2026,
        url: "https://www.epa.gov/ingredients-used-pesticide-products/glyphosate",
        note: "Current U.S. regulatory status and registration-review materials.",
      },
      {
        title: "Common Weed Killer is Widespread in the Environment",
        publisher: "U.S. Geological Survey",
        year: 2014,
        url: "https://www.usgs.gov/programs/environmental-health-program/science/common-weed-killer-widespread-environment",
        note: "Environmental occurrence and U.S. use trend summary.",
      },
      {
        title: "Glyphosate not classified as a carcinogen by ECHA",
        publisher: "International Agency for Research on Cancer",
        year: 2017,
        url: "https://www.iarc.who.int/news-events/glyphosate-not-classified-as-a-carcinogen-by-echa/",
        note: "Explains the regulatory difference between ECHA and IARC conclusions.",
      },
      {
        title: "Herbicide glyphosate prevalent in U.S. streams and rivers",
        publisher: "U.S. Geological Survey",
        year: 2019,
        url: "https://www.usgs.gov/news/herbicide-glyphosate-prevalent-us-streams-and-rivers",
        note: "Stream and river monitoring context.",
      },
      {
        title: "Glyphosate; tolerances for residues, 40 CFR 180.364",
        publisher: "Electronic Code of Federal Regulations",
        year: 2026,
        url: "https://www.ecfr.gov/current/title-40/chapter-I/subchapter-E/part-180/subpart-C/section-180.364",
        note: "Legal residue tolerances for glyphosate in or on listed food and feed commodities.",
      },
      {
        title: "Questions and Answers on Glyphosate",
        publisher: "U.S. Food and Drug Administration",
        year: 2026,
        url: "https://www.fda.gov/food/pesticides/questions-and-answers-glyphosate",
        note: "FDA summary of glyphosate residue testing in corn, soybeans, milk, and eggs.",
      },
      {
        title: "USDA Releases 2022 Pesticide Data Program Annual Summary",
        publisher: "U.S. Department of Agriculture",
        year: 2024,
        url: "https://www.ams.usda.gov/press-release/usda-releases-2022-pesticide-data-program-annual-summary",
        note: "USDA residue-monitoring compliance summary for tested food samples.",
      },
      {
        title: "Setting Tolerances for Pesticide Residues in Foods",
        publisher: "U.S. Environmental Protection Agency",
        year: 2025,
        url: "https://www.epa.gov/pesticide-tolerances/setting-tolerances-pesticide-residues-foods",
        note: "EPA explanation of how legal residue limits are set for foods and animal feeds.",
      },
    ],
  },
  {
    slug: "israel-gaza-us-influence",
    topicNumber: "05",
    title: "Israel, Gaza, and U.S. Political Influence",
    shortTitle: "Israel and Gaza",
    tagline:
      "Track the legal record, the humanitarian record, and the money trail without flattening them into slogans.",
    summary:
      "This topic covers three linked but distinct questions: allegations and findings that Israel has committed genocide or related international crimes in Gaza, the humanitarian and displacement record in Gaza and the occupied Palestinian territory, and the role of pro-Israel lobbying and campaign spending in U.S. congressional politics.",
    region: "Gaza, Israel, Palestine, and United States",
    status: "International law, human rights, and campaign finance",
    theme: "ethics",
    updatedAt: "2026-05-19",
    stats: [
      {
        value: "3",
        label:
          "ICJ provisional-measures orders issued in South Africa v. Israel during 2024",
        sourceIndexes: [0],
      },
      {
        value: "2025",
        label:
          "UN Commission of Inquiry report concluded Israel committed genocide in Gaza",
        sourceIndexes: [1, 2],
      },
      {
        value: "$53M+",
        label:
          "AIPAC-reported direct support for 361 pro-Israel candidates in the 2024 cycle",
        sourceIndexes: [5],
      },
    ],
    arguments: [
      {
        title: "Use legal findings precisely",
        claim:
          "UN investigators and many human-rights groups have found or alleged genocide in Gaza, while Israel rejects the charge and the ICJ merits case remains pending.",
        counterpoint:
          "The strongest public record says exactly who found what: the ICJ ordered provisional measures, the UN Commission of Inquiry made a genocide finding, and final state responsibility in the ICJ case is still unresolved.",
        sourceIndexes: [0, 1, 2, 3],
      },
      {
        title: "Campaign money is influence, not proof of control",
        claim:
          "AIPAC, United Democracy Project, and other pro-Israel groups have spent heavily in congressional races, especially against candidates viewed as insufficiently supportive of Israel.",
        counterpoint:
          "That spending can be documented through FEC and OpenSecrets-style campaign-finance records without making unsupported claims that any donor group controls Congress.",
        sourceIndexes: [5, 6, 7, 8],
      },
    ],
    findings: [
      {
        title: "The genocide record has moved beyond advocacy language",
        body: "The ICJ found South Africa's claims plausible enough for provisional measures, and a UN Commission of Inquiry later concluded that Israeli authorities and security forces committed genocide in Gaza.",
        sourceIndexes: [0, 1, 2],
      },
      {
        title: "Humanitarian and displacement concerns extend beyond Gaza",
        body: "UN reporting in 2026 raised concerns about ethnic cleansing and forcible transfer in both Gaza and the West Bank, tying displacement, starvation, and destruction to international-law questions.",
        sourceIndexes: [3],
      },
      {
        title: "U.S. congressional politics are measurable",
        body: "AIPAC and related pro-Israel vehicles report major candidate support and outside spending, and news reporting has documented large independent expenditures in specific congressional primaries.",
        sourceIndexes: [5, 6, 7, 8],
      },
    ],
    statusBrief: {
      headline: "There are three separate questions",
      summary:
        "Keep international-law findings, humanitarian facts, and campaign-finance influence separate so each point can be checked and updated.",
      latestDevelopment:
        "UN reporting in 2025 and 2026 escalated findings around genocide, ethnic cleansing concerns, starvation, and forcible transfer, while pro-Israel spending remains active in U.S. races.",
      nextDecisionPoint:
        "Whether U.S. lawmakers condition military aid, enforce human-rights law, disclose lobby-linked funding, or protect criticism of Israeli government policy.",
      whoCanAct:
        "Constituents, journalists, campaign-finance researchers, human-rights lawyers, and congressional offices",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Ask members what rule they are using",
        description:
          "Make offices state how they are evaluating ICJ orders, UN findings, arms transfers, and aid conditions.",
        audience: "Constituents",
        difficulty: "10 minutes",
        urgency: "high",
        ctaLabel: "Open ICJ Case",
        ctaUrl: "https://www.icj-cij.org/case/192",
        script:
          "What rule is this office using to evaluate U.S. military aid to Israel after the ICJ orders and the UN Commission of Inquiry's genocide finding?",
      },
      {
        title: "Track pro-Israel spending by race",
        description:
          "Document direct contributions, independent expenditures, bundled support, and spending through named or shell PACs.",
        audience: "Campaign-finance researchers",
        difficulty: "30 minutes",
        urgency: "medium",
        ctaLabel: "Open FEC Data",
        ctaUrl: "https://www.fec.gov/data/",
        script:
          "For this race, list direct PAC contributions, independent expenditures, top donors, and whether spending supports the candidate or attacks an opponent.",
      },
      {
        title: "Separate antisemitism from policy criticism",
        description:
          "Use precise language: criticism of Israeli government actions and lobby spending is not the same as hostility toward Jewish people.",
        audience: "Organizers",
        difficulty: "15 minutes",
        urgency: "high",
        ctaLabel: "Read UN Report",
        ctaUrl:
          "https://www.un.org/unispal/document/commission-of-inquiry-report-genocide-in-gaza-a-hrc-60-crp-3/",
        script:
          "This request concerns Israeli government policy, U.S. arms and aid decisions, and campaign-finance influence. It does not target Jewish identity or Jewish communities.",
      },
    ],
    timeline: [
      {
        date: "2024-01-26",
        title: "ICJ orders provisional measures",
        description:
          "The Court ordered Israel to prevent acts under the Genocide Convention, prevent and punish incitement, and enable humanitarian assistance.",
        sourceIndexes: [0],
      },
      {
        date: "2025-09-16",
        title: "UN Commission of Inquiry issues genocide finding",
        description:
          "The Commission concluded that Israeli authorities and security forces committed and continued to commit genocide against Palestinians in Gaza.",
        sourceIndexes: [1, 2],
      },
      {
        date: "2026-03",
        title: "Outside spending remains active in congressional primaries",
        description:
          "AP and Axios reporting documented AIPAC-linked spending in 2026 races and the continuing debate over pro-Israel PAC influence.",
        sourceIndexes: [7, 8],
      },
    ],
    updates: [
      {
        title:
          "UN report raises ethnic-cleansing concerns in Gaza and West Bank",
        publisher: "United Nations Human Rights Office",
        publishedAt: "2026-02-19",
        url: "https://palestine.un.org/en/310336-ethnic-cleansing-concerns-gaza-and-west-bank-amid-intensified-violence-and-forcible",
        summary:
          "The report links displacement, starvation, and forcible transfer concerns to possible war crimes, crimes against humanity, and genocide analysis.",
        tag: "Human rights",
      },
      {
        title: "AIPAC-linked spending shapes 2026 Illinois House primaries",
        publisher: "Associated Press",
        publishedAt: "2026-03-17",
        url: "https://apnews.com/article/564cfdd46e0119501939452018be846a",
        summary:
          "Reporting shows continuing debate over pro-Israel super PAC spending in Democratic congressional primaries.",
        tag: "Campaign finance",
      },
    ],
    modules: [
      {
        type: "briefing",
        eyebrow: "Keep separate",
        title:
          "Keep law, humanitarian facts, and U.S. influence in separate lanes",
        body: [
          "The page has to be sharper than a general Israel-Palestine explainer. The legal lane asks what courts and UN investigators found, the humanitarian lane asks what happened to civilians, and the U.S. politics lane asks how money, lobbying, aid, and votes interact.",
          "That separation matters because each lane has a different evidence standard. A UN Commission finding, an ICJ provisional order, a campaign-finance filing, and a congressional vote should not be treated as the same kind of proof.",
        ],
        bullets: [
          "Criticism of Israeli government policy and pro-Israel lobbying is not criticism of Jewish identity.",
          "Use 'genocide finding,' 'genocide allegation,' and 'pending merits case' precisely.",
          "Campaign finance can prove influence channels; it does not prove total control.",
        ],
        sourceIndexes: [0, 1, 2, 3, 5, 7, 8],
      },
      {
        type: "tracker",
        eyebrow: "Court record",
        title: "What the international-law record says",
        columns: ["Forum", "Record", "Status"],
        rows: [
          {
            cells: [
              "International Court of Justice",
              "South Africa v. Israel under the Genocide Convention.",
              "Provisional measures issued; final merits decision remains unresolved.",
            ],
            sourceIndexes: [0, 4],
          },
          {
            cells: [
              "UN Commission of Inquiry",
              "Report concluded Israeli authorities and security forces committed genocide in Gaza.",
              "UN investigative finding; Israel rejects the charge.",
            ],
            sourceIndexes: [1, 2],
          },
          {
            cells: [
              "UN human-rights reporting",
              "Ethnic-cleansing and forcible-transfer concerns in Gaza and the West Bank.",
              "Ongoing reporting tied to war crimes, crimes against humanity, and genocide analysis.",
            ],
            sourceIndexes: [3],
          },
        ],
      },
      {
        type: "moneyTrail",
        eyebrow: "U.S. politics",
        title:
          "The congressional influence trail is campaign finance plus policy votes",
        rows: [
          {
            actor: "AIPAC and affiliated PACs",
            mechanism:
              "Direct candidate support, independent expenditures, and public endorsement infrastructure.",
            impact:
              "Large support and attack spending can reshape primary incentives around Israel policy.",
            sourceIndexes: [5, 6, 7, 8],
          },
          {
            actor: "United Democracy Project",
            mechanism:
              "Super PAC spending that can support favored candidates or attack opponents.",
            impact:
              "Outside spending can change the cost of dissent for members and candidates.",
            sourceIndexes: [5, 6],
          },
          {
            actor: "Congressional offices",
            mechanism:
              "Aid votes, arms-transfer oversight, public statements, and committee pressure.",
            impact:
              "The policy question is whether U.S. power conditions or enables Israeli government conduct.",
            sourceIndexes: [0, 1, 3],
          },
        ],
      },
      {
        type: "claimLedger",
        eyebrow: "Careful wording",
        title: "Claims that need careful wording",
        rows: [
          {
            claim: "Israel committed genocide in Gaza.",
            status: "contested",
            finding:
              "A UN Commission of Inquiry made that finding, many groups allege it, Israel rejects it, and the ICJ final merits case is pending.",
            sourceIndexes: [0, 1, 2],
          },
          {
            claim: "Pro-Israel money controls Congress.",
            status: "unsupported",
            finding:
              "Campaign finance records support a claim of major influence and pressure, not a claim of total control.",
            sourceIndexes: [5, 6, 7, 8],
          },
          {
            claim: "Ethnic cleansing concerns are limited to Gaza.",
            status: "unsupported",
            finding:
              "UN reporting also raised forcible-transfer concerns in the West Bank.",
            sourceIndexes: [3],
          },
        ],
      },
      {
        type: "policyLevers",
        eyebrow: "Next moves",
        title: "How U.S. constituents can ask clearer questions",
        levers: [
          {
            actor: "Constituents",
            lever: "Ask members what rule guides military aid.",
            pressurePoint:
              "Offices should answer how ICJ orders and UN findings affect their aid position.",
            sourceIndexes: [0, 1, 2],
          },
          {
            actor: "Campaign-finance researchers",
            lever:
              "Track direct support and independent expenditures race by race.",
            pressurePoint:
              "Influence claims get stronger when tied to specific filings and races.",
            sourceIndexes: [5, 6, 7, 8],
          },
          {
            actor: "Journalists",
            lever:
              "Pair lobbying money with votes, statements, and committee action.",
            pressurePoint:
              "Money is not the whole story; the public needs the policy output next to it.",
            sourceIndexes: [5, 7, 8],
          },
        ],
      },
    ],
    sources: [
      {
        title:
          "Application of the Convention on the Prevention and Punishment of the Crime of Genocide in the Gaza Strip",
        publisher: "International Court of Justice",
        year: 2026,
        url: "https://www.icj-cij.org/case/192",
        note: "Official ICJ docket for South Africa v. Israel.",
      },
      {
        title:
          "Israel has committed genocide in the Gaza Strip, UN Commission of Inquiry finds",
        publisher: "United Nations",
        year: 2025,
        url: "https://www.un.org/unispal/document/israel-has-committed-genocide-in-the-gaza-strip-un-commission-finds-16sep25/",
        note: "UN summary of the Commission of Inquiry genocide finding.",
      },
      {
        title: "Commission of Inquiry report: genocide in Gaza, A/HRC/60/CRP.3",
        publisher: "United Nations",
        year: 2025,
        url: "https://www.un.org/unispal/document/commission-of-inquiry-report-genocide-in-gaza-a-hrc-60-crp-3/",
        note: "Detailed legal analysis behind the UN Commission finding.",
      },
      {
        title:
          "Ethnic cleansing concerns in Gaza and West Bank amid intensified violence and forcible transfers by Israel",
        publisher: "United Nations in Palestine",
        year: 2026,
        url: "https://palestine.un.org/en/310336-ethnic-cleansing-concerns-gaza-and-west-bank-amid-intensified-violence-and-forcible",
        note: "UN human-rights reporting on displacement and forcible transfer.",
      },
      {
        title:
          "Gaza: World court orders Israel to halt military operations in Rafah",
        publisher: "United Nations Office at Geneva",
        year: 2024,
        url: "https://www.ungeneva.org/en/news-media/news/2024/05/93750/gaza-world-court-orders-israel-halt-military-operations-rafah",
        note: "Summary of ICJ additional provisional measures regarding Rafah.",
      },
      {
        title:
          "Top Democratic House recipients of AIPAC and United Democracy Project support",
        publisher: "Factually / FEC and OpenSecrets-based reporting",
        year: 2026,
        url: "https://factually.co/fact-checks/politics/top-democratic-house-recipients-aipac-united-democracy-project-2024-468e6b",
        note: "Campaign-finance summary citing AIPAC, FEC, and OpenSecrets records.",
      },
      {
        title: "Here Is All the Money AIPAC Spent on the 2024 Elections",
        publisher: "Sludge",
        year: 2025,
        url: "https://readsludge.com/2025/01/24/here-is-all-the-money-aipac-spent-on-the-2024-elections/",
        note: "Race-by-race compilation of AIPAC and United Democracy Project spending.",
      },
      {
        title:
          "AIPAC faces test of its power in Illinois primary as Democrats debate future of Israel relationship",
        publisher: "Associated Press",
        year: 2026,
        url: "https://apnews.com/article/564cfdd46e0119501939452018be846a",
        note: "2026 congressional-primary spending context.",
      },
      {
        title: "AIPAC, crypto and AI spend big in Illinois House races",
        publisher: "Axios Chicago",
        year: 2026,
        url: "https://www.axios.com/local/chicago/2026/03/04/super-pacs-for-ai-crypto-and-israel-flood-illinois-congressional-races",
        note: "Reporting on 2026 super PAC spending and opaque committee names.",
      },
    ],
  },
  {
    slug: "voter-fraud-claims-election-rules",
    topicNumber: "06",
    title: "Voter Fraud Claims and Election Rule Changes",
    shortTitle: "Voter Fraud Claims",
    tagline:
      "Fraud exists, but the evidence does not support using rare cases as a pretext to block eligible voters.",
    summary:
      "Donald Trump has repeatedly used claims of voter fraud, noncitizen voting, and mail-ballot fraud to justify federal election interventions. This topic tracks the difference between documented rare fraud, unsupported claims of widespread fraud, executive orders, court challenges, and the voting-access risks of proof-of-citizenship and mail-ballot restrictions.",
    region: "United States",
    status: "Election administration and voting rights",
    theme: "ethics",
    updatedAt: "2026-05-19",
    stats: [
      {
        value: "30",
        label:
          "Suspected noncitizen-voting incidents referred from 23.5M votes in Brennan Center research",
        sourceIndexes: [0],
      },
      {
        value: "21.3M",
        label:
          "Voting-age U.S. citizens estimated not to have proof-of-citizenship documents readily available",
        sourceIndexes: [5],
      },
      {
        value: "2026-03-31",
        label: "Date of Trump's mail-voting executive order",
        sourceIndexes: [3, 4],
      },
    ],
    arguments: [
      {
        title: "Documented fraud is not the same as widespread fraud",
        claim:
          "There are real cases of election fraud, including prosecutions and convictions, but available evidence does not show fraud at a scale that justifies broad claims of stolen federal elections.",
        counterpoint:
          "The right standard is proportionality: investigate proven cases while rejecting rule changes that disenfranchise large numbers of eligible voters based on inflated or unsupported claims.",
        sourceIndexes: [0, 1, 2],
      },
      {
        title: "Executive orders are a governance fight",
        claim:
          "Trump's 2025 and 2026 election executive orders try to impose proof-of-citizenship, mail-ballot, and federal voter-list changes normally controlled by states and Congress.",
        counterpoint:
          "Courts and voting-rights groups argue the president lacks authority to run state election systems, especially when federal data errors could block eligible voters.",
        sourceIndexes: [3, 4, 5, 6],
      },
    ],
    findings: [
      {
        title: "Noncitizen voting is rare in the researched record",
        body: "Brennan Center research found only about 30 suspected noncitizen-voting incidents referred for further investigation or prosecution among 23.5 million votes in the jurisdictions studied.",
        sourceIndexes: [0],
      },
      {
        title: "Mail voting is being used as the next fraud frame",
        body: "Trump's March 31, 2026 order targeted mail ballots, voter eligibility lists, and ballot tracking, prompting lawsuits from Democrats and civil-rights organizations.",
        sourceIndexes: [3, 4, 6],
      },
      {
        title: "Proof-of-citizenship policy carries access risk",
        body: "Voting-rights researchers estimate millions of eligible citizens lack ready access to citizenship documents, meaning strict documentation rules can remove lawful voters from the process.",
        sourceIndexes: [5],
      },
    ],
    statusBrief: {
      headline: "Rare cases are being used to push broad restrictions",
      summary:
        "The useful work is simple: what happened, how often, what rule is being proposed, and who might be blocked by it.",
      latestDevelopment:
        "In May 2026, AP reported active litigation over Trump's mail-voting order and a federal push to scan state voter rolls through national eligibility checks.",
      nextDecisionPoint:
        "Whether courts block, narrow, or permit federal attempts to reshape mail voting, proof-of-citizenship rules, and voter-list data sharing before the 2026 midterms.",
      whoCanAct:
        "Voters, election clerks, secretaries of state, courts, civil-rights groups, and local journalists",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Ask for evidence claim by claim",
        description:
          "Do not debate vague fraud allegations. Ask for names, jurisdictions, counts, case status, and whether any result was affected.",
        audience: "Journalists and residents",
        difficulty: "10 minutes",
        urgency: "high",
        ctaLabel: "Read Brennan Research",
        ctaUrl:
          "https://www.brennancenter.org/our-work/research-reports/noncitizen-voting-vanishingly-rare",
        script:
          "What specific fraud allegation is being made, how many ballots are involved, who investigated it, what evidence was verified, and did it affect an election outcome?",
      },
      {
        title: "Track local voter-list requests",
        description:
          "Monitor whether federal or outside actors are requesting voter files, citizenship data, driver's license fields, or Social Security fields.",
        audience: "Election watchdogs",
        difficulty: "30 minutes",
        urgency: "high",
        ctaLabel: "Open AP Coverage",
        ctaUrl: "https://apnews.com/article/8f78773f583e4404136707c62acc648a",
        script:
          "Has this office received federal or third-party requests for voter-roll data, citizenship data, driver's license data, or Social Security fields, and what legal review was performed?",
      },
      {
        title: "Ask who could be blocked before backing a rule",
        description:
          "Require officials to estimate how many eligible voters lack documents, mail access, or correction windows before supporting restrictions.",
        audience: "Voting-rights groups",
        difficulty: "20 minutes",
        urgency: "medium",
        ctaLabel: "Review EO Status",
        ctaUrl:
          "https://www.brennancenter.org/our-work/research-reports/status-trumps-anti-voting-executive-order",
        script:
          "Before endorsing this rule, please publish how many eligible citizens could be rejected, delayed, or forced into provisional ballots because of documentation or data-match errors.",
      },
    ],
    timeline: [
      {
        date: "2020-11-12",
        title:
          "Federal election-security officials reject system-compromise claims",
        description:
          "CISA and election partners said there was no evidence that voting systems deleted, lost, changed, or compromised votes in the 2020 election.",
        sourceIndexes: [2],
      },
      {
        date: "2025-03-25",
        title: "Trump issues election executive order",
        description:
          "The order sought proof-of-citizenship requirements and changes to mail-ballot handling, triggering multiple lawsuits.",
        sourceIndexes: [4],
      },
      {
        date: "2026-03-31",
        title: "Trump signs mail-voting executive order",
        description:
          "The order directed federal action on citizenship verification, approved mail-ballot lists, and tracking requirements, prompting new litigation.",
        sourceIndexes: [3, 6],
      },
    ],
    updates: [
      {
        title:
          "Trump administration promotes national voter-eligibility checks",
        publisher: "Associated Press",
        publishedAt: "2026-05-17",
        url: "https://apnews.com/article/8f78773f583e4404136707c62acc648a",
        summary:
          "AP reported a broader federal push to scan state voter rolls and promote claims about noncitizen voting even though such cases are rare.",
        tag: "Voter rolls",
      },
      {
        title: "Court hearing tests Trump's mail-voting order",
        publisher: "Associated Press",
        publishedAt: "2026-05-14",
        url: "https://apnews.com/article/ac61e7d4bb77f9901eb6f1a2c1f4b087",
        summary:
          "Democrats and civil-rights groups argued that Trump exceeded his authority by restricting mail-ballot access.",
        tag: "Litigation",
      },
    ],
    modules: [
      {
        type: "briefing",
        eyebrow: "What is the problem",
        title:
          "The story is the conversion of rare fraud into broad restriction",
        body: [
          "A serious election-integrity page should not claim fraud never happens. It should show that documented fraud cases exist, then ask whether the proposed remedy is proportional to the verified scale.",
          "Trump's recent voter-fraud frame uses noncitizen voting, mail ballots, and voter-list data matching to justify federal intervention. The civic-risk question is whether eligible voters get blocked by paperwork and database errors while unsupported claims receive official power.",
        ],
        bullets: [
          "Ask every fraud claim for count, jurisdiction, case status, and effect on outcome.",
          "Separate proven cases from claims of systemic fraud.",
          "Evaluate restrictions by how many eligible voters they burden.",
        ],
        sourceIndexes: [0, 1, 2, 3, 4, 5, 6, 7],
      },
      {
        type: "claimLedger",
        eyebrow: "Fraud claim check",
        title: "Track the claim, proof, size, and proposed fix",
        rows: [
          {
            claim:
              "Noncitizen voting is widespread enough to justify national proof-of-citizenship restrictions.",
            status: "unsupported",
            finding:
              "Brennan research found 30 suspected incidents referred from 23.5 million votes in studied jurisdictions.",
            sourceIndexes: [0],
          },
          {
            claim: "Fraud cases exist and should be prosecuted.",
            status: "documented",
            finding:
              "Case databases document real incidents, but documented cases must be compared against total ballots and actual outcomes.",
            sourceIndexes: [1],
          },
          {
            claim:
              "The president can restructure state mail-voting rules by executive order.",
            status: "contested",
            finding:
              "Civil-rights groups and Democrats argue Trump's executive orders exceed presidential authority; litigation is ongoing.",
            sourceIndexes: [3, 4, 6],
          },
        ],
      },
      {
        type: "tracker",
        eyebrow: "Rule changes",
        title: "Where the 2026 fight is moving",
        columns: ["Target", "Trump administration move", "Access risk"],
        rows: [
          {
            cells: [
              "Proof of citizenship",
              "Push citizenship verification and eligibility checks through federal data systems.",
              "Eligible citizens without ready documents or with data mismatches can be delayed or rejected.",
            ],
            sourceIndexes: [4, 5, 7],
          },
          {
            cells: [
              "Mail ballots",
              "Restrict approved mail-ballot lists and require tracking conditions.",
              "Voters who rely on mail voting may face narrower access before the midterms.",
            ],
            sourceIndexes: [3, 6],
          },
          {
            cells: [
              "State voter rolls",
              "Promote national voter-eligibility checks and voter-roll scanning.",
              "False positives can trigger removals or extra burdens without individualized fraud evidence.",
            ],
            sourceIndexes: [7],
          },
        ],
      },
      {
        type: "evidenceMatrix",
        eyebrow: "Fairness test",
        title: "How to judge any proposed fraud fix",
        rows: [
          {
            label: "Verified incident count",
            evidence:
              "Require named cases, ballots affected, and prosecution or investigation status.",
            caveat:
              "Anecdotes should not be scaled into national claims without denominator data.",
            sourceIndexes: [0, 1],
          },
          {
            label: "System compromise",
            evidence:
              "Federal election-security officials found no evidence that voting systems changed or compromised votes in 2020.",
            caveat:
              "System-security claims are different from isolated voter or campaign misconduct cases.",
            sourceIndexes: [2],
          },
          {
            label: "Eligible-voter harm",
            evidence:
              "Proof-of-citizenship requirements can burden millions who lack ready documents.",
            caveat:
              "Access estimates should be updated state by state as rules change.",
            sourceIndexes: [5],
          },
        ],
      },
      {
        type: "policyLevers",
        eyebrow: "Next moves",
        title: "What election watchdogs should do now",
        levers: [
          {
            actor: "Local journalists",
            lever:
              "Build a fraud-claim spreadsheet with evidence and outcome fields.",
            pressurePoint:
              "Officials making broad claims should be forced into verifiable specifics.",
            sourceIndexes: [0, 1],
          },
          {
            actor: "Election clerks",
            lever:
              "Publish how data-match errors are handled before voters are removed.",
            pressurePoint:
              "List maintenance must include notice, correction windows, and appeal paths.",
            sourceIndexes: [4, 7],
          },
          {
            actor: "Civil-rights groups",
            lever:
              "Quantify eligible-voter burden before courts and legislatures.",
            pressurePoint:
              "Restrictions should be tested against the number of lawful voters affected.",
            sourceIndexes: [5, 6],
          },
        ],
      },
    ],
    sources: [
      {
        title: "Noncitizen Voting is Vanishingly Rare",
        publisher: "Brennan Center for Justice",
        year: 2017,
        url: "https://www.brennancenter.org/our-work/research-reports/noncitizen-voting-vanishingly-rare",
        note: "Research summary on noncitizen-voting allegations.",
      },
      {
        title: "Election Fraud Map",
        publisher: "The Heritage Foundation",
        year: 2026,
        url: "https://electionfraud.heritage.org/",
        note: "Conservative fraud-case database useful for documented case comparison.",
      },
      {
        title:
          "Joint Statement from DOJ, DOD, DHS, DNI, FBI, NSA, and CISA on Ensuring Security of 2020 Elections",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        year: 2020,
        url: "https://www.cisa.gov/news-events/news/joint-statement-doj-dod-dhs-dni-fbi-nsa-and-cisa-ensuring-security-2020-elections",
        note: "Official federal election-security statement.",
      },
      {
        title:
          "League of Women Voters of Massachusetts v. Trump, March 2026 Mail Voting Executive Order",
        publisher: "Brennan Center for Justice",
        year: 2026,
        url: "https://www.brennancenter.org/our-work/court-cases/league-women-voters-massachusetts-v-trump-march-2026-mail-voting-executive",
        note: "Case page for legal challenge to Trump's March 31, 2026 order.",
      },
      {
        title: "Status of Trump's Anti-Voting Executive Order",
        publisher: "Brennan Center for Justice",
        year: 2026,
        url: "https://www.brennancenter.org/our-work/research-reports/status-trumps-anti-voting-executive-order",
        note: "Tracker for 2025 and 2026 election executive-order litigation.",
      },
      {
        title:
          "The Trump Administration's Campaign to Undermine the Next Election",
        publisher: "Brennan Center for Justice",
        year: 2025,
        url: "https://www.brennancenter.org/our-work/research-reports/trump-administrations-campaign-undermine-next-election",
        note: "Analysis of voting-access effects and proof-of-citizenship risks.",
      },
      {
        title:
          "Lawyers urge judge to block Trump order that would create eligible voter list, limit mail ballots",
        publisher: "Associated Press",
        year: 2026,
        url: "https://apnews.com/article/ac61e7d4bb77f9901eb6f1a2c1f4b087",
        note: "May 2026 litigation update.",
      },
      {
        title:
          "Trump administration promotes program to check voter eligibility",
        publisher: "Associated Press",
        year: 2026,
        url: "https://apnews.com/article/8f78773f583e4404136707c62acc648a",
        note: "May 2026 reporting on federal voter-roll scanning.",
      },
    ],
  },
  {
    slug: "bundibugyo-ebola-outbreak",
    topicNumber: "07",
    title: "Bundibugyo Ebola Outbreak",
    shortTitle: "Ebola Outbreak",
    tagline:
      "A rare Ebola species has crossed from eastern DRC into Uganda without a licensed vaccine.",
    summary:
      "This topic tracks the May 2026 Bundibugyo virus disease outbreak in Ituri Province, Democratic Republic of the Congo, and imported cases in Kampala, Uganda, including confirmed and suspected case geography, mortality, response gaps, travel guidance, and what is still unknown.",
    region: "DRC and Uganda",
    status: "WHO PHEIC declared May 17, 2026",
    theme: "future",
    updatedAt: "2026-05-21",
    stats: [
      {
        value: "246",
        label:
          "suspected cases reported in Ituri Province as of WHO's May 16 notice",
        sourceIndexes: [0, 1],
      },
      {
        value: "80",
        label:
          "suspected deaths reported in DRC, including deaths among health workers",
        sourceIndexes: [0, 1],
      },
      {
        value: "8",
        label:
          "laboratory-confirmed Bundibugyo-positive samples from initial INRB testing",
        sourceIndexes: [0, 1],
      },
      {
        value: "2",
        label:
          "laboratory-confirmed imported cases reported in Kampala, Uganda",
        sourceIndexes: [0, 1],
      },
    ],
    arguments: [
      {
        title: "This is not the common vaccine-covered Ebola scenario",
        claim:
          "Bundibugyo virus disease is an Ebola disease, but there is no licensed Bundibugyo-specific vaccine or therapeutic; response depends on fast detection, isolation, supportive care, IPC, contact tracing, and safe burials.",
        counterpoint:
          "Early optimized supportive care can still save lives, and WHO has activated research and development coordination for candidate countermeasures.",
        sourceIndexes: [0, 1, 2],
      },
      {
        title: "The headline count may be an undercount",
        claim:
          "WHO flagged uncertainty around the true number of infected people and geographic spread because of delayed detection, clusters of community deaths, insecurity, and weak contact follow-up.",
        counterpoint:
          "The event has named health zones, confirmed laboratory results, and active surveillance, so the immediate task is rapid narrowing of the unknowns rather than speculation.",
        sourceIndexes: [0, 1],
      },
    ],
    findings: [
      {
        title: "The mapped outbreak center is Ituri",
        body: "WHO reported suspected cases across Rwampara, Mongbwalu, and Bunia health zones in Ituri Province, with unusual compatible death clusters under investigation in other health zones in Ituri and North Kivu.",
        sourceIndexes: [0, 1],
      },
      {
        title:
          "Uganda has imported cases, not documented local transmission in the notice",
        body: "WHO reported two confirmed Kampala cases in people returning from DRC and stated that no local transmission had been identified in Uganda at the time of reporting.",
        sourceIndexes: [0, 1],
      },
      {
        title: "Mortality context is severe but strain-specific",
        body: "WHO says past Bundibugyo virus disease outbreaks had case fatality rates around 30% to 50%, lower than some Zaire Ebola outbreaks but still high enough to require emergency control measures.",
        sourceIndexes: [0, 2],
      },
    ],
    statusBrief: {
      headline: "A rare Ebola species is now a cross-border emergency",
      summary:
        "The decisive questions are whether surveillance can find hidden transmission quickly, whether health facilities can stop amplification, and whether cross-border screening can prevent further exportation.",
      latestDevelopment:
        "WHO determined on May 17, 2026 that Ebola disease caused by Bundibugyo virus in DRC and Uganda is a public health emergency of international concern, but not a pandemic emergency.",
      nextDecisionPoint:
        "Emergency committee recommendations, updated case counts, contact tracing quality, and whether any Uganda-linked local transmission appears.",
      whoCanAct:
        "DRC and Uganda health ministries, WHO, Africa CDC, neighboring states, health facilities, border teams, local leaders, and humanitarian responders.",
      urgency: "high",
      lastChecked: "2026-05-21",
    },
    actions: [
      {
        title: "Follow the official outbreak notice, not social posts",
        description:
          "Use WHO Disease Outbreak News and health ministry updates for case definitions, affected zones, and travel guidance.",
        audience: "public",
        difficulty: "easy",
        urgency: "high",
        ctaLabel: "Open WHO Notice",
        ctaUrl:
          "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON602",
        script:
          "Before sharing a claim, ask: does it distinguish suspected, probable, confirmed, and ruled-out cases? If not, do not amplify it.",
      },
      {
        title: "Do not support blanket border closures",
        description:
          "WHO advises against travel and trade restrictions; targeted screening and monitored contact movement are the recommended controls.",
        audience: "policymakers",
        difficulty: "medium",
        urgency: "medium",
        ctaLabel: "Read WHO Advice",
        ctaUrl:
          "https://www.who.int/news/item/17-05-2026-epidemic-of-ebola-disease-in-the-democratic-republic-of-the-congo-and-uganda-determined-a-public-health-emergency-of-international-concern",
        script:
          "Ask officials to fund surveillance, labs, PPE, isolation, and contact tracing instead of symbolic travel bans that push movement into informal crossings.",
      },
    ],
    timeline: [
      {
        date: "2026-04-24",
        title: "Known suspected case develops symptoms",
        description:
          "WHO describes a health worker with fever, hemorrhaging, vomiting, and intense malaise who later died at a medical center in Bunia.",
        sourceIndexes: [0],
      },
      {
        date: "2026-05-05",
        title: "WHO alerted to high-mortality illness",
        description:
          "The alert involved Mongbwalu Health Zone in Ituri Province, including deaths among health workers.",
        sourceIndexes: [0],
      },
      {
        date: "2026-05-14",
        title: "Samples analyzed by INRB Kinshasa",
        description:
          "Thirteen blood samples from Rwampara Health Zone were analyzed after earlier standard Ebola Xpert testing in Bunia was negative.",
        sourceIndexes: [0],
      },
      {
        date: "2026-05-15",
        title: "Bundibugyo virus confirmed and DRC declares outbreak",
        description:
          "Eight samples were confirmed as Bundibugyo virus disease; DRC declared its 17th Ebola disease outbreak.",
        sourceIndexes: [0],
      },
      {
        date: "2026-05-15 to 2026-05-16",
        title: "Uganda confirms imported Kampala cases",
        description:
          "Uganda confirmed one imported fatal case and then a second imported case in Kampala, both linked to travel from DRC.",
        sourceIndexes: [0, 1],
      },
      {
        date: "2026-05-17",
        title: "WHO declares PHEIC",
        description:
          "WHO determined the event is a public health emergency of international concern, while saying it does not meet pandemic-emergency criteria.",
        sourceIndexes: [1],
      },
    ],
    updates: [
      {
        title: "WHO declares Bundibugyo Ebola event a PHEIC",
        publisher: "World Health Organization",
        publishedAt: "2026-05-17",
        url: "https://www.who.int/news/item/17-05-2026-epidemic-of-ebola-disease-in-the-democratic-republic-of-the-congo-and-uganda-determined-a-public-health-emergency-of-international-concern",
        summary:
          "WHO cited confirmed cases in DRC and Uganda, suspected deaths, geographic uncertainty, health-care worker deaths, and lack of approved Bundibugyo-specific countermeasures.",
        tag: "Emergency",
      },
      {
        title:
          "Disease Outbreak News details affected zones and response measures",
        publisher: "World Health Organization",
        publishedAt: "2026-05-16",
        url: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON602",
        summary:
          "WHO named Rwampara, Mongbwalu, and Bunia health zones, reported 246 suspected cases and 80 suspected deaths, and described Uganda's imported cases.",
        tag: "Situation",
      },
    ],
    modules: [
      {
        type: "briefing",
        title: "What You Need To Know",
        eyebrow: "Briefing",
        body: [
          "Bundibugyo virus disease is a severe Ebola disease caused by Bundibugyo virus. WHO says infection spreads through close contact with infected bodily fluids, contaminated surfaces, unsafe burials, and health-care exposure when infection prevention and control fails.",
          "The current outbreak was confirmed in Ituri Province, DRC, with imported cases in Kampala, Uganda. The map marks reported case areas and a ruled-out Kinshasa alert so users can separate confirmed outbreak geography from discarded signals.",
          "There is no licensed vaccine or specific therapeutic for Bundibugyo virus disease. The practical response is early isolation, optimized supportive care, laboratory testing, PPE, contact tracing, safe burials, community trust, and cross-border screening.",
        ],
        bullets: [
          "Incubation period: 2 to 21 days; people are usually not infectious until symptoms begin.",
          "Past Bundibugyo outbreaks: approximately 30% to 50% case fatality according to WHO.",
          "WHO advice: no blanket travel or trade restrictions; use targeted screening and movement limits for cases and contacts.",
        ],
        sourceIndexes: [0, 1, 2],
      },
      {
        type: "statGrid",
        title: "Current Numbers",
        eyebrow: "Cases",
        stats: [
          {
            value: "246",
            label:
              "suspected DRC cases in Rwampara, Mongbwalu, and Bunia health zones",
            sourceIndexes: [0, 1],
          },
          {
            value: "80",
            label: "suspected DRC deaths as of the WHO notice",
            sourceIndexes: [0, 1],
          },
          {
            value: "2",
            label: "confirmed imported cases in Kampala, Uganda",
            sourceIndexes: [0, 1],
          },
          {
            value: "65",
            label: "listed contacts in the early report, 15 high-risk",
            sourceIndexes: [0],
          },
        ],
      },
      {
        type: "tracker",
        title: "Reported Case Map Ledger",
        eyebrow: "Map",
        columns: ["Location", "Status", "Why It Matters"],
        rows: [
          {
            cells: [
              "Mongbwalu Health Zone, Ituri",
              "Suspected outbreak origin and health-worker deaths",
              "Mining-area mobility and health-facility amplification increase spread risk.",
            ],
            sourceIndexes: [0, 1],
          },
          {
            cells: [
              "Rwampara Health Zone, Ituri",
              "Initial lab-confirmed positive samples",
              "Eight of the tested samples confirmed Bundibugyo virus disease after reference testing.",
            ],
            sourceIndexes: [0],
          },
          {
            cells: [
              "Bunia Health Zone, Ituri",
              "Known suspected case died after late-April symptoms",
              "Bunia is a care-seeking and transport hub less than 500 km from Uganda.",
            ],
            sourceIndexes: [0],
          },
          {
            cells: [
              "Kampala, Uganda",
              "Two imported confirmed cases",
              "WHO reported no local transmission identified in Uganda at the time of reporting.",
            ],
            sourceIndexes: [0, 1],
          },
          {
            cells: [
              "Kinshasa, DRC",
              "Ruled out",
              "A traveler from Ituri tested negative on confirmatory INRB testing and is not counted as confirmed.",
            ],
            sourceIndexes: [1],
          },
        ],
      },
      {
        type: "claimLedger",
        title: "Claims To Watch",
        eyebrow: "Signal",
        rows: [
          {
            claim: "This is a pandemic",
            status: "unsupported",
            finding:
              "WHO declared a PHEIC but explicitly said the event does not meet pandemic-emergency criteria.",
            sourceIndexes: [1],
          },
          {
            claim: "A vaccine is ready for this strain",
            status: "unsupported",
            finding:
              "WHO says there is no licensed vaccine or specific therapeutic against Bundibugyo virus disease.",
            sourceIndexes: [0, 1],
          },
          {
            claim: "Uganda has local spread",
            status: "watch",
            finding:
              "WHO reported imported cases in Kampala and no local transmission identified at the time of the notice; this must be checked against future updates.",
            sourceIndexes: [0],
          },
          {
            claim: "The official count is complete",
            status: "contested",
            finding:
              "WHO cites significant uncertainty, weak follow-up, community deaths, insecurity, and possible wider spread.",
            sourceIndexes: [0, 1],
          },
        ],
      },
      {
        type: "policyLevers",
        title: "Response Priorities",
        eyebrow: "Control",
        levers: [
          {
            actor: "Health ministries",
            lever:
              "Emergency operations, case isolation, laboratory confirmation, contact tracing, and safe referral pathways.",
            pressurePoint:
              "Publish daily confirmed, probable, suspected, death, contact, and ruled-out figures separately.",
            sourceIndexes: [0, 1],
          },
          {
            actor: "Hospitals and clinics",
            lever:
              "Triage, PPE, staff training, IPC audits, and protected care pathways.",
            pressurePoint:
              "Four health-worker deaths show the cost of weak infection prevention and control.",
            sourceIndexes: [0, 1],
          },
          {
            actor: "Border and transport teams",
            lever:
              "Exit screening, movement limits for cases and contacts, and cross-border information sharing.",
            pressurePoint:
              "WHO advises against broad travel bans while supporting targeted screening and contact movement restrictions.",
            sourceIndexes: [1],
          },
          {
            actor: "Community leaders",
            lever:
              "Trusted risk communication, early care-seeking, contact participation, and safe burials.",
            pressurePoint:
              "Unsafe burial practices and delayed isolation can accelerate transmission.",
            sourceIndexes: [0, 1],
          },
        ],
      },
      {
        type: "timeline",
        title: "Timeline",
        eyebrow: "Dates",
        items: [
          {
            date: "Apr. 24",
            title: "Symptoms in known suspected case",
            description:
              "Health-worker case later died in Bunia after symptoms compatible with viral hemorrhagic fever.",
            sourceIndexes: [0],
          },
          {
            date: "May 5",
            title: "WHO alerted",
            description:
              "High-mortality unknown illness reported in Mongbwalu Health Zone.",
            sourceIndexes: [0],
          },
          {
            date: "May 15",
            title: "Bundibugyo confirmed",
            description:
              "INRB testing confirmed Bundibugyo virus disease and DRC declared an Ebola outbreak.",
            sourceIndexes: [0],
          },
          {
            date: "May 16",
            title: "Uganda second imported case",
            description:
              "WHO reported a second Kampala case in a traveler from DRC, with no apparent link to the first.",
            sourceIndexes: [0],
          },
          {
            date: "May 17",
            title: "PHEIC determination",
            description:
              "WHO declared a public health emergency of international concern but not a pandemic emergency.",
            sourceIndexes: [1],
          },
        ],
      },
      {
        type: "actionList",
        title: "What To Do With This Information",
        eyebrow: "Action",
        actions: [
          {
            title: "Track confirmed vs suspected separately",
            description:
              "Do not merge suspected deaths, suspected cases, and lab-confirmed cases into one headline number.",
            audience: "readers",
            difficulty: "easy",
            urgency: "high",
            ctaLabel: "Open WHO Notice",
            ctaUrl:
              "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON602",
            script:
              "When you see a number, ask what category it belongs to and what date it was reported.",
          },
          {
            title: "Watch the Uganda signal",
            description:
              "Imported cases are already documented; local transmission would materially change the risk picture.",
            audience: "editors",
            difficulty: "medium",
            urgency: "high",
            ctaLabel: "Open PHEIC Statement",
            ctaUrl:
              "https://www.who.int/news/item/17-05-2026-epidemic-of-ebola-disease-in-the-democratic-republic-of-the-congo-and-uganda-determined-a-public-health-emergency-of-international-concern",
            script:
              "Update the map only when an official source identifies confirmed, suspected, probable, or ruled-out geography.",
          },
        ],
      },
    ],
    sources: [
      {
        title:
          "Ebola disease caused by Bundibugyo virus, Democratic Republic of the Congo & Uganda",
        publisher: "World Health Organization",
        year: 2026,
        url: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON602",
        note: "WHO Disease Outbreak News with case counts, affected health zones, Uganda imported cases, response measures, and risk assessment.",
      },
      {
        title:
          "Epidemic of Ebola Disease caused by Bundibugyo virus in DRC and Uganda determined a PHEIC",
        publisher: "World Health Organization",
        year: 2026,
        url: "https://www.who.int/news/item/17-05-2026-epidemic-of-ebola-disease-in-the-democratic-republic-of-the-congo-and-uganda-determined-a-public-health-emergency-of-international-concern",
        note: "WHO PHEIC statement, including emergency rationale and recommendations.",
      },
      {
        title: "Ebola disease fact sheet",
        publisher: "World Health Organization",
        year: 2025,
        url: "https://www.who.int/news-room/fact-sheets/detail/ebola-virus-disease",
        note: "General Ebola disease transmission, symptoms, treatment, and prevention background.",
      },
    ],
  },
]
