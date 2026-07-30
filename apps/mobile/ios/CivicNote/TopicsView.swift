import SwiftUI
import UIKit

struct TopicsView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(
                    title: "Topics",
                    standfirst: "Following a topic puts its meetings and deadlines in Today and sends its alerts.",
                    status: followedStatus
                )

                if showsAlertsOffNotice {
                    alertsOffNotice
                }

                let rows = signals
                if rows.isEmpty {
                    CivicEmptyState(
                        title: "No topics loaded",
                        message: "The topic list arrives with the feed. Open Today and pull down to load it.",
                        symbol: "books.vertical"
                    )
                } else {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(rows.enumerated()), id: \.element.id) { index, signal in
                            if index > 0 { CivicRule() }
                            TopicRow(
                                signal: signal,
                                areaLabel: preferences.areaLabel,
                                isFollowing: preferences.topicSlugs.contains(signal.topic.id)
                            ) {
                                toggle(signal.topic)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .civicMastheadChrome("Topics")
    }

    // MARK: - Header facts

    private var followedCount: Int {
        repository.topics.filter { preferences.topicSlugs.contains($0.id) }.count
    }

    private var followedStatus: String? {
        guard !repository.topics.isEmpty else { return nil }
        return "\(followedCount) of \(repository.topics.count) followed"
    }

    private var showsAlertsOffNotice: Bool {
        !preferences.notificationsEnabled && followedCount > 0
    }

    /// Following is the conversion moment, so say plainly when it will not
    /// produce an alert, and make the fix one tap away.
    private var alertsOffNotice: some View {
        NavigationLink(value: CivicRoute.notifications) {
            HStack(alignment: .top, spacing: CivicSpace.md) {
                Image(systemName: "bell.slash")
                    .font(CivicType.meta)
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(CivicStyle.amber)
                VStack(alignment: .leading, spacing: CivicSpace.xs) {
                    Text("Alerts are off")
                        .font(CivicType.metaStrong)
                        .foregroundStyle(CivicStyle.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("Followed topics still fill Today. Nothing sends a notification until you turn alerts on.")
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: CivicSpace.sm)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(CivicSpace.lg)
            .civicSurface(.inset, tint: CivicStyle.amber)
            .contentShape(Rectangle())
        }
        .buttonStyle(CivicPressStyle())
        .accessibilityLabel("Alerts are off. Nothing sends a notification until you turn alerts on.")
        .accessibilityIdentifier("topics-alerts-off")
    }

    // MARK: - Signal

    private var signals: [TopicSignal] {
        let now = Date()
        return repository.topics
            .map { topic in
                TopicSignal(topic: topic, events: events(for: topic), now: now)
            }
            .sorted(by: TopicSignal.moreActive)
    }

    private func events(for topic: CivicTopic) -> [CivicEvent] {
        repository.events.filter { event in
            event.topicSlugs.contains(topic.id) && preferences.eventMatchesRegion(event)
        }
    }

    private func toggle(_ topic: CivicTopic) {
        if preferences.topicSlugs.contains(topic.id) {
            preferences.topicSlugs.remove(topic.id)
        } else {
            preferences.topicSlugs.insert(topic.id)
        }
        UISelectionFeedbackGenerator().selectionChanged()
    }
}

// MARK: - What a topic is doing right now

/// The facts that answer "is this worth my attention": how many items are in
/// the feed, when the next dated one lands, and what it is.
private struct TopicSignal: Identifiable {
    let topic: CivicTopic
    let count: Int
    let urgency: CivicUrgency?
    let nextDate: Date?
    let lastUpdate: Date?
    let headline: String?

    var id: String { topic.id }

    init(topic: CivicTopic, events: [CivicEvent], now: Date) {
        self.topic = topic
        count = events.count
        urgency = events.map(\.urgency).min(by: { Self.rank($0) < Self.rank($1) })
        let upcoming = events
            .compactMap { event -> (date: Date, event: CivicEvent)? in
                guard let date = Self.nextDate(for: event, now: now) else { return nil }
                return (date, event)
            }
            .sorted { $0.date < $1.date }
        nextDate = upcoming.first?.date
        lastUpdate = events.map(\.updatedAt).max()
        headline = upcoming.first?.event.headline
            ?? events.max(by: { $0.updatedAt < $1.updatedAt })?.headline
    }

    /// Color only where it means something: red when a clock is running,
    /// amber for an important undated item, no hue otherwise.
    var tint: Color {
        guard let urgency else { return .secondary }
        return CivicStyle.urgencyTint(urgency)
    }

    /// "3 items · next Aug 12", "1 item · updated Jul 15", "No items in Michigan".
    func line(areaLabel: String) -> String {
        guard count > 0 else {
            let place = areaLabel.trimmingCharacters(in: .whitespacesAndNewlines)
            return place.isEmpty ? "No items in the current feed" : "No items in \(place)"
        }
        var parts = ["\(count) item\(count == 1 ? "" : "s")"]
        if let nextDate {
            parts.append("next \(CivicFormat.day(nextDate))")
        } else if let lastUpdate {
            parts.append("updated \(CivicFormat.day(lastUpdate))")
        }
        return parts.joined(separator: " · ")
    }

    /// Most pressing first. The order does not depend on what the reader
    /// follows, so a row never jumps when it is tapped.
    static func moreActive(_ lhs: TopicSignal, _ rhs: TopicSignal) -> Bool {
        let left = rank(lhs.urgency)
        let right = rank(rhs.urgency)
        if left != right { return left < right }
        switch (lhs.nextDate, rhs.nextDate) {
        case let (leftDate?, rightDate?) where leftDate != rightDate:
            return leftDate < rightDate
        case (_?, nil):
            return true
        case (nil, _?):
            return false
        default:
            break
        }
        if lhs.count != rhs.count { return lhs.count > rhs.count }
        return lhs.topic.title.localizedCaseInsensitiveCompare(rhs.topic.title) == .orderedAscending
    }

    private static func rank(_ urgency: CivicUrgency?) -> Int {
        switch urgency {
        case .urgent: return 0
        case .important: return 1
        case .watch: return 2
        case nil: return 3
        }
    }

    private static func nextDate(for event: CivicEvent, now: Date) -> Date? {
        [event.deadlineAt, event.meeting?.publicCommentDeadline, event.meeting?.startsAt, event.startsAt]
            .compactMap { $0 }
            .filter { $0 >= now }
            .min()
    }
}

// MARK: - Row

private struct TopicRow: View {
    let signal: TopicSignal
    let areaLabel: String
    let isFollowing: Bool
    let toggle: () -> Void

    private var detail: String { signal.headline ?? signal.topic.summary }

    var body: some View {
        Button(action: toggle) {
            HStack(alignment: .top, spacing: CivicSpace.md) {
                VStack(alignment: .leading, spacing: CivicSpace.xs) {
                    Text(signal.topic.title)
                        .font(CivicType.lede)
                        .foregroundStyle(CivicStyle.ink)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(signal.line(areaLabel: areaLabel))
                        .font(CivicType.metaStrong)
                        .foregroundStyle(signal.tint)
                        .fixedSize(horizontal: false, vertical: true)
                    if !detail.isEmpty {
                        Text(detail)
                            .font(CivicType.meta)
                            .foregroundStyle(.secondary)
                            .lineSpacing(2)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: CivicSpace.sm)
                FollowMark(isFollowing: isFollowing)
            }
            .padding(.vertical, CivicSpace.md)
            .contentShape(Rectangle())
        }
        .buttonStyle(CivicPressStyle())
        .accessibilityLabel("\(signal.topic.title). \(signal.line(areaLabel: areaLabel)). \(isFollowing ? "Following" : "Not followed")")
        .accessibilityHint(isFollowing ? "Stops alerts for this topic" : "Adds this topic to Today and its alerts")
        .accessibilityIdentifier("topic-\(signal.topic.id)")
    }
}

/// The follow state, stated twice: word and mark. Red carries the untaken
/// action; once the topic is followed the state stops spending color.
private struct FollowMark: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let isFollowing: Bool

    var body: some View {
        HStack(spacing: CivicSpace.xs) {
            Image(systemName: isFollowing ? "checkmark" : "plus")
                .font(.caption.weight(.bold))
            if !dynamicTypeSize.isAccessibilitySize {
                Text(isFollowing ? "Following" : "Follow")
                    .font(CivicType.metaStrong)
                    .lineLimit(1)
            }
        }
        .foregroundStyle(isFollowing ? Color.secondary : CivicStyle.red)
        .padding(.horizontal, CivicSpace.md)
        .padding(.vertical, CivicSpace.sm)
        .frame(minHeight: 44)
        .civicSurface(
            .inset,
            radius: CivicRadius.control,
            tint: isFollowing ? nil : CivicStyle.red
        )
        .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: isFollowing)
        .accessibilityHidden(true)
    }
}
