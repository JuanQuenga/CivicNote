import Foundation

struct TopicsResponseDTO: Decodable {
    let topics: [TopicDTO]
}

struct TopicDTO: Decodable {
    let slug: String
    let title: String
    let shortTitle: String
    let summary: String
    let theme: String
    let updatedAt: Date?

    func domain() -> CivicTopic {
        CivicTopic(id: slug, title: title, shortTitle: shortTitle, summary: summary, theme: theme, updatedAt: updatedAt)
    }
}

struct EventsResponseDTO: Decodable {
    let events: [EventSummaryDTO]
    let fetchedAt: Date
}

struct EventResponseDTO: Decodable {
    let event: EventDetailDTO
}

struct EventSummaryDTO: Decodable {
    let key: String
    let headline: String
    let summary: String
    let whyItMatters: String
    let eventKind: String
    let geographicScope: String
    let jurisdictionKeys: [String]
    let urgency: String
    let confidence: String
    let lifecycleStatus: String
    let startsAt: Date?
    let deadlineAt: Date?
    let publishedAt: Date
    let updatedAt: Date
    let deepLinkPath: String
    let topicSlugs: [String]

    func domain(
        sources: [CivicSource] = [],
        evidence: [CivicEvidence] = [],
        actions: [CivicAction] = [],
        meeting: CivicMeeting? = nil
    ) -> CivicEvent {
        CivicEvent(
            key: key,
            headline: headline,
            summary: summary,
            whyItMatters: whyItMatters,
            eventKind: eventKind,
            geographicScope: geographicScope,
            jurisdictionKeys: jurisdictionKeys,
            urgency: CivicUrgency(transportValue: urgency),
            confidence: confidence,
            lifecycleStatus: lifecycleStatus,
            startsAt: startsAt,
            deadlineAt: deadlineAt,
            publishedAt: publishedAt,
            updatedAt: updatedAt,
            deepLinkPath: deepLinkPath,
            topicSlugs: topicSlugs,
            sources: sources,
            evidence: evidence,
            actions: actions,
            meeting: meeting
        )
    }
}

struct EventDetailDTO: Decodable {
    let key: String
    let headline: String
    let summary: String
    let whyItMatters: String
    let eventKind: String
    let geographicScope: String
    let jurisdictionKeys: [String]
    let urgency: String
    let confidence: String
    let lifecycleStatus: String
    let startsAt: Date?
    let deadlineAt: Date?
    let publishedAt: Date
    let updatedAt: Date
    let deepLinkPath: String
    let topicSlugs: [String]
    let sources: [SourceDTO]
    let evidence: [EvidenceDTO]
    let actions: [ActionDTO]
    let meeting: MeetingDTO?

    func domain() -> CivicEvent {
        EventSummaryDTO(
            key: key,
            headline: headline,
            summary: summary,
            whyItMatters: whyItMatters,
            eventKind: eventKind,
            geographicScope: geographicScope,
            jurisdictionKeys: jurisdictionKeys,
            urgency: urgency,
            confidence: confidence,
            lifecycleStatus: lifecycleStatus,
            startsAt: startsAt,
            deadlineAt: deadlineAt,
            publishedAt: publishedAt,
            updatedAt: updatedAt,
            deepLinkPath: deepLinkPath,
            topicSlugs: topicSlugs
        ).domain(
            sources: sources.compactMap { $0.domain() },
            evidence: evidence.map { $0.domain() },
            actions: actions.map { $0.domain() },
            meeting: meeting?.domain()
        )
    }
}

struct SourceDTO: Decodable {
    let title: String
    let publisher: String
    let url: String
    let reliability: String
    let publishedAt: Date?

    func domain() -> CivicSource? {
        guard let parsedURL = URL(string: url), parsedURL.scheme == "https" || parsedURL.scheme == "http" else {
            return nil
        }
        return CivicSource(title: title, publisher: publisher, url: parsedURL, reliability: reliability, publishedAt: publishedAt)
    }
}

struct EvidenceDTO: Decodable {
    let claim: String
    let context: String
    let classification: String
    let evidenceStrength: String

    func domain() -> CivicEvidence {
        CivicEvidence(claim: claim, context: context, classification: classification, evidenceStrength: evidenceStrength)
    }
}

struct ActionDTO: Decodable {
    let title: String
    let description: String
    let actionKind: String
    let audience: String
    let deadlineAt: Date?
    let ctaLabel: String
    let ctaUrl: String?
    let script: String?

