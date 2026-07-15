import Foundation
import SwiftUI


enum CivicUrgency: String, Codable, CaseIterable, Sendable {
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
        case .urgent: CivicStyle.red
        case .important: Color(red: 0.82, green: 0.48, blue: 0.08)
        case .watch: CivicStyle.green
        }
    }
}

struct CivicTopic: Identifiable, Hashable, Codable, Sendable {
    let id: String
    let title: String
    let shortTitle: String
    let summary: String
    let theme: String
    let updatedAt: Date?

    var symbol: String {
        switch theme.lowercased() {
        case "surveillance": "camera.viewfinder"
        case "health": "cross.case.fill"
        case "environment": "leaf.fill"
        case "democracy": "checkmark.seal.fill"
        case "money": "dollarsign.arrow.circlepath"
        case "technology": "server.rack"
        default: "newspaper.fill"
        }
    }

    var tint: Color {
        switch theme.lowercased() {
        case "surveillance": Color(red: 0.48, green: 0.28, blue: 0.68)
        case "health": Color(red: 0.72, green: 0.20, blue: 0.24)
        case "environment": Color(red: 0.36, green: 0.56, blue: 0.18)
        case "democracy": Color(red: 0.20, green: 0.36, blue: 0.68)
        case "money": Color(red: 0.22, green: 0.52, blue: 0.30)
        case "technology": Color(red: 0.14, green: 0.42, blue: 0.74)
        default: CivicStyle.blue
        }
    }
}

struct CivicSource: Identifiable, Hashable, Codable, Sendable {
    var id: String { url.absoluteString }
    let title: String
    let publisher: String
    let url: URL
    let reliability: String
    let publishedAt: Date?
}

struct CivicEvidence: Identifiable, Hashable, Codable, Sendable {
    var id: String { "\(claim)|\(classification)" }
    let claim: String
    let context: String
    let classification: String
    let evidenceStrength: String
}

struct CivicAction: Identifiable, Hashable, Codable, Sendable {
    var id: String { "\(actionKind)|\(title)" }
    let title: String
    let description: String
    let actionKind: String
    let audience: String
    let deadlineAt: Date?
    let ctaLabel: String
    let ctaURL: URL?
    let script: String?
}

struct CivicMeeting: Hashable, Codable, Sendable {
    let title: String
    let bodyName: String
    let startsAt: Date
    let endsAt: Date?
    let timezone: String
    let locationName: String?
    let address: String?
    let remoteURL: URL?
    let agendaURL: URL?
    let publicCommentDeadline: Date?
    let status: String
    let latitude: Double?
    let longitude: Double?

    var hasCoordinate: Bool { latitude != nil && longitude != nil }
}

struct CivicEvent: Identifiable, Hashable, Codable, Sendable {
    var id: String { key }
    let key: String
    let headline: String
    let summary: String
    let whyItMatters: String
    let eventKind: String
    let geographicScope: String
    let jurisdictionKeys: [String]
    let urgency: CivicUrgency
    let confidence: String
    let lifecycleStatus: String
    let startsAt: Date?
    let deadlineAt: Date?
    let publishedAt: Date
    let updatedAt: Date
    let deepLinkPath: String
    let topicSlugs: [String]
    let sources: [CivicSource]
    let evidence: [CivicEvidence]
    let actions: [CivicAction]
    let meeting: CivicMeeting?

    var title: String { headline }
    var topicSlug: String { topicSlugs.first ?? "general" }
    var locationLabel: String {
        meeting?.locationName ?? meeting?.address ?? geographicScope
    }
    var timingLabel: String? {
        let date = deadlineAt ?? startsAt ?? meeting?.startsAt
        return date?.formatted(date: .abbreviated, time: .shortened)
    }
    var primaryAction: CivicAction? { actions.first }
}

enum FeedSource: String, Codable, Sendable {
    case live
    case cache
    case bundled
}

struct FeedSnapshot: Codable, Sendable, Equatable {
    let events: [CivicEvent]
    let fetchedAt: Date
    let source: FeedSource
    let isStale: Bool
}

enum FeedState: Equatable, Sendable {
    case loading
    case live(Date)
    case stale(Date)
    case offline(Date?)
    case failed(String)

    var label: String {
        switch self {
        case .loading: "Loading civic brief"
        case .live(let date): "Live · updated \(date.formatted(.relative(presentation: .named)))"
        case .stale(let date): "Cached · updated \(date.formatted(.relative(presentation: .named)))"
        case .offline: "Offline starter brief"
        case .failed: "Unable to load civic brief"
        }
    }
}

