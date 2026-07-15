import Foundation
import SwiftUI

enum CivicUrgency: String, Codable, CaseIterable {
    case urgent
    case important
    case watch

    var title: String {
        switch self {
        case .urgent: "Urgent"
        case .important: "Important"
        case .watch: "Watch"
        }
    }

    var color: Color {
        switch self {
        case .urgent: Color(red: 0.82, green: 0.18, blue: 0.18)
        case .important: Color(red: 0.82, green: 0.48, blue: 0.08)
        case .watch: Color(red: 0.12, green: 0.45, blue: 0.42)
        }
    }
}

struct CivicSource: Identifiable, Hashable, Codable {
    let id: String
    let title: String
    let publisher: String
    let url: URL

    init(title: String, publisher: String, url: String) {
        id = url
        self.title = title
        self.publisher = publisher
        self.url = URL(string: url)!
    }
}

struct CivicEvent: Identifiable, Hashable, Codable {
    let id: String
    let topicSlug: String
    let topic: String
    let title: String
    let summary: String
    let whyItMatters: String
    let harms: [String]
    let location: String
    let jurisdiction: String
    let timing: String?
    let venue: String?
    let urgency: CivicUrgency
    let decisionMaker: String
    let actionLabel: String
    let actionURL: URL
    let script: String
    let sources: [CivicSource]

    var isLocal: Bool { location.localizedCaseInsensitiveContains("Michigan") || location.localizedCaseInsensitiveContains("Ypsilanti") }
}

struct CivicTopic: Identifiable, Hashable {
    let id: String
    let title: String
    let shortTitle: String
    let summary: String
    let symbol: String
    let tint: Color
}

enum CivicFixtures {
    static let topics: [CivicTopic] = [
        .init(
            id: "michigan-data-centers",
            title: "Data Centers",
            shortTitle: "Data Centers",
            summary: "Water, grid, noise, tax incentives, land use, and the local votes that decide them.",
            symbol: "server.rack",
            tint: Color(red: 0.14, green: 0.42, blue: 0.74)
        ),
        .init(
            id: "michigan-surveillance-stack",
            title: "Flock Cameras & Mass Surveillance",
            shortTitle: "Surveillance",
            summary: "ALPR networks, retention, agency access, search audits, and expanding AI capabilities.",
            symbol: "camera.viewfinder",
            tint: Color(red: 0.48, green: 0.28, blue: 0.68)
        ),
        .init(
            id: "israel-gaza",
            title: "Israel & Gaza",
            shortTitle: "Israel & Gaza",
            summary: "U.S. policy, arms transfers, humanitarian access, civilian harm, and votes in Congress.",
            symbol: "globe.americas.fill",
            tint: Color(red: 0.12, green: 0.48, blue: 0.48)
        ),
        .init(
            id: "congressional-stock-trading",
            title: "Money in Politics",
            shortTitle: "Money in Politics",
            summary: "Stock trading, campaign money, lobbying, disclosures, conflicts, and reform leverage.",
            symbol: "dollarsign.arrow.circlepath",
            tint: Color(red: 0.22, green: 0.52, blue: 0.30)
        ),
        .init(
            id: "glyphosate",
            title: "Glyphosate",
            shortTitle: "Glyphosate",
            summary: "Regulatory findings, litigation, farm policy, exposure evidence, and local restrictions.",
            symbol: "leaf.fill",
            tint: Color(red: 0.36, green: 0.56, blue: 0.18)
        ),
        .init(
            id: "voter-fraud-claims",
            title: "Election Claims",
            shortTitle: "Election Claims",
            summary: "Separate verified records from contested or unsupported claims before policy follows.",
            symbol: "checkmark.seal.fill",
            tint: Color(red: 0.20, green: 0.36, blue: 0.68)
        ),
        .init(
            id: "ebola-outbreak",
            title: "Ebola Outbreaks",
            shortTitle: "Ebola",
            summary: "Public-health alerts, response capacity, travel guidance, and verified official updates.",
            symbol: "cross.case.fill",
            tint: Color(red: 0.72, green: 0.20, blue: 0.24)
        ),
    ]