    func domain() -> CivicAction {
        let parsedURL = ctaUrl.flatMap(URL.init(string:)).flatMap { url in
            url.scheme == "https" || url.scheme == "http" ? url : nil
        }
        return CivicAction(title: title, description: description, actionKind: actionKind, audience: audience, deadlineAt: deadlineAt, ctaLabel: ctaLabel, ctaURL: parsedURL, script: script)
    }
}

struct MeetingDTO: Decodable {
    let title: String
    let bodyName: String
    let startsAt: Date
    let endsAt: Date?
    let timezone: String
    let locationName: String?
    let address: String?
    let remoteUrl: String?
    let agendaUrl: String?
    let publicCommentDeadline: Date?
    let status: String

    func domain() -> CivicMeeting {
        CivicMeeting(
            title: title,
            bodyName: bodyName,
            startsAt: startsAt,
            endsAt: endsAt,
            timezone: timezone,
            locationName: locationName,
            address: address,
            remoteURL: Self.validWebURL(remoteUrl),
            agendaURL: Self.validWebURL(agendaUrl),
            publicCommentDeadline: publicCommentDeadline,
            status: status,
            latitude: nil,
            longitude: nil
        )
    }

    private static func validWebURL(_ value: String?) -> URL? {
        guard let value, let url = URL(string: value), url.scheme == "https" || url.scheme == "http" else { return nil }
        return url
    }
}

extension CivicUrgency {
    init(transportValue: String) {
        switch transportValue.lowercased() {
        case "critical", "high": self = .urgent
        case "medium": self = .important
        case "low": self = .watch
        default: self = .watch
        }
    }
}

enum NotificationPermissionValue: String, Codable {
    case unknown
    case granted
    case denied
}

struct InstallationReconcileRequest: Encodable {
    let installationId: String
    let platform = "ios"
    let appVersion: String
    let preferences: InstallationPreferencesPayload
    let pushTarget: PushTargetPayload?
}

struct InstallationPreferencesPayload: Encodable {
    let topicSlugs: [String]
    let cadence: String
    let position: String
    let regionCode: String?
    let notificationsEnabled: Bool
    let notificationPermission: NotificationPermissionValue
}

struct PushTargetPayload: Encodable {
    let provider = "apns"
    let token: String
    let environment: String
}

struct ReconcileResponseDTO: Decodable {
    let ok: Bool
    let profileId: String
    let subscriptions: Int
    let jurisdictionKeys: [String]
}

struct PauseRequest: Encodable {
    let installationId: String
}

struct PauseResponseDTO: Decodable {
    let ok: Bool
}

struct TopicRequestSubmission: Encodable {
    let installationId: String
    let subject: String
    let reason: String?
    let regionHint: String?
}

struct TopicRequestSubmissionResponseDTO: Decodable {
    let ok: Bool
    let alreadyRequested: Bool
}

struct TopicRequestsResponseDTO: Decodable {
    let requests: [TopicRequestDTO]
}

struct TopicRequestDTO: Decodable {
    let id: String
    let subject: String
    let status: String
    let note: String?
    let topicSlug: String?
    let createdAt: Date
    let reviewedAt: Date?

    func domain() -> TopicRequest {
        TopicRequest(
            id: id,
            subject: subject,
            status: TopicRequestStatus(transportValue: status),
            note: note,
            topicSlug: topicSlug,
            createdAt: createdAt,
            reviewedAt: reviewedAt
        )
    }
}

/// The server's error envelope. Its `error` is written for the reader — a rate
/// limit or a too-short subject explains itself — so it is shown verbatim
/// rather than replaced with a status code.
struct CivicErrorDTO: Decodable {
    let error: String
}

enum CivicJSON {
    static func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            if let date = ISO8601DateFormatter.civicFractional.date(from: value)
                ?? ISO8601DateFormatter.civic.date(from: value)
                ?? DateFormatter.civicDateOnly.date(from: value) {
                return date
            }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid ISO 8601 date: \(value)")
        }
        return decoder
    }

    static func encoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        return encoder
    }
}

private extension DateFormatter {
    // Seeded topics carry date-only "updatedAt" values like "2026-05-12".
    static let civicDateOnly: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

private extension ISO8601DateFormatter {
    static let civic: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    static let civicFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}
