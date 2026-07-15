import MapKit
import SwiftUI
import UserNotifications

private enum CivicTab: String, CaseIterable, Identifiable {
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

    var symbol: String {
        switch self {
        case .today: "house"
        case .topics: "book.closed"
        case .act: "checklist"
        case .nearby: "map"
        case .settings: "gearshape"
        }
    }

    var selectedSymbol: String {
        switch self {
        case .today: "house.fill"
        case .topics: "book.closed.fill"
        case .act: "checklist.checked"
        case .nearby: "map.fill"
        case .settings: "gearshape.fill"
        }
    }
}

private enum CivicDestination: Hashable {
    case notifications
    case trust
}

struct CivicNoteAppView: View {
    @ObservedObject private var store: CivicStore
    @State private var selectedTab: CivicTab = .today
    @State private var todayPath = NavigationPath()
    @State private var topicsPath = NavigationPath()
    @State private var actPath = NavigationPath()
    @State private var nearbyPath = NavigationPath()
    @State private var settingsPath = NavigationPath()

    init(store: CivicStore = .shared) {
        self.store = store
    }

    var body: some View {
        UnionTabView(
            selection: $selectedTab,
            tabs: CivicTab.allCases,
            isTabBarHidden: selectedPathIsNotEmpty
        ) {
            ForEach(CivicTab.allCases) { tab in
                tabStack(tab)
                    .unionTab(tab)
            }
        } item: { tab, isSelected in
            CivicTabItem(tab: tab, isSelected: isSelected)
        }
        .tint(CivicStyle.red)
    }

    @ViewBuilder
    private func tabStack(_ tab: CivicTab) -> some View {
        switch tab {
        case .today:
            NavigationStack(path: $todayPath) {
                TodayView(store: store)
                    .withCivicEventDestinations()
            }
        case .topics:
            NavigationStack(path: $topicsPath) {
                TopicsView(store: store)
                    .withCivicEventDestinations()
            }
        case .act:
            NavigationStack(path: $actPath) {
                ActView(store: store)
                    .withCivicEventDestinations()
            }
        case .nearby:
            NavigationStack(path: $nearbyPath) {
                NearYouView(store: store)
                    .withCivicEventDestinations()
            }
        case .settings:
            NavigationStack(path: $settingsPath) {
                SettingsView(store: store) {
                    selectedTab = .topics
                }
                .withCivicEventDestinations()
            }
        }
    }

    private var selectedPathIsNotEmpty: Bool {
        switch selectedTab {
        case .today: !todayPath.isEmpty
        case .topics: !topicsPath.isEmpty
        case .act: !actPath.isEmpty
        case .nearby: !nearbyPath.isEmpty
        case .settings: !settingsPath.isEmpty
        }
    }
}

private struct CivicTabItem: View {
    let tab: CivicTab
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: isSelected ? tab.selectedSymbol : tab.symbol)
                .font(.system(size: 19, weight: isSelected ? .semibold : .medium))
                .symbolRenderingMode(.hierarchical)

            Text(tab.title)
                .font(.system(size: 9, weight: .semibold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .foregroundStyle(isSelected ? CivicStyle.red : Color.secondary)
        .padding(.horizontal, 2)
        .background {
            if isSelected {
                Capsule()
                    .fill(CivicStyle.red.opacity(0.10))
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(tab.title)
    }
}

private struct TodayView: View {
    @ObservedObject var store: CivicStore

    private var urgentCount: Int {
        store.filteredEvents.count { $0.urgency == .urgent }
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                CivicMasthead(
                    eyebrow: "YOUR CIVIC BRIEF",
                    title: "What needs your attention",
                    subtitle: "Verified decisions, local impact, and the next useful action."
                )

                HStack(spacing: 10) {
                    MetricPill(value: "\(urgentCount)", label: "urgent", tint: CivicStyle.red)
                    MetricPill(value: "\(store.followedTopicIDs.count)", label: "followed", tint: CivicStyle.blue)
                    MetricPill(value: "MI", label: "home area", tint: CivicStyle.green)
                }

                if store.filteredEvents.isEmpty {
                    EmptyFeedCard()
                } else {
                    SectionLabel(title: "Today’s watch", detail: "Most actionable first")

                    ForEach(store.filteredEvents) { event in
                        NavigationLink(value: event) {
                            CivicEventCard(event: event, featured: event.urgency == .urgent)
                        }
                        .buttonStyle(.plain)
                    }
                }

                SourcePromiseCard()
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: CivicDestination.notifications) {
                    Image(systemName: "bell.badge")
                        .accessibilityLabel("Notification settings")
                }
            }
        }
    }
}

