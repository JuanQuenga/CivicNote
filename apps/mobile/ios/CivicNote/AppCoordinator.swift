import Combine
import SwiftUI
import UIKit

enum CivicTab: String, CaseIterable, Identifiable {
    case today
    case topics
    case act
    case nearby
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .today: "Today"
        case .topics: "Topics"
        case .act: "Act"
        case .nearby: "Near You"
        case .settings: "Settings"
        }
    }

    /// The icon says what the tab holds. `house` said "home screen" for a tab
    /// that is a dated brief of what changed, and `book.closed` said "reading"
    /// for a tab that is a watchlist.
    var symbol: String {
        switch self {
        case .today: "newspaper"
        case .topics: "bookmark"
        case .act: "checklist.unchecked"
        case .nearby: "map"
        case .settings: "gearshape"
        }
    }

    var selectedSymbol: String {
        switch self {
        case .today: "newspaper.fill"
        case .topics: "bookmark.fill"
        case .act: "checklist"
        case .nearby: "map.fill"
        case .settings: "gearshape.fill"
        }
    }
}

enum CivicRoute: Hashable {
    case event(String)
    case notifications
    case regionEditor
    case topicRequests
    case trust
}

@MainActor
final class AppCoordinator: ObservableObject {
    @Published var selectedTab: CivicTab = .today
    @Published var todayPath = NavigationPath()
    @Published var topicsPath = NavigationPath()
    @Published var actPath = NavigationPath()
    @Published var nearbyPath = NavigationPath()
    @Published var settingsPath = NavigationPath()
    @Published private(set) var isHydrated = false
    @Published private(set) var pendingDeepLink: CivicDeepLink?

    private let preferences: PreferencesStore

    init(preferences: PreferencesStore, configuration: AppConfiguration = .current) {
        self.preferences = preferences
        if let selected = configuration.selectedTab { selectedTab = selected }
    }

    var shouldShowOnboarding: Bool { isHydrated && !preferences.onboardingComplete }

    var selectedPathIsEmpty: Bool {
        switch selectedTab {
        case .today: todayPath.isEmpty
        case .topics: topicsPath.isEmpty
        case .act: actPath.isEmpty
        case .nearby: nearbyPath.isEmpty
        case .settings: settingsPath.isEmpty
        }
    }

    /// Tapping the tab you are already on returns to the top of that stack.
    func popToRoot(_ tab: CivicTab) {
        switch tab {
        case .today: todayPath = NavigationPath()
        case .topics: topicsPath = NavigationPath()
        case .act: actPath = NavigationPath()
        case .nearby: nearbyPath = NavigationPath()
        case .settings: settingsPath = NavigationPath()
        }
    }

    func finishHydration() {
        isHydrated = true
        flushPendingDeepLinkIfPossible()
    }

    func completeOnboarding() {
        preferences.onboardingComplete = true
        flushPendingDeepLinkIfPossible()
    }

    func handle(_ deepLink: CivicDeepLink) {
        guard isHydrated, preferences.onboardingComplete else {
            pendingDeepLink = deepLink
            return
        }
        open(deepLink)
    }

    func showTopics() {
        selectedTab = .topics
    }

    private func flushPendingDeepLinkIfPossible() {
        guard isHydrated, preferences.onboardingComplete, let pendingDeepLink else { return }
        self.pendingDeepLink = nil
        open(pendingDeepLink)
    }

    private func open(_ deepLink: CivicDeepLink) {
        selectedTab = .today
        todayPath = NavigationPath()
        todayPath.append(CivicRoute.event(deepLink.eventKey))
    }
}

struct AppConfiguration {
    let isUITestMode: Bool
    let usesScreenshotFixtures: Bool
    let forcesOnboarding: Bool
    let selectedTab: CivicTab?

    static var current: AppConfiguration {
        let arguments = ProcessInfo.processInfo.arguments
        let selected: CivicTab?
        if let index = arguments.firstIndex(of: "-selectTab"), arguments.indices.contains(index + 1) {
            let value = arguments[index + 1].lowercased().replacingOccurrences(of: "-", with: "")
            selected = value == "nearyou" ? .nearby : CivicTab(rawValue: value)
        } else {
            selected = nil
        }
        return AppConfiguration(
            isUITestMode: arguments.contains("-uiTestMode"),
            usesScreenshotFixtures: arguments.contains("-screenshotFixtures"),
            forcesOnboarding: arguments.contains("-uiTestOnboarding"),
            selectedTab: selected
        )
    }

    @MainActor
    func apply(to preferences: PreferencesStore) {
        if isUITestMode {
            UIView.setAnimationsEnabled(false)
            preferences.seedForFixtureMode()
            if forcesOnboarding {
                preferences.onboardingComplete = false
            }
        }
    }
}
