import SwiftUI

struct ActView: View {
    @ObservedObject var repository: CivicRepositoryStore

    private var actionableEvents: [CivicEvent] {
        repository.filteredEvents
            .filter { !$0.actions.isEmpty }
            .sorted(by: Self.soonestFirst)
    }

    private var nextDeadline: Date? {
        let now = Date()
        return actionableEvents
            .compactMap(Self.actionDate)
            .filter { $0 >= now }
            .min()
    }

    /// A date, or nothing. The masthead status never carries a slogan.
    private var status: String? {
        guard let nextDeadline else { return nil }
        guard let countdown = CivicFormat.countdown(to: nextDeadline) else {
            return "Next deadline \(CivicFormat.day(nextDeadline))"
        }
        return "Next deadline \(CivicFormat.day(nextDeadline)) · \(countdown)"
    }

    private var countLabel: String {
        actionableEvents.count == 1 ? "1 item" : "\(actionableEvents.count) items"
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(
                    title: "Act",
                    standfirst: actionableEvents.isEmpty ? nil : "Sorted by the closest deadline.",
                    status: status
                )

                CivicFeedStatus(state: repository.state)

                if actionableEvents.isEmpty {
                    CivicEmptyState(
                        title: "No open actions",
                        message: "Follow a topic under Topics. An action lands here once an event names the body that decides and a date to reach it by.",
                        symbol: "checklist"
                    )
                } else {
                    VStack(alignment: .leading, spacing: 0) {
                        SectionLabel(title: "Open actions", detail: countLabel)
                        ForEach(actionableEvents) { event in
                            ActionItem(event: event)
                        }
                    }
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .civicMastheadChrome("Act")
    }

    /// The date this item stops being actionable: the action's own deadline
    /// first, then the event's, then the meeting.
    private static func actionDate(_ event: CivicEvent) -> Date? {
        event.primaryAction?.deadlineAt
            ?? event.deadlineAt
            ?? event.meeting?.publicCommentDeadline
            ?? event.meeting?.startsAt
            ?? event.startsAt
    }

    private static func soonestFirst(_ lhs: CivicEvent, _ rhs: CivicEvent) -> Bool {
        switch (actionDate(lhs), actionDate(rhs)) {
        case let (left?, right?): return left < right
        case (_?, nil): return true
        case (nil, _?): return false
        case (nil, nil): return lhs.updatedAt > rhs.updatedAt
        }
    }
}

/// One open action: who decides, by when, and the one thing to do about it.
/// The row is the primary tap; the external link is the second.
private struct ActionItem: View {
    let event: CivicEvent

    private var action: CivicAction? { event.primaryAction }

    /// The mechanism, with the action's own deadline when it has one the
    /// event dateline does not already carry.
    private var rowDetail: String? {
        guard let action else { return nil }
        guard let deadline = action.deadlineAt else { return action.title }
        guard let countdown = CivicFormat.countdown(to: deadline) else {
            return "\(action.title) by \(CivicFormat.day(deadline))"
        }
        return "\(action.title) by \(CivicFormat.day(deadline)) · \(countdown)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            NavigationLink(value: CivicRoute.event(event.key)) {
                CivicEventRow(event: event, detail: rowDetail)
            }
            .buttonStyle(CivicPressStyle())

            if let action, let url = action.ctaURL {
                Link(destination: url) {
                    HStack(spacing: CivicSpace.xs) {
                        Text(action.ctaLabel)
                            .font(CivicType.metaStrong)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Image(systemName: "arrow.up.right")
                            .font(.caption2.weight(.bold))
                        Spacer(minLength: CivicSpace.sm)
                    }
                    .foregroundStyle(CivicStyle.red)
                    .frame(minHeight: 44, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityIdentifier("action-cta-\(event.key)")
            }

            CivicRule()
        }
    }
}