private struct TopicsView: View {
    @ObservedObject var store: CivicStore

    private let columns = [GridItem(.adaptive(minimum: 154), spacing: 12)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                CivicMasthead(
                    eyebrow: "CHOOSE YOUR WATCHLIST",
                    title: "Follow the issues you care about",
                    subtitle: "Your feed and alerts adapt to these choices. Change them anytime."
                )

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(store.topics) { topic in
                        TopicTile(
                            topic: topic,
                            isFollowing: store.isFollowing(topic.id)
                        ) {
                            withAnimation(.snappy) {
                                store.toggleTopic(topic.id)
                            }
                            UISelectionFeedbackGenerator().selectionChanged()
                        }
                    }
                }

                Text("CivicNote does not infer your politics. You choose what to follow, and every alert should lead back to evidence and an accountable decision-maker.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
    }
}

private struct ActView: View {
    @ObservedObject var store: CivicStore

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                CivicMasthead(
                    eyebrow: "FROM CONCERN TO LEVERAGE",
                    title: "Show up prepared",
                    subtitle: "Find the decision point, understand the harm, and speak in your own voice."
                )

                ActionGuideCard()

                SectionLabel(title: "Open actions", detail: "Scripts are starting points")

                ForEach(store.filteredEvents) { event in
                    NavigationLink(value: event) {
                        ActionEventRow(event: event)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
    }
}

private struct NearYouView: View {
    @ObservedObject var store: CivicStore
    @State private var position: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 42.28, longitude: -83.74),
            span: MKCoordinateSpan(latitudeDelta: 1.55, longitudeDelta: 1.55)
        )
    )

    private var localEvents: [CivicEvent] {
        store.filteredEvents.filter(\.isLocal)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                CivicMasthead(
                    eyebrow: "NEAR YOU",
                    title: "Local decisions are where leverage starts",
                    subtitle: "Hearings, contracts, filings, and votes around Michigan."
                )

                Map(position: $position) {
                    ForEach(NearYouPoint.fixtures) { point in
                        Annotation(point.title, coordinate: point.coordinate) {
                            ZStack {
                                Circle()
                                    .fill(CivicStyle.red)
                                    .frame(width: 34, height: 34)
                                    .shadow(color: .black.opacity(0.18), radius: 7, y: 4)
                                Image(systemName: point.symbol)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                        }
                    }
                }
                .mapStyle(.standard(elevation: .realistic, emphasis: .muted))
                .frame(height: 310)
                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1)
                }

                if localEvents.isEmpty {
                    ContentUnavailableView(
                        "No local items yet",
                        systemImage: "mappin.slash",
                        description: Text("Follow more topics or update your home area in Settings.")
                    )
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 28)
                    .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 24))
                } else {
                    SectionLabel(title: "Michigan watch", detail: "\(localEvents.count) active")

                    ForEach(localEvents) { event in
                        NavigationLink(value: event) {
                            LocalEventRow(event: event)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
    }
}

private struct SettingsView: View {
    @ObservedObject var store: CivicStore
    let showTopics: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                CivicMasthead(
                    eyebrow: "YOUR CIVIC RADAR",
                    title: "Alerts without the noise",
                    subtitle: "Control what reaches you. CivicNote keeps every preference visible."
                )

                NotificationStatusCard(store: store)

                SettingsGroup(title: "Your watchlist") {
                    Button(action: showTopics) {
                        SettingsRow(
                            symbol: "bookmark.fill",
                            tint: CivicStyle.blue,
                            title: "Followed topics",
                            detail: "\(store.followedTopicIDs.count) selected"
                        )
                    }
                    .buttonStyle(.plain)

                    Divider().padding(.leading, 48)

                    SettingsRow(
                        symbol: "mappin.and.ellipse",
                        tint: CivicStyle.green,
                        title: "Home area",
                        detail: store.region.isEmpty ? "Michigan" : store.region
                    )
                }

                SettingsGroup(title: "Trust & transparency") {
                    NavigationLink(value: CivicDestination.trust) {
                        SettingsRow(
                            symbol: "checkmark.shield.fill",
                            tint: CivicStyle.green,
                            title: "How CivicNote verifies updates",
                            detail: "Sources, timestamps, and corrections"
                        )
                    }
                    .buttonStyle(.plain)

                    Divider().padding(.leading, 48)

                    Link(destination: URL(string: "https://civicnote.org")!) {
                        SettingsRow(
                            symbol: "safari.fill",
                            tint: CivicStyle.blue,
                            title: "CivicNote on the web",
                            detail: "Research and methodology"
                        )
                    }
                    .buttonStyle(.plain)
                }

                Text("CivicNote is an independent civic information tool. It is not affiliated with a government agency or political campaign.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .task {
            await store.refreshNotificationStatus()
        }
    }
}

