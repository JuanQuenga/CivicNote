import SwiftUI

struct ActView: View {
    @ObservedObject var repository: CivicRepositoryStore

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                CivicMasthead(
                    eyebrow: "FROM CONCERN TO LEVERAGE",
                    title: "Show up prepared",
                    subtitle: "Find the decision point, understand the record, and speak in your own voice."
                )
                ActionGuideCard()
                SectionLabel(title: "Open actions", detail: "Scripts are starting points")
                ForEach(repository.filteredEvents.filter { !$0.actions.isEmpty }) { event in
                    NavigationLink(value: CivicRoute.event(event.key)) {
                        HStack(alignment: .top, spacing: 14) {
                            Image(systemName: event.urgency == .urgent ? "megaphone.fill" : "text.bubble.fill")
                                .foregroundStyle(event.urgency.color)
                                .frame(width: 42, height: 42)
                                .background(event.urgency.color.opacity(0.11), in: RoundedRectangle(cornerRadius: 13))
                            VStack(alignment: .leading, spacing: 6) {
                                Text(event.headline).font(.headline).foregroundStyle(CivicStyle.ink)
                                Text(event.primaryAction?.audience ?? event.geographicScope).font(.caption).foregroundStyle(.secondary)
                                if let timing = event.timingLabel {
                                    Label(timing, systemImage: "clock").font(.caption.bold()).foregroundStyle(event.urgency.color)
                                }
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.tertiary)
                        }
                        .padding(16)
                        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 21))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(18)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Act")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ActionGuideCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("A useful three-step loop").font(.title3.bold())
            step(1, "Find the decision", "Who votes, approves, funds, or signs?")
            step(2, "Ask for the record", "Contracts, demand, audits, minutes, and tradeoffs.")
            step(3, "Show up before it hardens", "Comment, organize neighbors, and track the final vote.")
        }
        .padding(18)
        .background(LinearGradient(colors: [CivicStyle.ink, Color(red: 0.16, green: 0.18, blue: 0.22)], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 26))
        .foregroundStyle(.white)
    }

    private func step(_ number: Int, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)").font(.caption.bold()).frame(width: 28, height: 28).background(CivicStyle.red, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold())
                Text(detail).font(.caption).foregroundStyle(.white.opacity(0.70))
            }
        }
    }
}
