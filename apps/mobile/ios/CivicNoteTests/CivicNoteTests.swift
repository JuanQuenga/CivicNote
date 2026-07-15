import XCTest
@testable import CivicNote

final class CivicNoteTests: XCTestCase {
    func testDTOMapsUrgencyAndDropsBadURLs() throws {
        let json = """
        {
          "key":"event-1","headline":"Headline","summary":"Summary","whyItMatters":"Why",
          "eventKind":"meeting","geographicScope":"Michigan","jurisdictionKeys":["US-MI"],
          "urgency":"critical","confidence":"high","lifecycleStatus":"active",
          "publishedAt":"2026-07-15T12:00:00Z","updatedAt":"2026-07-15T12:00:00Z",
          "deepLinkPath":"/alerts/event-1","topicSlugs":["topic"],
          "sources":[{"title":"Bad","publisher":"Publisher","url":"not a url","reliability":"primary"}],
          "evidence":[],
          "actions":[{"title":"Act","description":"Do it","actionKind":"contact","audience":"Public","ctaLabel":"Open","ctaUrl":"javascript:bad"}]
        }
        """
        let dto = try CivicJSON.decoder().decode(EventDetailDTO.self, from: Data(json.utf8))
        let event = dto.domain()
        XCTAssertEqual(event.urgency, .urgent)
        XCTAssertTrue(event.sources.isEmpty)
        XCTAssertNil(event.actions.first?.ctaURL)
    }

    func testUnknownUrgencyFallsBackToWatch() {
        XCTAssertEqual(CivicUrgency(transportValue: "unexpected"), .watch)
        XCTAssertEqual(CivicUrgency(transportValue: "medium"), .important)
        XCTAssertEqual(CivicUrgency(transportValue: "high"), .urgent)
    }

    func testCacheFreshnessAndFallbackOrder() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let fetchedAt = Date(timeIntervalSince1970: 1_000)
        let live = StubRepository(snapshot: FeedSnapshot(events: CivicFixtures.events, fetchedAt: fetchedAt, source: .live, isStale: false))
        let warming = CachedCivicRepository(live: live, cacheDirectory: directory, staleAfter: 100, now: { Date(timeIntervalSince1970: 1_050) })
        let liveResult = try await warming.fetchEvents(topic: nil, jurisdiction: nil, limit: 10)
        XCTAssertEqual(liveResult.source, .live)

        let cached = CachedCivicRepository(live: FailingRepository(), cacheDirectory: directory, staleAfter: 100, now: { Date(timeIntervalSince1970: 1_050) })
        let freshFallback = try await cached.fetchEvents(topic: nil, jurisdiction: nil, limit: 10)
        XCTAssertEqual(freshFallback.source, .cache)
        XCTAssertFalse(freshFallback.isStale)

        let stale = CachedCivicRepository(live: FailingRepository(), cacheDirectory: directory, staleAfter: 100, now: { Date(timeIntervalSince1970: 1_500) })
        let staleFallback = try await stale.fetchEvents(topic: nil, jurisdiction: nil, limit: 10)
        XCTAssertTrue(staleFallback.isStale)

