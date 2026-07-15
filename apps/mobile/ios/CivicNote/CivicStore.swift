import Combine
import Foundation
import UIKit
import UserNotifications

enum AlertCadence: String, CaseIterable, Identifiable {
    case urgent
    case daily
    case weekly

    var id: Self { self }

    var title: String {
        switch self {
        case .urgent: "Urgent only"
        case .daily: "Daily brief"
        case .weekly: "Weekly brief"
        }
    }
}

final class CivicStore: ObservableObject {
    static let shared = CivicStore()

    @Published private(set) var topics: [CivicTopic]
    @Published private(set) var events: [CivicEvent]
    @Published var followedTopicIDs: Set<String> {
        didSet { persistFollowedTopics() }
    }
    @Published var region: String {
        didSet { defaults.set(region, forKey: Keys.region) }
    }
    @Published var cadence: AlertCadence {
        didSet { defaults.set(cadence.rawValue, forKey: Keys.cadence) }
    }
    @Published var onboardingComplete: Bool {
        didSet { defaults.set(onboardingComplete, forKey: Keys.onboardingComplete) }
    }

    @Published private(set) var notificationStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var pushToken: String?
    @Published private(set) var error: String?

    private let defaults: UserDefaults
    private let notificationCenter: UNUserNotificationCenter

    init(
        defaults: UserDefaults = .standard,
        notificationCenter: UNUserNotificationCenter = .current(),
        topics: [CivicTopic] = CivicFixtures.topics,
        events: [CivicEvent] = CivicFixtures.events
    ) {
        self.defaults = defaults
        self.notificationCenter = notificationCenter
        self.topics = topics
        self.events = events

        let validTopicIDs = Set(topics.map(\.id))
        let savedTopicIDs = defaults.stringArray(forKey: Keys.followedTopicIDs) ?? []
        followedTopicIDs = Set(savedTopicIDs).intersection(validTopicIDs)
        region = defaults.string(forKey: Keys.region) ?? ""
        cadence = defaults
            .string(forKey: Keys.cadence)
            .flatMap(AlertCadence.init(rawValue:)) ?? .urgent
        onboardingComplete = defaults.bool(forKey: Keys.onboardingComplete)
    }

    var followedTopics: [CivicTopic] {
        topics.filter { followedTopicIDs.contains($0.id) }
    }

    var filteredEvents: [CivicEvent] {
        events.filter { event in
            let matchesTopic = followedTopicIDs.isEmpty || followedTopicIDs.contains(event.topicSlug)
            return matchesTopic && matchesRegion(event)
        }
    }

    var notificationsEnabled: Bool {
        switch notificationStatus {
        case .authorized, .provisional, .ephemeral:
            true
        case .notDetermined, .denied:
            false
        @unknown default:
            false
        }
    }

    func isFollowing(_ topicID: String) -> Bool {
        followedTopicIDs.contains(topicID)
    }

    func toggleTopic(_ topicID: String) {
        guard topics.contains(where: { $0.id == topicID }) else { return }
        if followedTopicIDs.contains(topicID) {
            followedTopicIDs.remove(topicID)
        } else {
            followedTopicIDs.insert(topicID)
        }
    }

    @discardableResult
    func requestNotifications() async -> Bool {
        do {
            let granted = try await notificationCenter.requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            await refreshNotificationStatus()
            return granted
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
            }
            return false
        }
    }

    func refreshNotificationStatus() async {
        let settings = await notificationCenter.notificationSettings()
        await MainActor.run {
            notificationStatus = settings.authorizationStatus
            if notificationsEnabled {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func setPushToken(_ token: String) {
        updateOnMain {
            self.pushToken = token
            self.error = nil
        }
    }

    func setPushRegistrationError(_ message: String) {
        updateOnMain {
            self.pushToken = nil
            self.error = message
        }
    }

    func clearError() {
        updateOnMain { self.error = nil }
    }

    private func matchesRegion(_ event: CivicEvent) -> Bool {
        let selectedRegion = region.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !selectedRegion.isEmpty else { return true }
        if selectedRegion.caseInsensitiveCompare("all") == .orderedSame ||
            selectedRegion.caseInsensitiveCompare("nationwide") == .orderedSame {
            return true
        }

        let isNational = event.location.localizedCaseInsensitiveContains("United States")
        return isNational ||
            event.location.localizedCaseInsensitiveContains(selectedRegion) ||
            event.jurisdiction.localizedCaseInsensitiveContains(selectedRegion)
    }

    private func persistFollowedTopics() {
        defaults.set(followedTopicIDs.sorted(), forKey: Keys.followedTopicIDs)
    }

    private func updateOnMain(_ update: @escaping () -> Void) {
        if Thread.isMainThread {
            update()
        } else {
            DispatchQueue.main.async(execute: update)
        }
    }

    private enum Keys {
        static let followedTopicIDs = "civicnote.native.followed-topic-ids"
        static let region = "civicnote.native.region"
        static let cadence = "civicnote.native.cadence"
        static let onboardingComplete = "civicnote.native.onboarding-complete"
    }
}
