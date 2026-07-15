import SwiftUI

struct CivicNoteAppView: View {
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
                ProgressView("Preparing your civic brief")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(CivicStyle.paper.ignoresSafeArea())
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
            tabs: CivicTab.allCases,
            isTabBarHidden: !coordinator.selectedPathIsEmpty
        ) {
            NavigationStack(path: $coordinator.todayPath) {
                TodayView(repository: repository, preferences: preferences)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.today)

            NavigationStack(path: $coordinator.topicsPath) {
                TopicsView(repository: repository, preferences: preferences)
                    .withCivicDestinations(environment: environment)
            }
            .unionTab(CivicTab.topics)

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

private struct CivicTabItem: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let tab: CivicTab
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: isSelected ? tab.selectedSymbol : tab.symbol)
                .font(.system(size: 19, weight: isSelected ? .semibold : .medium))
                .symbolRenderingMode(.hierarchical)
            if !dynamicTypeSize.isAccessibilitySize {
                Text(tab.title)
                    .font(.caption2.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
        }
        .foregroundStyle(isSelected ? CivicStyle.red : Color.secondary)
        .padding(.horizontal, 2)
        .background {
            if isSelected { Capsule().fill(CivicStyle.red.opacity(0.10)) }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(tab.title)
        .accessibilityIdentifier("tab-\(tab.rawValue)")
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