private struct NotificationSettingsView: View {
    @ObservedObject var store: CivicStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                NotificationStatusCard(store: store)

                SettingsGroup(title: "What alerts include") {
                    SettingsRow(symbol: "clock.badge.exclamationmark", tint: CivicStyle.red, title: "Decision timing", detail: "Hearings, filings, votes, and deadlines")
                    Divider().padding(.leading, 48)
                    SettingsRow(symbol: "location.fill", tint: CivicStyle.green, title: "Local relevance", detail: "Your state and home jurisdiction")
                    Divider().padding(.leading, 48)
                    SettingsRow(symbol: "doc.text.magnifyingglass", tint: CivicStyle.blue, title: "Evidence", detail: "Source links and what was verified")
                }
            }
            .padding(18)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Civic alerts")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await store.refreshNotificationStatus()
        }
    }
}

private struct NotificationStatusCard: View {
    @ObservedObject var store: CivicStore
    @Environment(\.openURL) private var openURL
    @State private var isRequesting = false

    private var status: NotificationPresentation {
        NotificationPresentation(status: store.notificationStatus)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(status.tint.opacity(0.13))
                        .frame(width: 48, height: 48)
                    Image(systemName: status.symbol)
                        .font(.system(size: 21, weight: .semibold))
                        .foregroundStyle(status.tint)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(status.title)
                        .font(.headline)
                    Text(status.detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            if let error = store.error, !error.isEmpty {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote)
                    .foregroundStyle(CivicStyle.red)
            }

            Button {
                if store.notificationStatus == .denied {
                    guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
                    openURL(url)
                } else {
                    isRequesting = true
                    Task {
                        await store.requestNotifications()
                        isRequesting = false
                    }
                }
            } label: {
                HStack {
                    if isRequesting {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: store.notificationStatus == .denied ? "gear" : "bell.badge.fill")
                    }
                    Text(status.buttonTitle)
                }
                .font(.system(.body, design: .rounded, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .background(CivicStyle.red.gradient, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
            .disabled(isRequesting || store.notificationStatus == .authorized || store.notificationStatus == .provisional)
            .opacity(store.notificationStatus == .authorized || store.notificationStatus == .provisional ? 0.58 : 1)
        }
        .padding(18)
        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.primary.opacity(0.07), lineWidth: 1)
        }
    }
}

private struct NotificationPresentation {
    let title: String
    let detail: String
    let buttonTitle: String
    let symbol: String
    let tint: Color

    init(status: UNAuthorizationStatus) {
        switch status {
        case .authorized, .provisional, .ephemeral:
            title = "Civic alerts are on"
            detail = "You’ll receive relevant updates for followed topics and your home area."
            buttonTitle = "Alerts enabled"
            symbol = "bell.badge.fill"
            tint = CivicStyle.green
        case .denied:
            title = "Alerts are off"
            detail = "Notification access is disabled for CivicNote. You can change it in iOS Settings."
            buttonTitle = "Open iOS Settings"
            symbol = "bell.slash.fill"
            tint = CivicStyle.red
        case .notDetermined:
            title = "Never miss the decision point"
            detail = "Turn on alerts for hearings, votes, deadlines, and material updates—not every headline."
            buttonTitle = "Turn on civic alerts"
            symbol = "bell.badge.fill"
            tint = CivicStyle.blue
        @unknown default:
            title = "Notification status unavailable"
            detail = "Check iOS Settings to manage CivicNote alerts."
            buttonTitle = "Check again"
            symbol = "bell"
            tint = .secondary
        }
    }
}