    static let events: [CivicEvent] = [
        CivicEvent(
            id: "ypsilanti-data-center-session",
            topicSlug: "michigan-data-centers",
            topic: "Data Centers",
            title: "Ypsilanti Township hosts a data-center information session",
            summary: "Township officials scheduled an information session and public comment on local data-center proposals. This is not an approval vote, which means residents still have leverage before commitments harden.",
            whyItMatters: "Early zoning and utility decisions shape water demand, grid upgrades, generator use, noise limits, public subsidies, and who carries the long-term cost.",
            harms: [
                "Large peak electric loads can require new generation and transmission paid partly through public rates.",
                "Cooling systems may demand substantial water, especially during the hottest and driest periods.",
                "Backup generators, cooling equipment, and round-the-clock operation can add local air and noise impacts.",
                "Tax abatements can shift infrastructure costs while permanent job counts remain modest.",
            ],
            location: "Ypsilanti Township, Michigan",
            jurisdiction: "Ypsilanti Township",
            timing: "Wednesday · 6:00 PM",
            venue: "Civic Center · 7200 S Huron River Drive",
            urgency: .urgent,
            decisionMaker: "Township board and planning officials",
            actionLabel: "Open official township files",
            actionURL: URL(string: "https://files.ypsitownship.org/")!,
            script: "Before any vote, please publish peak electric load, maximum daily water demand, generator testing schedules, noise modeling, tax concessions, and who pays for every public-system upgrade.",
            sources: [
                .init(title: "Official township public files", publisher: "Ypsilanti Township", url: "https://files.ypsitownship.org/"),
                .init(title: "Michigan Data Centers Guide", publisher: "University of Michigan", url: "https://graham.umich.edu/product/michigan-data-centers-guide"),
            ]
        ),
        CivicEvent(
            id: "michigan-flock-contract-review",
            topicSlug: "michigan-surveillance-stack",
            topic: "Surveillance",
            title: "Before a camera vote, ask who else can search the network",
            summary: "A local plate reader can become part of a much larger searchable network through retention, hotlists, and outside-agency access.",
            whyItMatters: "Contract approval is the moment to require a public-use policy, audit access, deletion rules, and a new vote before AI or face-search tools are added.",
            harms: [
                "Vehicle movements can be reconstructed without individualized suspicion.",
                "Outside agencies may gain access beyond the community that approved the cameras.",
                "Hotlists and automated alerts can amplify bad data and expose people to repeated stops.",
            ],
            location: "Michigan",
            jurisdiction: "City and county governments",
            timing: "Contracts moving this month",
            venue: nil,
            urgency: .important,
            decisionMaker: "City councils and county boards",
            actionLabel: "Review the public camera map",
            actionURL: URL(string: "https://deflock.me/map")!,
            script: "Please publish the contract, retention period, every outside agency with access, search audit logs, hotlist rules, and any planned AI or facial-recognition integrations before this vote.",
            sources: [
                .init(title: "ALPR surveillance map", publisher: "DeFlock / ALPR Watch", url: "https://deflock.me/map"),
            ]
        ),
        CivicEvent(
            id: "arms-transfer-oversight",
            topicSlug: "israel-gaza",
            topic: "Israel & Gaza",
            title: "Congressional oversight is the leverage point on U.S. arms policy",
            summary: "Votes, notification periods, appropriations, and conditions on transfers create public decision points that can be tracked instead of treating policy as unchangeable.",
            whyItMatters: "Specific requests tied to an upcoming vote or notification window are more actionable than general statements to representatives.",
            harms: [
                "Civilian deaths, displacement, hunger, and damage to medical and water systems require independent verification and sustained scrutiny.",
                "Opaque transfer decisions make democratic oversight and compliance review harder.",
            ],
            location: "United States",
            jurisdiction: "U.S. Congress",
            timing: "Federal watch",
            venue: nil,
            urgency: .important,
            decisionMaker: "Members of Congress",
            actionLabel: "Find your representatives",
            actionURL: URL(string: "https://www.congress.gov/members/find-your-member")!,
            script: "Please support public reporting, independent civilian-harm review, and enforceable conditions tied to international and U.S. law before approving additional transfers.",
            sources: [
                .init(title: "Members of the U.S. Congress", publisher: "Congress.gov", url: "https://www.congress.gov/members/find-your-member"),
            ]
        ),
        CivicEvent(
            id: "stock-trading-disclosure-watch",
            topicSlug: "congressional-stock-trading",
            topic: "Money in Politics",
            title: "Financial disclosures create an accountability opening",
            summary: "Transaction reports become more useful when checked against committee work, votes, contracts, and bill movement.",
            whyItMatters: "Disclosure shows conflicts after the fact. Durable reform restricts individual holdings and covers spouses and dependents.",
            harms: [
                "Conflicts can undermine trust even when a trade does not violate current law.",
                "Delayed disclosure prevents timely accountability around votes and oversight.",
            ],
            location: "United States",
            jurisdiction: "U.S. Congress",
            timing: "New filings weekly",
            venue: nil,
            urgency: .watch,
            decisionMaker: "Members of Congress",
            actionLabel: "Check official disclosures",
            actionURL: URL(string: "https://disclosures-clerk.house.gov/")!,
            script: "Will you support a ban on individual stock ownership and trading that covers spouses and dependents while preserving diversified retirement funds?",
            sources: [
                .init(title: "Financial Disclosure Reports", publisher: "U.S. House Clerk", url: "https://disclosures-clerk.house.gov/"),
            ]
        ),
    ]
}
