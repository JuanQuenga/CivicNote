import Combine
import Foundation

protocol CivicRepository: Sendable {
    func fetchTopics() async throws -> [CivicTopic]
    func fetchEvents(topic: String?, jurisdiction: String?, limit: Int) async throws -> FeedSnapshot
    func fetchEvent(key: String) async throws -> CivicEvent
}

enum CivicRepositoryError: LocalizedError {
    case invalidBaseURL
    case invalidResponse
    case httpStatus(Int)

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL: "CivicNote API URL is not configured."
        case .invalidResponse: "The civic feed returned an invalid response."
        case .httpStatus(let status): "The civic feed returned HTTP \(status)."
        }
    }
}

struct BundledCivicRepository: CivicRepository {
    func fetchTopics() async throws -> [CivicTopic] { CivicFixtures.topics }

    func fetchEvents(topic: String?, jurisdiction: String?, limit: Int) async throws -> FeedSnapshot {
        FeedSnapshot(events: Array(CivicFixtures.events.prefix(limit)), fetchedAt: Date(timeIntervalSince1970: 0), source: .bundled, isStale: true)
    }

    func fetchEvent(key: String) async throws -> CivicEvent {
        guard let event = CivicFixtures.events.first(where: { $0.key == key }) else {
            throw CivicRepositoryError.invalidResponse
        }
        return event
    }
}

struct LiveCivicRepository: CivicRepository {
    let baseURL: URL
    let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func fetchTopics() async throws -> [CivicTopic] {
        let response: TopicsResponseDTO = try await request(path: ["api", "v1", "topics"])
        return response.topics.map { $0.domain() }
    }

    func fetchEvents(topic: String?, jurisdiction: String?, limit: Int) async throws -> FeedSnapshot {
        var query: [URLQueryItem] = [URLQueryItem(name: "limit", value: String(limit))]
        if let topic, !topic.isEmpty { query.append(URLQueryItem(name: "topic", value: topic)) }
        if let jurisdiction, !jurisdiction.isEmpty { query.append(URLQueryItem(name: "jurisdiction", value: jurisdiction)) }
        let response: EventsResponseDTO = try await request(path: ["api", "v1", "events"], query: query)
        return FeedSnapshot(events: response.events.map { $0.domain() }, fetchedAt: response.fetchedAt, source: .live, isStale: false)
    }

    func fetchEvent(key: String) async throws -> CivicEvent {
        let response: EventResponseDTO = try await request(path: ["api", "v1", "events", key])
        return response.event.domain()
    }

    private func request<Response: Decodable>(path: [String], query: [URLQueryItem] = []) async throws -> Response {
        var url = baseURL
        for component in path { url.appendPathComponent(component) }
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw CivicRepositoryError.invalidBaseURL
        }
        if !query.isEmpty { components.queryItems = query }
        guard let requestURL = components.url else { throw CivicRepositoryError.invalidBaseURL }
        var request = URLRequest(url: requestURL)
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw CivicRepositoryError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw CivicRepositoryError.httpStatus(http.statusCode) }
        return try CivicJSON.decoder().decode(Response.self, from: data)
    }
}