private struct CivicEventDetailView: View {
    let event: CivicEvent
    @State private var copied = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    UrgencyBadge(urgency: event.urgency)
                    Text(event.title)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(CivicStyle.ink)
                    Label(event.location, systemImage: "mappin.and.ellipse")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let timing = event.timing {
                        Label(timing, systemImage: "calendar.badge.clock")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(CivicStyle.red)
                    }
                }

                DetailSection(title: "What’s happening") {
                    Text(event.summary)
                }

                DetailSection(title: "Why it matters") {
                    Text(event.whyItMatters)
                }

                DetailSection(title: "Documented risks and harms") {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(event.harms, id: \.self) { harm in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundStyle(CivicStyle.red)
                                    .padding(.top, 2)
                                Text(harm)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("A question you can bring")
                        .font(.title3.bold())
                    Text(event.script)
                        .font(.body)
                        .foregroundStyle(CivicStyle.ink)
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(CivicStyle.red.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))

                    Button {
                        UIPasteboard.general.string = event.script
                        copied = true
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    } label: {
                        Label(copied ? "Copied" : "Copy as a starting point", systemImage: copied ? "checkmark" : "doc.on.doc")
                            .font(.subheadline.bold())
                    }
                    .buttonStyle(.bordered)
                }

                DetailSection(title: "Who decides") {
                    Label(event.decisionMaker, systemImage: "person.2.badge.gearshape")
                }

                if let venue = event.venue {
                    DetailSection(title: "Where") {
                        Label(venue, systemImage: "building.columns.fill")
                    }
                }

                DetailSection(title: "Evidence") {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(event.sources) { source in
                            Link(destination: source.url) {
                                HStack(spacing: 12) {
                                    Image(systemName: "arrow.up.right.square")
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(source.title).font(.subheadline.bold())
                                        Text(source.publisher).font(.caption).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                Text("Use the script as a factual starting point, then put it in your own words. Confirm meeting times and agenda status with the official source before traveling.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(18)
            .padding(.bottom, 76)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: event.actionURL, subject: Text(event.title), message: Text(event.summary)) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            Link(destination: event.actionURL) {
                HStack {
                    Text(event.actionLabel)
                    Spacer()
                    Image(systemName: "arrow.up.right")
                }
                .font(.system(.body, design: .rounded, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 18)
                .frame(height: 54)
                .background(CivicStyle.red.gradient, in: RoundedRectangle(cornerRadius: 17, style: .continuous))
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
        }
    }
}

private extension View {
    func withCivicEventDestinations() -> some View {
        navigationDestination(for: CivicEvent.self) { event in
            CivicEventDetailView(event: event)
        }
        .navigationDestination(for: CivicDestination.self) { destination in
            switch destination {
            case .notifications:
                NotificationSettingsView(store: .shared)
            case .trust:
                TrustView()
            }
        }
    }
}

private struct CivicEventCard: View {
    let event: CivicEvent
    let featured: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                UrgencyBadge(urgency: event.urgency)
                Spacer()
                Text(event.topic.uppercased())
                    .font(.caption2.bold())
                    .tracking(0.7)
                    .foregroundStyle(.secondary)
            }

            Text(event.title)
                .font(.system(size: featured ? 23 : 20, weight: .bold, design: .rounded))
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)

            Text(event.summary)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(featured ? 4 : 3)

            HStack(spacing: 12) {
                Label(event.location, systemImage: "mappin")
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.right")
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(featured ? CivicStyle.red : .secondary)
        }
        .padding(featured ? 20 : 17)
        .background(
            featured ? CivicStyle.card : CivicStyle.card.opacity(0.92),
            in: RoundedRectangle(cornerRadius: featured ? 28 : 23, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: featured ? 28 : 23, style: .continuous)
                .stroke(featured ? CivicStyle.red.opacity(0.24) : Color.primary.opacity(0.06), lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(featured ? 0.07 : 0.035), radius: 16, y: 7)
    }
}

private struct TopicTile: View {
    let topic: CivicTopic
    let isFollowing: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    ZStack {
                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                            .fill(topic.tint.opacity(0.14))
                            .frame(width: 44, height: 44)
                        Image(systemName: topic.symbol)
                            .font(.system(size: 19, weight: .semibold))
                            .foregroundStyle(topic.tint)
                    }
                    Spacer()
                    Image(systemName: isFollowing ? "checkmark.circle.fill" : "plus.circle")
                        .font(.title3)
                        .foregroundStyle(isFollowing ? CivicStyle.red : .secondary)
                }

                Text(topic.title)
                    .font(.system(.headline, design: .rounded, weight: .bold))
                    .foregroundStyle(CivicStyle.ink)
                    .multilineTextAlignment(.leading)

                Text(topic.summary)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(4)
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, minHeight: 178, alignment: .topLeading)
            .padding(16)
            .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(isFollowing ? CivicStyle.red.opacity(0.34) : Color.primary.opacity(0.06), lineWidth: isFollowing ? 1.5 : 1)
            }
        }
        .buttonStyle(ScaleButtonStyle())
        .accessibilityLabel("\(topic.title), \(isFollowing ? "following" : "not followed")")
    }
}