        let empty = CachedCivicRepository(live: FailingRepository(), cacheDirectory: directory.appendingPathComponent("empty"))
        let bundled = try await empty.fetchEvents(topic: nil, jurisdiction: nil, limit: 10)
        XCTAssertEqual(bundled.source, .bundled)
    }

    @MainActor
    func testPreferenceMigrationAndPersistence() {
        let defaults = isolatedDefaults()
        defaults.set(["old-topic"], forKey: "civicnote.native.followed-topic-ids")
        defaults.set("Michigan", forKey: "civicnote.native.region")
        defaults.set("urgent", forKey: "civicnote.native.cadence")
        defaults.set(true, forKey: "civicnote.native.onboarding-complete")
        let secure = MemorySecureStore()

        var store: PreferencesStore? = PreferencesStore(defaults: defaults, installationIDs: InstallationIDStore(secureStore: secure))
        XCTAssertEqual(store?.topicSlugs, ["old-topic"])
        XCTAssertEqual(store?.regionCode, "US-MI")
        XCTAssertEqual(store?.cadence, .instant)
        XCTAssertEqual(store?.onboardingComplete, true)
        store?.areaLabel = "Washtenaw County"
        store = nil

        let restored = PreferencesStore(defaults: defaults, installationIDs: InstallationIDStore(secureStore: secure))
        XCTAssertEqual(restored.areaLabel, "Washtenaw County")
    }

    func testInstallationIDIsStable() {
        let secure = MemorySecureStore()
        let first = InstallationIDStore(secureStore: secure).installationID()
        let second = InstallationIDStore(secureStore: secure).installationID()
        XCTAssertEqual(first, second)
        XCTAssertNotNil(UUID(uuidString: first))
    }

    @MainActor
    func testReconcilePayloadEncoding() throws {
        let defaults = isolatedDefaults()
        let preferences = PreferencesStore(defaults: defaults, installationIDs: InstallationIDStore(secureStore: MemorySecureStore()))
        preferences.topicSlugs = ["b", "a"]
        preferences.regionCode = "US-MI"
        preferences.position = .support
        preferences.cadence = .daily
        preferences.notificationsEnabled = true
        let baseURL = try XCTUnwrap(URL(string: "https://example.com"))
        let service = NotificationService(preferences: preferences, baseURL: baseURL, defaults: defaults, networkEnabled: false)
        service.receivedDeviceToken(Data([0x0a, 0xff]))
        let data = try CivicJSON.encoder().encode(service.reconcileRequest())
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let payload = try XCTUnwrap(object["preferences"] as? [String: Any])
        let pushTarget = try XCTUnwrap(object["pushTarget"] as? [String: Any])
        XCTAssertEqual(object["platform"] as? String, "ios")
        XCTAssertEqual(pushTarget["provider"] as? String, "apns")
        XCTAssertEqual(pushTarget["token"] as? String, "0aff")
        XCTAssertEqual(payload["topicSlugs"] as? [String], ["a", "b"])
        XCTAssertEqual(payload["cadence"] as? String, "daily")
        XCTAssertEqual(payload["position"] as? String, "support")
        XCTAssertEqual(payload["regionCode"] as? String, "US-MI")
    }

    func testDeepLinkParsing() {
        XCTAssertEqual(DeepLinkRouter.route(url: URL(string: "civicnote://alerts/event-key")!)?.eventKey, "event-key")
        XCTAssertEqual(DeepLinkRouter.route(url: URL(string: "https://civicnote.org/alerts/event-key")!)?.eventKey, "event-key")
        XCTAssertEqual(DeepLinkRouter.route(payload: ["path": "/alerts/event-key"])?.eventKey, "event-key")
        XCTAssertNil(DeepLinkRouter.route(url: URL(string: "civicnote://settings")!))
    }

    func testRegionFiltering() {
        let local = CivicFixtures.events[0]
        let statewide = CivicFixtures.events[1]
        XCTAssertTrue(PreferencesStore.event(local, matchesRegionCode: "US-MI"))
        XCTAssertTrue(PreferencesStore.event(statewide, matchesRegionCode: "US-MI"))
        XCTAssertFalse(PreferencesStore.event(local, matchesRegionCode: "US-CA"))
    }

    private func isolatedDefaults() -> UserDefaults {
        let suite = "CivicNoteTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite) ?? .standard
        defaults.removePersistentDomain(forName: suite)
        return defaults
    }
}

private struct StubRepository: CivicRepository {
    let snapshot: FeedSnapshot

    func fetchTopics() async throws -> [CivicTopic] { CivicFixtures.topics }
    func fetchEvents(topic: String?, jurisdiction: String?, limit: Int) async throws -> FeedSnapshot { snapshot }
    func fetchEvent(key: String) async throws -> CivicEvent { CivicFixtures.events[0] }
}

private struct FailingRepository: CivicRepository {
    struct Failure: Error {}
    func fetchTopics() async throws -> [CivicTopic] { throw Failure() }
    func fetchEvents(topic: String?, jurisdiction: String?, limit: Int) async throws -> FeedSnapshot { throw Failure() }
    func fetchEvent(key: String) async throws -> CivicEvent { throw Failure() }
}

private final class MemorySecureStore: SecureValueStoring {
    private var values: [String: String] = [:]
    func value(for key: String) -> String? { values[key] }
    func set(_ value: String, for key: String) { values[key] = value }
}
