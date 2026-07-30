import SwiftUI

struct CivicNoteAppView: View {
    /// Tab order follows how often a reader needs the screen: the dated brief
    /// first, then the actions with deadlines, then the local map. The topic
    /// watchlist is set once and revisited rarely, so it sits after those.
    private static let tabOrder: [CivicTab] = [.today, .act, .nearby, .topics, .settings]

    private let environment: AppEnvironment
    @ObservedObject private var coordinator: AppCoordinator
    @ObservedObject private var preferences: PreferencesStore
    @ObservedObject private var repository: CivicRepositoryStore
    @ObservedObject private var notifications: NotificationService

    init(environment: AppEnvironment) {
        self.environment = environment
        _coordinator = ObservedObject(wrappedValue: environment.coordinator)
        _preferences = ObservedObject(wrappedValue: environment.preferences)
        _repository = ObservedObject(wrappedValue: environment.repositoryStore)
        _notifications = ObservedObject(wrappedValue: environment.notificationService)
    }

    var body: some View {
        Group {
            if !coordinator.isHydrated {
                LaunchLoadingView()
            } else if coordinator.shouldShowOnboarding {
                OnboardingView(
                    preferences: preferences,
                    topics: repository.topics.isEmpty ? CivicFixtures.topics : repository.topics,
                    notifications: notifications,
                    coordinator: coordinator
                )
            } else {
                mainTabs
            }
        }
        .tint(CivicStyle.red)
        .onOpenURL { environment.route(url: $0) }
    }

    private var mainTabs: some View {
        UnionTabView(
            selection: $coordinator.selectedTab,
            tabs: Self.tabOrder,
            isTabBarHidden: !coordinator.selectedPathIsEmpty
        ) {
            NavigationStack(path: $coordinator.todayPath) {
                TodayView(repository: repository, preferences: preferences)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.today)

            NavigationStack(path: $coordinator.actPath) {
                ActView(repository: repository)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.act)

            NavigationStack(path: $coordinator.nearbyPath) {
                NearYouView(repository: repository, preferences: preferences)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.nearby)

            NavigationStack(path: $coordinator.topicsPath) {
                TopicsView(repository: repository, preferences: preferences)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.topics)

            NavigationStack(path: $coordinator.settingsPath) {
                SettingsView(environment: environment)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.settings)
        } item: { tab, isSelected in
            CivicTabItem(tab: tab, isSelected: isSelected)
        }
    }
}

private struct LaunchLoadingView: View {
    var body: some View {
        VStack(spacing: CivicSpace.lg) {
            Text("CivicNote")
                .font(CivicType.display)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            ProgressView()
                .tint(CivicStyle.red)
        }
        .padding(.horizontal, CivicSpace.gutter)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CivicStyle.paper.ignoresSafeArea())
    }
}

private struct CivicTabItem: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let tab: CivicTab
    let isSelected: Bool

    var body: some View {
        VStack(spacing: CivicSpace.xs) {
            Image(systemName: isSelected ? selectedSymbol : symbol)
                .font(TabBarChrome.glyph)
                .symbolRenderingMode(.hierarchical)
            if !dynamicTypeSize.isAccessibilitySize {
                Text(tab.title)
                    .font(TabBarChrome.label)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
        }
        .foregroundStyle(isSelected ? CivicStyle.red : Color.secondary)
        .padding(.horizontal, CivicSpace.xs)
        .padding(.vertical, CivicSpace.xs)
        .background {
            if isSelected {
                Capsule().fill(CivicStyle.red.opacity(0.10))
            }
        }
        .animation(reduceMotion ? nil : .snappy(duration: 0.22), value: isSelected)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(tab.title)
        .accessibilityIdentifier("tab-\(tab.rawValue)")
    }

    /// The icon pairing lives next to the label it sits under. `house` said
    /// "home screen" for a tab that is a dated brief of what changed;
    /// `book.closed` said "reading" for a tab that is a watchlist.
    private var symbol: String {
        switch tab {
        case .today: "newspaper"
        case .act: "checklist.unchecked"
        case .nearby: "map"
        case .topics: "bookmark"
        case .settings: "gearshape"
        }
    }

    private var selectedSymbol: String {
        switch tab {
        case .today: "newspaper.fill"
        case .act: "checklist"
        case .nearby: "map.fill"
        case .topics: "bookmark.fill"
        case .settings: "gearshape.fill"
        }
    }
}

extension View {
    func withCivicDestinations(environment: AppEnvironment) -> some View {
        navigationDestination(for: CivicRoute.self) { route in
            switch route {
            case .event(let key):
                EventDetailView(eventKey: key, repository: environment.repositoryStore)
            case .notifications:
                NotificationSettingsView(service: environment.notificationService, preferences: environment.preferences)
            case .regionEditor:
                RegionEditorView(preferences: environment.preferences)
            case .trust:
                TrustView()
            }
        }
    }
}

#if DEBUG
#Preview {
    CivicNoteAppView(environment: .shared)
}
#endif