private struct ActionGuideCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("A useful three-step loop")
                .font(.title3.bold())

            ActionStep(number: 1, title: "Find the decision", detail: "Who votes, approves, funds, or signs?")
            ActionStep(number: 2, title: "Ask for the record", detail: "Contracts, peak demand, audits, minutes, and tradeoffs.")
            ActionStep(number: 3, title: "Show up before it hardens", detail: "Comment, organize neighbors, and track the final vote.")
        }
        .padding(18)
        .background(
            LinearGradient(colors: [CivicStyle.ink, Color(red: 0.16, green: 0.18, blue: 0.22)], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 26, style: .continuous)
        )
        .foregroundStyle(.white)
    }
}

private struct ActionStep: View {
    let number: Int
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .frame(width: 28, height: 28)
                .background(CivicStyle.red, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold())
                Text(detail).font(.caption).foregroundStyle(.white.opacity(0.70))
            }
        }
    }
}

private struct ActionEventRow: View {
    let event: CivicEvent

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: event.urgency == .urgent ? "megaphone.fill" : "text.bubble.fill")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(event.urgency.color)
                .frame(width: 42, height: 42)
                .background(event.urgency.color.opacity(0.11), in: RoundedRectangle(cornerRadius: 13))

            VStack(alignment: .leading, spacing: 6) {
                Text(event.title)
                    .font(.headline)
                    .foregroundStyle(CivicStyle.ink)
                Text(event.decisionMaker)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let timing = event.timing {
                    Label(timing, systemImage: "clock")
                        .font(.caption.bold())
                        .foregroundStyle(event.urgency.color)
                }
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.caption.bold())
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding(16)
        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 21, style: .continuous))
    }
}

private struct LocalEventRow: View {
    let event: CivicEvent

    var body: some View {
        HStack(spacing: 14) {
            VStack(spacing: 2) {
                Image(systemName: "building.columns.fill")
                    .font(.title3)
                Text(event.urgency.title.uppercased())
                    .font(.system(size: 8, weight: .black))
            }
            .foregroundStyle(event.urgency.color)
            .frame(width: 54, height: 58)
            .background(event.urgency.color.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))

            VStack(alignment: .leading, spacing: 5) {
                Text(event.title).font(.headline).foregroundStyle(CivicStyle.ink)
                Text(event.location).font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.tertiary)
        }
        .padding(14)
        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 21, style: .continuous))
    }
}

private struct CivicMasthead: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow)
                .font(.system(size: 11, weight: .black, design: .rounded))
                .tracking(1.2)
                .foregroundStyle(CivicStyle.red)
            Text(title)
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct MetricPill: View {
    let value: String
    let label: String
    let tint: Color

    var body: some View {
        VStack(spacing: 1) {
            Text(value).font(.system(.headline, design: .rounded, weight: .bold))
            Text(label).font(.system(size: 9, weight: .semibold)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(tint.opacity(0.09), in: RoundedRectangle(cornerRadius: 15))
    }
}

private struct SectionLabel: View {
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.title3.bold()).foregroundStyle(CivicStyle.ink)
            Spacer()
            Text(detail).font(.caption).foregroundStyle(.secondary)
        }
        .padding(.top, 4)
    }
}

private struct UrgencyBadge: View {
    let urgency: CivicUrgency

    var body: some View {
        Label(urgency.title, systemImage: urgency == .urgent ? "bolt.fill" : "circle.fill")
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(urgency.color)
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(urgency.color.opacity(0.10), in: Capsule())
    }
}