enum CivicFixtures {
    static let topics: [CivicTopic] = [
        CivicTopic(id: "michigan-data-centers", title: "Data Centers", shortTitle: "Data Centers", summary: "Water, grid, noise, tax incentives, land use, and the votes that decide them.", theme: "technology", updatedAt: nil),
        CivicTopic(id: "michigan-surveillance-stack", title: "Flock Cameras & Mass Surveillance", shortTitle: "Surveillance", summary: "ALPR networks, retention, agency access, audits, and expanding AI capabilities.", theme: "surveillance", updatedAt: nil),
        CivicTopic(id: "congressional-stock-trading", title: "Money in Politics", shortTitle: "Money in Politics", summary: "Stock trading, campaign money, lobbying, disclosures, conflicts, and reform leverage.", theme: "money", updatedAt: nil),
    ]

    static let events: [CivicEvent] = [
        CivicEvent(
            key: "ypsilanti-data-center-session",
            headline: "Ypsilanti Township hosts a data-center information session",
            summary: "Township officials scheduled an information session and public comment on local data-center proposals. This is not an approval vote, so residents still have leverage.",
            whyItMatters: "Early zoning and utility decisions shape water demand, grid upgrades, generator use, noise limits, public subsidies, and who carries the long-term cost.",
            eventKind: "meeting",
            geographicScope: "Ypsilanti Township, Michigan",
            jurisdictionKeys: ["US-MI", "US-MI-WASHTENAW", "YPSILANTI-TOWNSHIP"],
            urgency: .urgent,
            confidence: "high",
            lifecycleStatus: "active",
            startsAt: fixtureDate("2026-08-12T22:00:00Z"),
            deadlineAt: nil,
            publishedAt: fixtureDate("2026-07-15T12:00:00Z"),
            updatedAt: fixtureDate("2026-07-15T12:00:00Z"),
            deepLinkPath: "/alerts/ypsilanti-data-center-session",
            topicSlugs: ["michigan-data-centers"],
            sources: [
                CivicSource(title: "Official township public files", publisher: "Ypsilanti Township", url: knownURL("https://files.ypsitownship.org/"), reliability: "primary", publishedAt: nil),
            ],
            evidence: [
                CivicEvidence(claim: "An information session is scheduled before a final approval vote.", context: "Township public notice", classification: "confirmed", evidenceStrength: "primary record"),
            ],
            actions: [
                CivicAction(title: "Review the public file", description: "Read the agenda and supporting material before commenting.", actionKind: "review", audience: "Ypsilanti Township residents", deadlineAt: nil, ctaLabel: "Open official files", ctaURL: URL(string: "https://files.ypsitownship.org/"), script: "Before any vote, please publish peak electric load, maximum daily water demand, generator testing schedules, noise modeling, tax concessions, and who pays for public-system upgrades."),
            ],
            meeting: CivicMeeting(title: "Data-center information session", bodyName: "Ypsilanti Township", startsAt: fixtureDate("2026-08-12T22:00:00Z"), endsAt: nil, timezone: "America/Detroit", locationName: "Ypsilanti Township Civic Center", address: "7200 S Huron River Drive", remoteURL: nil, agendaURL: URL(string: "https://files.ypsitownship.org/"), publicCommentDeadline: nil, status: "scheduled", latitude: 42.205, longitude: -83.617)
        ),
        CivicEvent(
            key: "michigan-flock-contract-review",
            headline: "Before a camera vote, ask who else can search the network",
            summary: "A local plate reader can become part of a much larger searchable network through retention, hotlists, and outside-agency access.",
            whyItMatters: "Contract approval is the moment to require a public-use policy, audit access, deletion rules, and a new vote before AI or face-search tools are added.",
            eventKind: "contract",
            geographicScope: "Michigan",
            jurisdictionKeys: ["US-MI"],
            urgency: .important,
            confidence: "medium",
            lifecycleStatus: "active",
            startsAt: nil,
            deadlineAt: nil,
            publishedAt: fixtureDate("2026-07-14T12:00:00Z"),
            updatedAt: fixtureDate("2026-07-15T09:00:00Z"),
            deepLinkPath: "/alerts/michigan-flock-contract-review",
            topicSlugs: ["michigan-surveillance-stack"],
            sources: [],
            evidence: [],
            actions: [CivicAction(title: "Ask for contract safeguards", description: "Request retention, access, and audit terms before approval.", actionKind: "contact", audience: "Local officials", deadlineAt: nil, ctaLabel: "Review the public camera map", ctaURL: URL(string: "https://deflock.me/map"), script: "Please publish the contract, retention period, every outside agency with access, search audit logs, hotlist rules, and planned AI integrations before this vote.")],
            meeting: nil
        ),
    ]

    private static func knownURL(_ value: String) -> URL {
        URL(string: value) ?? URL(fileURLWithPath: "/")
    }

    private static func fixtureDate(_ value: String) -> Date {
        ISO8601DateFormatter().date(from: value) ?? Date(timeIntervalSince1970: 0)
    }
}
