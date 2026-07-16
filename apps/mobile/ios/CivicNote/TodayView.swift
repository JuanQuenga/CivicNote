import SwiftUI

struct TodayView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore

    private var events: [CivicEvent] { repository.filteredEvents }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 20) {
                CivicMasthead(
                    eyebrow: "YOUR CIVIC BRIEF",
                    title: "What needs your attention",
                    subtitle: "Verified decisions, local impact, and the next useful action."
                )
                FeedStatusBanner(state: repository.state)

                HStack(spacing: 10) {
                    MetricPill(value: "\(events.count { $0.urgency == .urgent })", label: "Urgent", symbol: "bolt.fill", tint: CivicStyle.red)
                    MetricPill(value: "\(preferences.topicSlugs.count)", label: "Following", symbol: "bookmark.fill", tint: CivicStyle.blue)
                    MetricPill(value: preferences.areaLabel.isEmpty ? "All" : preferences.areaLabel, label: "Home area", symbol: "location.fill", tint: CivicStyle.green)
                }

                if events.isEmpty {
                    CivicEmptyState(
                        title: "Your watchlist is quiet",
                        message: "Follow more topics or broaden your home area.",
                        symbol: "checkmark.circle.fill"
                    )
                } else {
                    SectionLabel(title: "Today’s watch", detail: "Most actionable first")
                    ForEach(events) { event in
                        NavigationLink(value: CivicRoute.event(event.key)) {
                            CivicEventCard(event: event, featured: event.urgency == .urgent)
                        }
                        .buttonStyle(CivicPressStyle())
                        .accessibilityIdentifier("event-\(event.key)")
                    }
                }

                HStack(alignment: .top, spacing: 13) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.title2)
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(CivicStyle.green)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Built for verification, not outrage")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(CivicStyle.ink)
                        Text("Every action card should lead back to evidence and an accountable decision-maker.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineSpacing(2)
                    }
                }
                .padding(16)
                .background(CivicStyle.green.opacity(0.075), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(CivicStyle.green.opacity(0.12), lineWidth: 1)
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 34)
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
}

private struct MetricPill: View {
    let value: String
    let label: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 5) {
                Image(systemName: symbol)
                    .font(.caption2.weight(.bold))
                    .symbolRenderingMode(.hierarchical)
                Text(value)
                    .font(.headline.weight(.bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
            }
            .foregroundStyle(tint)
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, minHeight: 58)
        .padding(.horizontal, 6)
        .background(tint.opacity(0.075), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(tint.opacity(0.10), lineWidth: 1)
        }
    }
}