private struct DetailSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.title3.bold()).foregroundStyle(CivicStyle.ink)
            content
                .font(.body)
                .foregroundStyle(CivicStyle.ink.opacity(0.84))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct SettingsGroup<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text(title.uppercased())
                .font(.caption2.bold())
                .tracking(0.8)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
            VStack(spacing: 0) {
                content
            }
            .padding(14)
            .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
    }
}

private struct SettingsRow: View {
    let symbol: String
    let tint: Color
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 36, height: 36)
                .background(tint.opacity(0.11), in: RoundedRectangle(cornerRadius: 11))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold()).foregroundStyle(CivicStyle.ink)
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 4)
            Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.tertiary)
        }
        .padding(.vertical, 3)
    }
}

private struct EmptyFeedCard: View {
    var body: some View {
        ContentUnavailableView(
            "Your watchlist is quiet",
            systemImage: "checkmark.circle",
            description: Text("Follow topics to build a focused civic brief.")
        )
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 24))
    }
}

private struct SourcePromiseCard: View {
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "checkmark.shield.fill")
                .font(.title2)
                .foregroundStyle(CivicStyle.green)
            VStack(alignment: .leading, spacing: 4) {
                Text("Built for verification, not outrage").font(.subheadline.bold())
                Text("Updates distinguish confirmed records, reported claims, and CivicNote analysis. Every action card links to its evidence.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .background(CivicStyle.green.opacity(0.08), in: RoundedRectangle(cornerRadius: 20))
    }
}

private struct TrustView: View {
    var body: some View {
        List {
            TrustRow(symbol: "building.columns.fill", title: "Prefer primary records", detail: "Agendas, filings, contracts, votes, disclosures, and agency data come first.")
            TrustRow(symbol: "clock.badge.checkmark.fill", title: "Show freshness", detail: "Time-sensitive claims should carry a verification time and the official schedule source.")
            TrustRow(symbol: "text.badge.checkmark", title: "Separate fact from analysis", detail: "Reported facts, uncertainty, and CivicNote’s interpretation should remain distinct.")
            TrustRow(symbol: "arrow.triangle.2.circlepath", title: "Correct transparently", detail: "Material corrections should be visible rather than silently overwritten.")
        }
        .navigationTitle("How verification works")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct TrustRow: View {
    let symbol: String
    let title: String
    let detail: String

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(detail).font(.subheadline).foregroundStyle(.secondary)
            }
            .padding(.vertical, 6)
        } icon: {
            Image(systemName: symbol).foregroundStyle(CivicStyle.red)
        }
    }
}

private struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.975 : 1)
            .opacity(configuration.isPressed ? 0.86 : 1)
            .animation(.snappy(duration: 0.2), value: configuration.isPressed)
    }
}

private struct NearYouPoint: Identifiable {
    let id: String
    let title: String
    let coordinate: CLLocationCoordinate2D
    let symbol: String

    static let fixtures: [NearYouPoint] = [
        .init(id: "ypsilanti", title: "Ypsilanti Township", coordinate: .init(latitude: 42.20, longitude: -83.62), symbol: "server.rack"),
        .init(id: "lansing", title: "Michigan Capitol", coordinate: .init(latitude: 42.73, longitude: -84.55), symbol: "building.columns.fill"),
        .init(id: "detroit", title: "Detroit", coordinate: .init(latitude: 42.33, longitude: -83.05), symbol: "camera.viewfinder"),
    ]
}

private enum CivicStyle {
    static let red = Color(red: 0.77, green: 0.08, blue: 0.10)
    static let blue = Color(red: 0.12, green: 0.37, blue: 0.65)
    static let green = Color(red: 0.10, green: 0.43, blue: 0.30)
    static let ink = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.95, green: 0.95, blue: 0.94, alpha: 1)
            : UIColor(red: 0.08, green: 0.09, blue: 0.11, alpha: 1)
    })
    static let paper = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.055, green: 0.06, blue: 0.07, alpha: 1)
            : UIColor(red: 0.97, green: 0.955, blue: 0.925, alpha: 1)
    })
    static let card = Color(uiColor: .secondarySystemBackground)
}

#if DEBUG
#Preview {
    CivicNoteAppView(store: .shared)
}
#endif
