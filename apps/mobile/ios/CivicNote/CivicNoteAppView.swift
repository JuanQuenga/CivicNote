import SwiftUI
import UnionTabView

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

    /// `UnionTabView`'s glass bar is an iOS 26 path; below that the package
    /// draws a bar that takes no touches, so those releases get the system tab
    /// bar instead. Both branches host the same stacks and the same tags.
    @ViewBuilder
    private var mainTabs: some View {
        if #available(iOS 26, *) {
            UnionTabView(
                selection: $coordinator.selectedTab,
                tabs: Self.tabOrder,
                glassTint: CivicStyle.red.opacity(0.06),
                onReselect: { coordinator.popToRoot($0) }
            ) {
                tabContent
            } item: { tab, isSelected in
                CivicTabItem(tab: tab, isSelected: isSelected)
            }
        } else {
            TabView(selection: $coordinator.selectedTab) {
                tabContent
            }
        }
    }

    /// One definition of the five stacks, shared by both bars. `civicTab`
    /// carries the selection tag and the system-bar label together, so the
    /// legacy branch needs no second copy of this list.
    @ViewBuilder
    private var tabContent: some View {
        NavigationStack(path: $coordinator.todayPath) {
            TodayView(repository: repository, preferences: preferences)
                .withCivicDestinations(environment: environment)
        }
        .civicTab(.today)

        NavigationStack(path: $coordinator.actPath) {
            ActView(repository: repository)
                .withCivicDestinations(environment: environment)
        }
        .civicTab(.act)

        NavigationStack(path: $coordinator.nearbyPath) {
            NearYouView(repository: repository, preferences: preferences)
                .withCivicDestinations(environment: environment)
        }
        .civicTab(.nearby)

        NavigationStack(path: $coordinator.topicsPath) {
            TopicsView(repository: repository, preferences: preferences)
                .withCivicDestinations(environment: environment)
        }
        .civicTab(.topics)

        NavigationStack(path: $coordinator.settingsPath) {
            SettingsView(environment: environment)
                .withCivicDestinations(environment: environment)
        }
        .civicTab(.settings)
    }
}

private extension View {
    /// Tags a stack with its tab and gives the system bar something to draw.
    /// On iOS 26 `unionTab` hides that bar, so the label is inert there.
    func civicTab(_ tab: CivicTab) -> some View {
        unionTab(tab)
            .tabItem { Label(tab.title, systemImage: tab.symbol) }
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
            Image(systemName: isSelected ? tab.selectedSymbol : tab.symbol)
                .font(.system(size: 17, weight: .semibold))
                .symbolRenderingMode(.hierarchical)
            if !dynamicTypeSize.isAccessibilitySize {
                Text(tab.title)
                    .font(.system(size: 10, weight: .semibold))
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
