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
      "The original Corruption in Congress site focused on the case for banning individual stock trading by members of Congress, their spouses, and dependents. The combined version keeps the salary argument, the public-support argument, and the bill-tracking frame in one reusable topic page.",
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
        body: "Polling cited by the original site showed strong support for a ban among Republican, Democratic, and independent voters.",
        sourceIndexes: [1],
      },
      {
        title: "Disclosure alone is not a cure",
        body: "Public transaction reports can reveal trades after the fact, but delayed transparency does not remove the conflict created by owning affected assets while legislating.",
        sourceIndexes: [3],
      },
    ],
    statusBrief: {
      headline: "The reform path is already written",
      summary:
        "This topic is ready for pressure on bill text, discharge efforts, and member positions rather than another round of general awareness.",
      latestDevelopment:
        "The public-facing verification point remains official House discharge and disclosure data.",
      nextDecisionPoint:
        "Whether members will support a ban that covers spouses, dependents, and individual stock ownership.",
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
        title: "Check the official pressure point",
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
        title: "Turn disclosures into evidence",
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
          "Polling cited by the original project showed large majorities across party groups supporting a congressional stock-trading ban.",
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
        title: "Official House records remain the action tracker",
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
        title: "Financial disclosures remain the conflict evidence base",
        publisher: "U.S. House Clerk",
        publishedAt: "2026-05-19",
        url: "https://disclosures-clerk.house.gov/",
        summary:
          "Transaction disclosures can document conflicts after the fact, which supports the case for preemptive rules.",
        tag: "Disclosure",
      },
    ],
    sources: [
      {
        title: "Congressional Salaries and Allowances",
        publisher: "Congressional Research Service",
        year: 2025,
        url: "https://crsreports.congress.gov/",
        note: "Salary baseline used by the original topic site.",
      },
      {
        title: "Congressional Stock Trading Polling",
        publisher: "YouGov / The Economist",
        year: 2024,
        url: "https://today.yougov.com/",
        note: "Cross-party public-support snapshot cited in the source project.",
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
    title: "Map Michigan's Surveillance Stack",
    shortTitle: "Surveillance Stack",
    tagline:
      "Flock cameras are the visible layer. The networked data system runs deeper.",
    summary:
      "The DeFlock Michigan work is modeled here as a broader civil-liberties topic: automatic license plate readers, private camera networks, real-time crime centers, data fusion platforms, and AI interfaces that make routine movement searchable across agencies.",
    region: "Michigan",
    status: "Local surveillance oversight",
    theme: "surveillance",
    updatedAt: "2026-05-13",
    stats: [
      {
        value: "125+",
        label: "Michigan cities and counties reported using ALPR cameras",
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
        title: "Michigan deployment is already widespread",
        body: "State reporting says more than 125 Michigan cities and counties use ALPR cameras, while statewide legal guardrails remain incomplete.",
        sourceIndexes: [0, 5],
      },
      {
        title: "The vendor stack is broader than Flock",
        body: "The source project tracks Flock Nova, Palantir Gotham and AIP, Axon Fusus, Rekor Scout, and Clearview AI as related parts of the surveillance marketplace.",
        sourceIndexes: [2, 3, 4, 6, 7],
      },
      {
        title: "Auditability is the public-pressure point",
        body: "Organizers can ask who searched, why they searched, what outside agencies had access, and whether protest or immigration-related lookups occurred.",
        sourceIndexes: [1, 5],
      },
    ],
    statusBrief: {
      headline: "Oversight has to follow the network",
      summary:
        "The near-term fight is not only camera approval. It is retention, sharing, audit logs, outside-agency access, and later AI integrations.",
      latestDevelopment:
        "Michigan reporting and civil-liberties analysis now frame ALPRs as part of a wider searchable surveillance stack.",
      nextDecisionPoint:
        "Whether local governments require public approval before adding AI, fusion, real-time crime center, or facial-recognition layers.",
      whoCanAct:
        "Residents, city councils, county boards, and public-records requesters",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Request the operating record",
        description:
          "Ask for contracts, retention schedules, sharing agreements, and audit logs before any expansion vote.",
        audience: "Residents",
        difficulty: "20 minutes",
        urgency: "high",
        ctaLabel: "Read Michigan Reporting",
        ctaUrl:
          "https://www.michiganpublic.org/criminal-justice-legal-system/2026-04-08/police-say-license-plate-cameras-help-them-solve-crimes-but-residents-and-lawmakers-raise-concerns-over-privacy-data-sharing",
        script:
          "Please provide the current ALPR contract, data-retention policy, outside-agency sharing policy, hotlist policy, and the last 12 months of audit logs.",
      },
      {
        title: "Demand an integration vote",
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
        title: "Map the connected system",
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
        title: "Michigan ALPR deployment is publicly documented",
        description:
          "State reporting placed ALPR use across more than 125 Michigan cities and counties.",
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
        title: "Michigan ALPR privacy concerns move into mainstream reporting",
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
    ],
  },
  {
    slug: "michigan-data-centers",
    topicNumber: "03",
    title: "Michigan Before Megawatts",
    shortTitle: "Data Centers",
    tagline:
      "Communities should know the water, power, noise, and tax tradeoffs before approvals.",
    summary:
      "The Michigan data-center site becomes an infrastructure-accountability topic in the combined hub. It tracks local impacts from AI and cloud data-center buildouts: water demand, grid upgrades, ratepayer exposure, diesel backup, noise, land use, tax breaks, and jobs claims.",
    region: "Michigan",
    status: "Land use, utilities, and local control",
    theme: "infrastructure",
    updatedAt: "2026-05-06",
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
        value: "$7B+",
        label: "Reported Stargate Michigan investment scale",
        sourceIndexes: [11, 12],
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
        title: "Power demand is now a planning topic",
        body: "Berkeley Lab reported U.S. data centers used 176 TWh of electricity in 2023 and projected major increases by 2028.",
        sourceIndexes: [3],
      },
      {
        title: "Water, noise, and diesel backup are quality-of-life topics",
        body: "The source project links cooling demand, generator testing, constant equipment noise, and diesel exhaust to everyday local impacts that zoning rules can address.",
        sourceIndexes: [4, 5, 6, 8],
      },
      {
        title: "Michigan communities need approval leverage",
        body: "Local governments can use moratoria, special land-use standards, utility disclosures, tax-transparency rules, and enforceable community-benefit agreements before approvals are locked in.",
        sourceIndexes: [1, 2, 11, 12],
      },
    ],
    statusBrief: {
      headline: "Approval leverage exists before the vote",
      summary:
        "The practical window is before zoning, utility, tax, and infrastructure commitments are locked in.",
      latestDevelopment:
        "Michigan reporting now tracks moratoria, grid impact, and local resistance around major data-center proposals.",
      nextDecisionPoint:
        "Whether communities require water, power, diesel, noise, tax, and permanent-jobs disclosures before approvals.",
      whoCanAct:
        "Township boards, planning commissions, utility regulators, and residents",
      urgency: "high",
      lastChecked: "2026-05-19",
    },
    actions: [
      {
        title: "Require maximum-demand disclosures",
        description:
          "Get peak electric load, daily water demand, backup-generator plans, and noise modeling into the public packet.",
        audience: "Residents",
        difficulty: "15 minutes",
        urgency: "high",
        ctaLabel: "Open Local Guide",
        ctaUrl: "https://graham.umich.edu/product/michigan-data-centers-guide",
        script:
          "Before any vote, please publish maximum daily water demand, peak electric load, diesel backup plans, generator testing schedules, and noise modeling.",
      },
      {
        title: "Follow the money",
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
        note: "Ratepayer-risk overview from the source project.",
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
    ],
  },
]