actor CachedCivicRepository: CivicRepository {
    private let live: CivicRepository
    private let cacheDirectory: URL
    private let now: @Sendable () -> Date
    private let staleAfter: TimeInterval
    private let fileManager: FileManager

    init(
        live: CivicRepository,
        cacheDirectory: URL? = nil,
        staleAfter: TimeInterval = 6 * 60 * 60,
        now: @escaping @Sendable () -> Date = { Date() },
        fileManager: FileManager = .default
    ) {
        self.live = live
        self.staleAfter = staleAfter
        self.now = now
        self.fileManager = fileManager
        if let cacheDirectory {
            self.cacheDirectory = cacheDirectory
        } else {
            let support = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
                ?? fileManager.temporaryDirectory
            self.cacheDirectory = support.appendingPathComponent("CivicNote", isDirectory: true)
        }
    }

    func fetchTopics() async throws -> [CivicTopic] {
        do {
            let topics = try await live.fetchTopics()
            try write(topics, to: topicsURL)
            return topics
        } catch {
            if let cached: [CivicTopic] = try? read(from: topicsURL) { return cached }
            return CivicFixtures.topics
        }
    }

    func fetchEvents(topic: String?, jurisdiction: String?, limit: Int) async throws -> FeedSnapshot {
        do {
            let snapshot = try await live.fetchEvents(topic: topic, jurisdiction: jurisdiction, limit: limit)
            try write(snapshot, to: feedURL)
            return snapshot
        } catch {
            if let cached = cachedFeed() { return cached }
            return bundledFeed()
        }
    }

    func fetchEvent(key: String) async throws -> CivicEvent {
        do {
            let event = try await live.fetchEvent(key: key)
            try write(event, to: detailURL(key: key))
            return event
        } catch {
            if let cached: CivicEvent = try? read(from: detailURL(key: key)) { return cached }
            if let event = cachedFeed()?.events.first(where: { $0.key == key }) { return event }
            if let event = CivicFixtures.events.first(where: { $0.key == key }) { return event }
            throw error
        }
    }

    func cachedFeed() -> FeedSnapshot? {
        guard let stored: FeedSnapshot = try? read(from: feedURL) else { return nil }
        let stale = now().timeIntervalSince(stored.fetchedAt) > staleAfter
        return FeedSnapshot(events: stored.events, fetchedAt: stored.fetchedAt, source: .cache, isStale: stale)
    }

    func bundledFeed() -> FeedSnapshot {
        FeedSnapshot(events: CivicFixtures.events, fetchedAt: Date(timeIntervalSince1970: 0), source: .bundled, isStale: true)
    }

    private var feedURL: URL { cacheDirectory.appendingPathComponent("feed.json") }
    private var topicsURL: URL { cacheDirectory.appendingPathComponent("topics.json") }

    private func detailURL(key: String) -> URL {
        let safeKey = key.replacingOccurrences(of: "/", with: "-")
        return cacheDirectory.appendingPathComponent("event-\(safeKey).json")
    }

    private func write<Value: Encodable>(_ value: Value, to url: URL) throws {
        try fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        let data = try CivicJSON.encoder().encode(value)
        try data.write(to: url, options: [.atomic])
    }

    private func read<Value: Decodable>(from url: URL) throws -> Value {
        let data = try Data(contentsOf: url)
        return try CivicJSON.decoder().decode(Value.self, from: data)
    }
}

@MainActor
final class CivicRepositoryStore: ObservableObject {
    @Published private(set) var topics: [CivicTopic] = []
    @Published private(set) var events: [CivicEvent] = []
    @Published private(set) var state: FeedState = .loading
    @Published private(set) var lastError: String?

    let repository: CachedCivicRepository
    private let preferences: PreferencesStore

    init(repository: CachedCivicRepository, preferences: PreferencesStore) {
        self.repository = repository
        self.preferences = preferences
    }

    var filteredEvents: [CivicEvent] {
        events.filter { event in
            let matchesTopic = preferences.topicSlugs.isEmpty || !preferences.topicSlugs.isDisjoint(with: event.topicSlugs)
            return matchesTopic && preferences.eventMatchesRegion(event)
        }
    }

    func start() async {
        if let cached = await repository.cachedFeed() { apply(cached) }
        else { apply(await repository.bundledFeed()) }
        topics = CivicFixtures.topics
        Task { [weak self] in
            guard let self else { return }
            self.topics = await (try? self.repository.fetchTopics()) ?? CivicFixtures.topics
            await self.refresh()
        }
    }

    func refresh() async {
        let snapshot: FeedSnapshot
        if let refreshed = try? await repository.fetchEvents(topic: nil, jurisdiction: preferences.regionCode.nilIfEmpty, limit: 50) {
            snapshot = refreshed
        } else {
            snapshot = await repository.bundledFeed()
        }
        apply(snapshot)
    }

    func event(key: String) async throws -> CivicEvent {
        if let current = events.first(where: { $0.key == key }), !current.sources.isEmpty || !current.actions.isEmpty {
            return current
        }
        return try await repository.fetchEvent(key: key)
    }

    private func apply(_ snapshot: FeedSnapshot) {
        events = snapshot.events
        switch snapshot.source {
        case .live:
            state = .live(snapshot.fetchedAt)
            lastError = nil
        case .cache:
            state = .stale(snapshot.fetchedAt)
        case .bundled:
            state = .offline(nil)
        }
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
