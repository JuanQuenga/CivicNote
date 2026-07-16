import SwiftUI

struct ActView: View {
    @ObservedObject var repository: CivicRepositoryStore

    private var actionableEvents: [CivicEvent] {
        repository.filteredEvents.filter { !$0.actions.isEmpty }
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 20) {
                CivicMasthead(
                    eyebrow: "FROM CONCERN TO LEVERAGE",
                    title: "Show up prepared",
                    subtitle: "Find the decision point, understand the record, and speak in your own voice."
                )
                ActionGuideCard()
                SectionLabel(title: "Open actions", detail: "Scripts are starting points")
                if actionableEvents.isEmpty {
                    CivicEmptyState(
                        title: "No open actions",
                        message: "We’ll surface the next useful decision point here.",
                        symbol: "checklist.checked",
                        tint: CivicStyle.blue
                    )
                } else {
                    ForEach(actionableEvents) { event in
                        NavigationLink(value: CivicRoute.event(event.key)) {
                            HStack(alignment: .top, spacing: 14) {
                                Image(systemName: event.urgency == .urgent ? "megaphone.fill" : "text.bubble.fill")
                                    .font(.body.weight(.semibold))
                                    .symbolRenderingMode(.hierarchical)
                                    .foregroundStyle(event.urgency.color)
                                    .frame(width: 44, height: 44)
                                    .background(event.urgency.color.opacity(0.11), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(event.headline)
                                        .font(.headline)
                                        .foregroundStyle(CivicStyle.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Text(event.primaryAction?.audience ?? event.geographicScope)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    if let timing = event.timingLabel {
                                        Label(timing, systemImage: "clock.fill")
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(event.urgency.color)
                                    }
                                }
                                Spacer(minLength: 4)
                                Image(systemName: "chevron.right")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.tertiary)
                            }
                            .padding(16)
                            .civicCard(radius: 21)
                        }
                        .buttonStyle(CivicPressStyle())
                    }
                }
            }
            .padding(18)
            .padding(.bottom, 34)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Act")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
    }
}

private struct ActionGuideCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                Image(systemName: "point.3.connected.trianglepath.dotted")
                    .font(.title3.weight(.semibold))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(Color.white.opacity(0.92))
                Text("A useful three-step loop")
                    .font(.title3.weight(.bold))
            }
            step(1, "Find the decision", "Who votes, approves, funds, or signs?", "scope")
            step(2, "Ask for the record", "Contracts, demand, audits, minutes, and tradeoffs.", "doc.text.magnifyingglass")
            step(3, "Show up before it hardens", "Comment, organize neighbors, and track the final vote.", "person.2.wave.2.fill")
        }
        .padding(19)
        .background(
            LinearGradient(
                colors: [Color(red: 0.075, green: 0.09, blue: 0.13), Color(red: 0.13, green: 0.16, blue: 0.22)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 26, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.white.opacity(0.09), lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(0.14), radius: 18, y: 8)
        .foregroundStyle(.white)
    }

    private func step(_ number: Int, _ title: String, _ detail: String, _ symbol: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle().fill(CivicStyle.red.gradient)
                Text("\(number)")
                    .font(.caption.weight(.bold))
            }
            .frame(width: 30, height: 30)
            VStack(alignment: .leading, spacing: 3) {
                Label(title, systemImage: symbol)
                    .font(.subheadline.weight(.semibold))
                    .symbolRenderingMode(.hierarchical)
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.70))
                    .lineSpacing(1)
            }
        }
    }
}
