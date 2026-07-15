import SwiftUI

struct TodayView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore

    private var events: [CivicEvent] { repository.filteredEvents }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                CivicMasthead(
                    eyebrow: "YOUR CIVIC BRIEF",
                    title: "What needs your attention",
                    subtitle: "Verified decisions, local impact, and the next useful action."
                )
                FeedStatusBanner(state: repository.state)

                HStack(spacing: 10) {
                    MetricPill(value: "\(events.count { $0.urgency == .urgent })", label: "urgent", tint: CivicStyle.red)
                    MetricPill(value: "\(preferences.topicSlugs.count)", label: "followed", tint: CivicStyle.blue)
                    MetricPill(value: preferences.areaLabel.isEmpty ? "All" : preferences.areaLabel, label: "home area", tint: CivicStyle.green)
                }

                if events.isEmpty {
                    ContentUnavailableView("Your watchlist is quiet", systemImage: "checkmark.circle", description: Text("Follow more topics or broaden your home area."))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 28)
                        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 24))
                } else {
                    SectionLabel(title: "Today’s watch", detail: "Most actionable first")
                    ForEach(events) { event in
                        NavigationLink(value: CivicRoute.event(event.key)) {
                            CivicEventCard(event: event, featured: event.urgency == .urgent)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("event-\(event.key)")
                    }
                }

                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "checkmark.shield.fill").font(.title2).foregroundStyle(CivicStyle.green)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Built for verification, not outrage").font(.subheadline.bold())
                        Text("Every action card should lead back to evidence and an accountable decision-maker.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(16)
                .background(CivicStyle.green.opacity(0.08), in: RoundedRectangle(cornerRadius: 20))
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .refreshable { await repository.refresh() }
        .navigationTitle("Today")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: CivicRoute.notifications) {
                    Image(systemName: "bell.badge").accessibilityLabel("Notification settings")
                }
            }
        }
    }
}

private struct MetricPill: View {
    let value: String
    let label: String
    let tint: Color

    var body: some View {
        VStack(spacing: 1) {
            Text(value).font(.headline.bold()).lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.caption2.weight(.semibold)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(tint.opacity(0.09), in: RoundedRectangle(cornerRadius: 15))
    }
}
