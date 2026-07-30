import SwiftUI

struct TodayView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore

    /// Set by the empty state when the watchlist filters out everything the
    /// feed returned. View-local: it never writes to `preferences`.
    @State private var ignoresWatchlist = false

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(title: "What needs your attention", status: mastheadStatus)
                CivicFeedStatus(state: repository.state)

                if events.isEmpty {
                    emptyState
                } else {
                    ForEach(leadEvents) { event in
                        NavigationLink(value: CivicRoute.event(event.key)) {
                            CivicEventCard(event: event, topicName: topicName(for: event))
                        }
                        .buttonStyle(CivicPressStyle())
                        .accessibilityIdentifier("event-\(event.key)")
                    }

                    if !remainingEvents.isEmpty {
                        remainingList
                    }
                }

                if ignoresWatchlist {
                    Button("Use my watchlist again") { ignoresWatchlist = false }
                        .font(CivicType.metaStrong)
                        .buttonStyle(.bordered)
                        .tint(CivicStyle.red)
                        .accessibilityIdentifier("restore-watchlist")
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .refreshable { await repository.refresh() }
        .navigationTitle("Today")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: CivicRoute.notifications) {
                    Image(systemName: "bell.badge")
                        .symbolRenderingMode(.hierarchical)
                        .accessibilityLabel("Notification settings")
                }
            }
        }
    }

    // MARK: - Content

    /// The rest of the feed, as rows separated by rules. One card type per
    /// screen; everything below the lead is tier one.
    private var remainingList: some View {
        let items = remainingEvents
        return VStack(alignment: .leading, spacing: 0) {
            SectionLabel(title: "Also tracking", detail: itemCount(items.count))
            ForEach(items.indices, id: \.self) { index in
                if index > 0 { CivicRule() }
                NavigationLink(value: CivicRoute.event(items[index].key)) {
                    CivicEventRow(event: items[index], detail: items[index].primaryAction?.title)
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityIdentifier("event-\(items[index].key)")
            }
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        if hiddenCount > 0 {
            CivicEmptyState(
                title: "Your watchlist hides every item",
                message: "\(itemCount(hiddenCount)) came back from the feed. None of them match \(filterSummary).",
                symbol: "line.3.horizontal.decrease",
                actionTitle: "Show all \(hiddenCount)",
                action: { ignoresWatchlist = true }
            )
        } else {
            CivicEmptyState(
                title: "No events in the feed",
                message: "Reload to fetch the feed again.",
                symbol: "tray",
                tint: feedFailed ? CivicStyle.red : .secondary,
                actionTitle: "Reload",
                action: { Task { await repository.refresh() } }
            )
        }
    }

    // MARK: - Data

    private var events: [CivicEvent] {
        let source = ignoresWatchlist ? repository.events : repository.filteredEvents
        return source.sorted(by: Self.precedes)
    }

    /// Urgent items get the card. With none, the most imminent item still does,
    /// so the first thing under the masthead is always a real event.
    private var leadEvents: [CivicEvent] {
        let urgent = events.filter { $0.urgency == .urgent }
        if urgent.isEmpty { return Array(events.prefix(1)) }
        return Array(urgent.prefix(2))
    }

    private var remainingEvents: [CivicEvent] {
        let leadKeys = Set(leadEvents.map(\.key))
        return events.filter { !leadKeys.contains($0.key) }
    }

    private var hiddenCount: Int {
        max(repository.events.count - repository.filteredEvents.count, 0)
    }

    private var feedFailed: Bool {
        if case .failed = repository.state { return true }
        return false
    }

    /// A count and the nearest real date. Never a restatement of a setting.
    private var mastheadStatus: String? {
        guard !events.isEmpty else { return nil }
        var parts = [itemCount(events.count)]
        if let date = nextDate { parts.append("next \(CivicFormat.day(date))") }
        if ignoresWatchlist { parts.append("watchlist filter off") }
        return parts.joined(separator: " · ")
    }

    private var nextDate: Date? {
        let today = Calendar.current.startOfDay(for: Date())
        return events
            .compactMap(Self.decisionDate(for:))
            .filter { $0 >= today }
            .min()
    }

    private var filterSummary: String {
        let area = preferences.areaLabel.trimmingCharacters(in: .whitespacesAndNewlines)
        let topics = preferences.topicSlugs.count
        let followed = topics == 1 ? "the 1 topic you follow" : "the \(topics) topics you follow"
        switch (area.isEmpty, topics) {
        case (true, 0): return "your current filters"
        case (true, _): return followed
        case (false, 0): return area
        default: return "\(area) and \(followed)"
        }
    }

    private func topicName(for event: CivicEvent) -> String? {
        repository.topics.first { $0.id == event.topicSlug }?.shortTitle
    }

    private func itemCount(_ count: Int) -> String {
        count == 1 ? "1 item" : "\(count) items"
    }

    // MARK: - Ordering

    /// The date the reader can still act before, in the same order
    /// `CivicFormat.when` reads it.
    private static func decisionDate(for event: CivicEvent) -> Date? {
        event.deadlineAt
            ?? event.meeting?.publicCommentDeadline
            ?? event.meeting?.startsAt
            ?? event.startsAt
    }

    private static func urgencyRank(_ urgency: CivicUrgency) -> Int {
        switch urgency {
        case .urgent: return 0
        case .important: return 1
        case .watch: return 2
        }
    }

    /// Urgency first, then the soonest date, then the most recently updated.
    /// Dated items outrank undated ones.
    private static func precedes(_ lhs: CivicEvent, _ rhs: CivicEvent) -> Bool {
        let lhsRank = urgencyRank(lhs.urgency)
        let rhsRank = urgencyRank(rhs.urgency)
        if lhsRank != rhsRank { return lhsRank < rhsRank }
        switch (decisionDate(for: lhs), decisionDate(for: rhs)) {
        case let (left?, right?):
            if left != right { return left < right }
        case (_?, nil):
            return true
        case (nil, _?):
            return false
        case (nil, nil):
            break
        }
        return lhs.updatedAt > rhs.updatedAt
    }
}
