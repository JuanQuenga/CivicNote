# CivicNote benchmark and service roadmap

Date: 2026-05-19

## Current product baseline

CivicNote already has a useful foundation: topic dossiers, source-linked stats and findings, claim ledgers, timelines, updates, issue urgency, and action scripts shared across web and mobile. The current seeded topics are:

- Congressional stock trading and federal ethics
- Michigan surveillance infrastructure
- Michigan data centers and local infrastructure approvals
- Glyphosate health and environmental exposure
- Israel, Gaza, and U.S. political influence
- Voter fraud claims and election-rule changes

The current product feels like a research library with action cards. To feel like a full service, it needs recurring user value: saved interests, local routing, alerts, public-record workflows, representative and agency lookup, guided tasks, and searchable data views.

## Comparable civic products and what they do well

| Product / organization | Relevant topics | Useful implementation patterns |
| --- | --- | --- |
| MuckRock | FOIA, public records, government transparency, public datasets, investigations | Single account, public-record request filing and tracking, agency search, document upload/search, released-page counts, guides, workshops, public request archive, DocumentCloud integration. |
| Campaign Legal Center | Campaign finance, ethics, redistricting, voting and elections, rule of law | Clear issue taxonomy, toolkits/resources by issue, democracy education, legal cases/actions, newsletter capture, impact framing. |
| Sunlight Foundation / Tactical Data Engagement | Open data, local government transparency, conflicts of interest, resident-centered data use | Human-centered civic data framework, open data policy templates, problem scoping, user research, co-creation, community partnerships. |
| RepRadar | Representatives, votes, legislation, donors, stock trades, local offices, civic education | Address/ZIP lookup, saved representatives, vote tracking, side-by-side comparison, call scripts, user dashboard, issue priorities, data-source transparency. |
| CivicScope | Local meetings, budgets, contracts, grants, votes, city/county public records | Scannable civic newsfeed, AI cards, document-page citations, city subscriptions, weekly digests, continuous scanning, human review, city selector. |
| ProPublica | Investigations, civil rights, courts, criminal justice, debt, health, government accountability | Data apps, searchable databases, tip submission, corrections workflow, local reporting network, issue verticals, donation/newsletter flows. |
| POPVOX / LocAlmanac | Legislation, lawmakers, committees, hearings, witnesses, local civic intelligence | Structured relationships between bills, members, committees, hearings, documents, histories, local feeds, provenance, citation-backed search and Q&A. |
| CivicPlus | Municipal websites, agenda/meeting management, public-record requests, accessibility, 311 CRM, mass notifications | Resident account pattern, forms, agendas, subscriptions, notifications, service requests, accessibility/compliance, integrated government-service UX. |

## Topic gaps to consider adding

These expand the hub from issue dossiers into a broader civic service:

- Campaign finance and dark money: PAC spending, donor networks, ballot measure money, lobbyist influence, revolving door.
- Redistricting and representation: district maps, commission process, dilution claims, community-of-interest guides.
- Voting access: registration deadlines, proof-of-citizenship rules, mail voting, polling-place closures, language access.
- Local government money: budgets, contracts, tax abatements, grants, procurement, public-private deals.
- Public records and FOIA: request guides, agency directories, public-record templates, request status tracking.
- Policing and surveillance: ALPRs, fusion centers, Fusus/Axon, facial recognition, data retention, audit logs.
- Environmental health: water quality, air pollution, pesticides, industrial permits, diesel backup, data-center water/power use.
- Housing and land use: zoning changes, tax incentives, eviction data, tenant protections, planning-board decisions.
- Education governance: school boards, curriculum fights, procurement, safety tech, district budgets.
- Courts and civil liberties: habeas tracking, state court transparency, fines/fees, due process, protest rights.
- Nonprofit and public-interest transparency: IRS 990s, grants, contractors, affiliated entities, conflicts.

## Features that would make the web app feel full-fledged

### 1. Civic home dashboard

Create a user-facing dashboard with:

- Saved topics
- Saved region
- Latest changes across watched issues
- Upcoming decision points
- Recommended actions by urgency and location
- Recently viewed sources
- Newsletter/alert settings

This turns the web app from "browse a library" into "check what matters today."

### 2. Location and representative routing

Add an address or ZIP lookup flow that resolves:

- Federal, state, county, city, school-board, and utility-board representatives
- Agencies or boards connected to each topic
- Contact links, phone numbers, meeting pages, and public-comment rules
- Which actions apply to the user's jurisdiction

For mobile, this should become the primary onboarding path. For web, it should power topic-level "who can act" panels.

### 3. Action workspace

Replace static action scripts with a task flow:

- Choose issue
- Choose role: resident, journalist, advocate, student, official
- Pick action: call, email, public comment, records request, meeting testimony, share brief
- Generate/edit script
- Save completion status
- Set follow-up reminder
- Track whether the official responded

This can start as local state/mobile storage, then move to accounts later.

### 4. Public-record request center

Borrow from MuckRock without trying to clone it:

- Agency directory
- Request templates per topic
- Record checklist
- Deadline calculator by state
- Request status tracker
- Upload/link received documents
- "What this document proves" annotation field

This fits the existing source-first model and would differentiate the hub from ordinary advocacy sites.

### 5. Evidence database and global search

Add a structured search across:

- Topics
- Claims
- Findings
- Stats
- Sources
- Agencies
- People/organizations
- Bills, votes, filings, permits, contracts

