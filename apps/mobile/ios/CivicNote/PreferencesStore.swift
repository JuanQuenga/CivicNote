import Combine
import Foundation
import Security

enum CivicPosition: String, CaseIterable, Codable, Identifiable {
    case monitor
    case support
    case oppose

    var id: Self { self }

    var title: String {
        switch self {
        case .monitor: "Monitor"
        case .support: "Support"
        case .oppose: "Oppose"
        }
    }
}

enum AlertCadence: String, CaseIterable, Codable, Identifiable {
    case instant
    case daily
    case weekly

    var id: Self { self }

    var title: String {
        switch self {
        case .instant: "Instant"
        case .daily: "Daily brief"
        case .weekly: "Weekly brief"
        }
    }
}

protocol InstallationIDProviding {
    func installationID() -> String
}

protocol SecureValueStoring {
    func value(for key: String) -> String?
    func set(_ value: String, for key: String)
}

struct KeychainStore: SecureValueStoring {
    private let service = "org.civicnote.mobile"

    func value(for key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func set(_ value: String, for key: String) {
        let identity: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        let attributes: [String: Any] = [kSecValueData as String: Data(value.utf8)]
        if SecItemUpdate(identity as CFDictionary, attributes as CFDictionary) == errSecItemNotFound {
            var addition = identity
            addition[kSecValueData as String] = Data(value.utf8)
            SecItemAdd(addition as CFDictionary, nil)
        }
    }
}

struct InstallationIDStore: InstallationIDProviding {
    private let secureStore: SecureValueStoring
    private let key = "installation-id"

    init(secureStore: SecureValueStoring = KeychainStore()) {
        self.secureStore = secureStore
    }

    func installationID() -> String {
        if let existing = secureStore.value(for: key), UUID(uuidString: existing) != nil {
            return existing
        }
        let created = UUID().uuidString.lowercased()
        secureStore.set(created, for: key)
        return created
    }
}

@MainActor
final class PreferencesStore: ObservableObject {
    @Published var topicSlugs: Set<String> { didSet { persist() } }
    @Published var regionCode: String { didSet { persist() } }
    @Published var areaLabel: String { didSet { persist() } }
    @Published var position: CivicPosition { didSet { persist() } }
    @Published var cadence: AlertCadence { didSet { persist() } }
    @Published var notificationsEnabled: Bool { didSet { persist() } }
    @Published var onboardingComplete: Bool { didSet { persist() } }

    let installationID: String

    private let defaults: UserDefaults
    private var isHydrating = true

    init(
        defaults: UserDefaults = .standard,
        installationIDs: InstallationIDProviding = InstallationIDStore()
    ) {
        self.defaults = defaults
        installationID = installationIDs.installationID()
        Self.migrateIfNeeded(defaults)
        topicSlugs = Set(defaults.stringArray(forKey: Keys.topicSlugs) ?? [])
        regionCode = defaults.string(forKey: Keys.regionCode) ?? ""
        areaLabel = defaults.string(forKey: Keys.areaLabel) ?? ""
        position = defaults.string(forKey: Keys.position).flatMap(CivicPosition.init(rawValue:)) ?? .monitor
        cadence = defaults.string(forKey: Keys.cadence).flatMap(AlertCadence.init(rawValue:)) ?? .instant
        notificationsEnabled = defaults.object(forKey: Keys.notificationsEnabled) as? Bool ?? false
        onboardingComplete = defaults.bool(forKey: Keys.onboardingComplete)
        isHydrating = false
    }

    func seedForFixtureMode() {
        topicSlugs = ["michigan-data-centers", "michigan-surveillance-stack"]
        regionCode = "US-MI"
        areaLabel = "Michigan"
        position = .monitor
        cadence = .instant
        onboardingComplete = true
    }

    func reset() {
        topicSlugs = []
        regionCode = ""
        areaLabel = ""
        position = .monitor
        cadence = .instant
        notificationsEnabled = false
        onboardingComplete = false
    }

    func eventMatchesRegion(_ event: CivicEvent) -> Bool {
        Self.event(event, matchesRegionCode: regionCode)
    }

    nonisolated static func event(_ event: CivicEvent, matchesRegionCode selectedCode: String) -> Bool {
        let code = selectedCode.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !code.isEmpty else { return true }
        let normalized = code.uppercased()
        return event.jurisdictionKeys.contains { key in
            let candidate = key.uppercased()
            return candidate == normalized || candidate.hasPrefix(normalized + "-")
        } || event.geographicScope.localizedCaseInsensitiveContains("United States")
    }

    private func persist() {
        guard !isHydrating else { return }
        defaults.set(topicSlugs.sorted(), forKey: Keys.topicSlugs)
        defaults.set(regionCode, forKey: Keys.regionCode)
        defaults.set(areaLabel, forKey: Keys.areaLabel)
        defaults.set(position.rawValue, forKey: Keys.position)
        defaults.set(cadence.rawValue, forKey: Keys.cadence)
        defaults.set(notificationsEnabled, forKey: Keys.notificationsEnabled)
        defaults.set(onboardingComplete, forKey: Keys.onboardingComplete)
    }

    private static func migrateIfNeeded(_ defaults: UserDefaults) {
        guard !defaults.bool(forKey: Keys.didMigrate) else { return }
        if defaults.stringArray(forKey: Keys.topicSlugs) == nil,
           let oldTopics = defaults.stringArray(forKey: LegacyKeys.followedTopicIDs) {
            defaults.set(oldTopics, forKey: Keys.topicSlugs)
        }
        if defaults.string(forKey: Keys.areaLabel) == nil,
           let oldRegion = defaults.string(forKey: LegacyKeys.region), !oldRegion.isEmpty {
            defaults.set(oldRegion, forKey: Keys.areaLabel)
            if oldRegion.localizedCaseInsensitiveContains("michigan") || oldRegion.caseInsensitiveCompare("MI") == .orderedSame {
                defaults.set("US-MI", forKey: Keys.regionCode)
            }
        }
        if defaults.string(forKey: Keys.cadence) == nil,
           let oldCadence = defaults.string(forKey: LegacyKeys.cadence) {
            defaults.set(oldCadence == "urgent" ? AlertCadence.instant.rawValue : oldCadence, forKey: Keys.cadence)
        }
        if defaults.object(forKey: Keys.onboardingComplete) == nil,
           defaults.object(forKey: LegacyKeys.onboardingComplete) != nil {
            defaults.set(defaults.bool(forKey: LegacyKeys.onboardingComplete), forKey: Keys.onboardingComplete)
        }
        defaults.set(true, forKey: Keys.didMigrate)
    }

    private enum Keys {
        static let topicSlugs = "civicnote.preferences.topic-slugs"
        static let regionCode = "civicnote.preferences.region-code"
        static let areaLabel = "civicnote.preferences.area-label"
        static let position = "civicnote.preferences.position"
        static let cadence = "civicnote.preferences.cadence"
        static let notificationsEnabled = "civicnote.preferences.notifications-enabled"
        static let onboardingComplete = "civicnote.preferences.onboarding-complete"
        static let didMigrate = "civicnote.preferences.did-migrate-v1"
    }

    private enum LegacyKeys {
        static let followedTopicIDs = "civicnote.native.followed-topic-ids"
        static let region = "civicnote.native.region"
        static let cadence = "civicnote.native.cadence"
        static let onboardingComplete = "civicnote.native.onboarding-complete"
    }
}