Each result should show the source, citation, topic, and confidence/status. The current source-index model is a good base for this.

### 6. Local civic newsfeed

Add CivicScope-style feed cards:

- "What happened"
- "Why it matters"
- "Who decided"
- "Money involved"
- "Source document"
- "Next date"
- "Action available"

This should be the mobile default feed and a web homepage module. It can begin with curated updates from the topic seed model before automation exists.

### 7. Data apps per topic

Build at least one lightweight tool per major topic family:

- Congressional stock trading: member position tracker, discharge petition status, disclosure links.
- Surveillance: municipality technology inventory, retention-policy checklist, public-record request generator.
- Data centers: tax-abatement calculator, water/power impact checklist, hearing tracker.
- Glyphosate: exposure-route explorer, local public-space spraying policy tracker.
- Gaza/U.S. influence: campaign-spending tracker by race and office, legal-record timeline.
- Election claims: claim checker, rule-change tracker, access-risk matrix.

### 8. Trust and methodology layer

Add visible methodology pages:

- How sources are selected
- How claims are rated
- What "documented", "contested", "unsupported", and "watch" mean
- Last checked timestamps
- Corrections policy
- Nonpartisanship / editorial standards
- AI-use disclosure if summaries or extraction are automated

This matters because civic trust is a product feature.

## Features that would make the mobile app feel full-fledged

### 1. Personalized "Today" tab

The first mobile screen should be less like a landing page and more like an operating dashboard:

- New since last visit
- High-urgency watched issues
- Action due this week
- Local meetings / comment deadlines
- One-tap call/email actions

### 2. Saved topics and push alerts

Users should be able to follow:

- Topics
- Regions
- Agencies
- Representatives
- Keywords

Alert types:

- New source added
- Decision point approaching
- Public comment window open
- Representative changed position
- New claim debunked or verified
- Weekly digest

### 3. Offline field kit

Mobile should support practical civic work:

- Save action scripts offline
- Save sources for a meeting
- Copy public-comment text
- Store contact info for officials
- Meeting checklist
- Photo/document upload placeholder for future evidence intake

### 4. "At the meeting" mode

A simple mode for public meetings:

- Current topic summary
- 60-second talking points
- Source links
- Public-comment timer
- Notes field
- Follow-up task

This is a strong mobile-specific feature that web competitors often do not prioritize.

### 5. Civic profile

Let users set:

- ZIP/address or jurisdiction
- Issue priorities
- Preferred notification cadence
- Preferred action types
- Representative list
- Saved scripts and completed tasks

## Implementation roadmap

### Phase 1: Make the existing product feel active

- Add web routes: `/updates`, `/actions`, `/sources`, `/methodology`.
- Add a global search over the existing seed model.
- Add saved topics using local storage on web and AsyncStorage on mobile.
- Add "follow topic" controls and a followed-topics dashboard.
- Add a corrections/methodology page.
- Convert current topic updates into a cross-topic newsfeed.

### Phase 2: Make it useful by location

- Add ZIP/address capture and store a civic profile.
- Integrate representative lookup from official/public datasets.
- Attach actions to relevant office types: Congress, state legislature, city council, county board, school board, agency.
- Add contact actions: call, email, website, public meeting, public records.
- Add location-aware topic filtering.

### Phase 3: Make research actionable

- Add public-record request templates and a request tracker.
- Add action completion tracking and reminders.
- Add meeting mode on mobile.
- Add source annotation and evidence notes.
- Add topic-specific mini tools for the six existing topics.

### Phase 4: Make it scalable

- Move topic content fully into Convex.
- Add user accounts.
- Add subscriptions and push/email notifications.
- Add ingestion jobs for official updates, meeting pages, court dockets, disclosures, and public datasets.
- Add human-review workflow for generated summaries.
- Add structured entity pages for people, agencies, companies, PACs, bills, and jurisdictions.

## Suggested product architecture additions

- `civicProfiles`: user jurisdiction, followed topics, issue priorities, notification preferences.
- `entities`: people, agencies, companies, PACs, jurisdictions, bills, cases, meetings.
- `sourceDocuments`: canonical source records with URL, publisher, date, jurisdiction, document type, extraction status.
- `evidenceClaims`: claim, status, confidence, linked sources, linked entities, topic.
- `actions`: action type, target office/entity, script, deadline, user completion state.
- `updates`: normalized feed items across topics and regions.
- `publicRecordRequests`: template, agency, deadline, status, linked documents.

## Priority build order

1. Global search and cross-topic update feed.
2. Saved topics and local civic profile.
3. Methodology/corrections/trust pages.
4. Web action center and mobile Today tab.
5. ZIP/representative lookup.
6. Public-record request center.
7. Topic-specific data tools.
8. Push/email alerts.
9. Accounts and server-backed personalization.
10. Automated ingestion with human review.

## Sources reviewed

- MuckRock: https://www.muckrock.com/
- Campaign Legal Center issues: https://campaignlegal.org/issues
- Campaign Legal Center toolkits: https://campaignlegal.org/toolkits
- Sunlight Foundation open data resources: https://sunlightfoundation.com/our-work/open-cities/projects-resources/
- Tactical Data Engagement: https://communities.sunlightfoundation.com/methodology/
- RepRadar: https://www.repradar.app/about
- CivicScope: https://www.thecivicscope.com/about
- ProPublica: https://www.propublica.org/
- POPVOX: https://popvox.com/
- CivicPlus: https://www.civicplus.com/
