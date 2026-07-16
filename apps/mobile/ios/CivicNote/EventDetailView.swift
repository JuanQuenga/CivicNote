import SwiftUI
import UIKit

struct EventDetailView: View {
    let eventKey: String
    @ObservedObject var repository: CivicRepositoryStore
    @State private var event: CivicEvent?
    @State private var errorMessage: String?
    @State private var copied = false

    var body: some View {
        Group {
            if let event {
                detail(event)
            } else if let errorMessage {
                CivicEmptyState(
                    title: "Event unavailable",
                    message: errorMessage,
                    symbol: "exclamationmark.triangle.fill",
                    tint: CivicStyle.red
                )
                .padding(18)
            } else {
                ProgressView("Loading event")
                    .controlSize(.large)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
        .task(id: eventKey) { await load() }
    }

    private func detail(_ event: CivicEvent) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 26) {
                hero(event)

                DetailSection(title: "What’s happening") {
                    Text(event.summary)
                }
                DetailSection(title: "Why it matters") {
                    Text(event.whyItMatters)
                }

                if !event.evidence.isEmpty {
                    DetailSection(title: "Evidence") {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(event.evidence) { evidence in
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: "checkmark.seal.fill")
                                        .font(.title3)
                                        .symbolRenderingMode(.hierarchical)
                                        .foregroundStyle(CivicStyle.green)
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text(evidence.claim)
                                            .font(.body.weight(.semibold))
                                        Text(evidence.context)
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                        Text("\(evidence.classification) · \(evidence.evidenceStrength)")
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(CivicStyle.green)
                                    }
                                }
                                .padding(15)
                                .civicCard(radius: 18)
                            }
                        }
                    }
                }

                ForEach(event.actions) { action in
                    DetailSection(title: action.title) {
                        VStack(alignment: .leading, spacing: 13) {
                            Text(action.description)
                            if let script = action.script, !script.isEmpty {
                                VStack(alignment: .leading, spacing: 9) {
                                    Label("STARTING POINT", systemImage: "quote.opening")
                                        .font(.caption2.weight(.black))
                                        .tracking(0.8)
                                        .foregroundStyle(CivicStyle.red)
                                    Text(script)
                                        .font(.subheadline)
                                        .foregroundStyle(CivicStyle.ink.opacity(0.88))
                                        .lineSpacing(3)
                                }
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(CivicStyle.red.opacity(0.065), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                                        .stroke(CivicStyle.red.opacity(0.12), lineWidth: 1)
                                }
                                Button {
                                    UIPasteboard.general.string = script
                                    copied = true
                                } label: {
                                    Label(copied ? "Copied to clipboard" : "Copy as a starting point", systemImage: copied ? "checkmark.circle.fill" : "doc.on.doc")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.bordered)
                                .controlSize(.large)
                            }
                            if let url = action.ctaURL {
                                Link(destination: url) {
                                    Label(action.ctaLabel, systemImage: "arrow.up.right")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)
                                .controlSize(.large)
                            }
                        }
                    }
                }

                if let meeting = event.meeting {
                    DetailSection(title: "Meeting") {
                        VStack(alignment: .leading, spacing: 10) {
                            Label(meeting.title, systemImage: "building.columns.fill")
                                .font(.body.weight(.semibold))
                            Label(meeting.bodyName, systemImage: "person.3.fill")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            if let address = meeting.address {
                                Label(address, systemImage: "mappin.and.ellipse")
                            }
                            if let agendaURL = meeting.agendaURL {
                                Link(destination: agendaURL) {
                                    Label("Open official agenda", systemImage: "doc.text.fill")
                                }
                                .font(.subheadline.weight(.semibold))
                            }
                        }
                        .padding(16)
                        .civicCard(radius: 18)
                    }
                }

                if !event.sources.isEmpty {
                    DetailSection(title: "Sources") {
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(event.sources) { source in
                                Link(destination: source.url) {
                                    HStack(spacing: 12) {
                                        Image(systemName: "doc.text.magnifyingglass")
                                            .font(.body.weight(.semibold))
                                            .symbolRenderingMode(.hierarchical)
                                            .foregroundStyle(CivicStyle.blue)
                                            .frame(width: 38, height: 38)
                                            .background(CivicStyle.blue.opacity(0.10), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(source.title)
                                                .font(.subheadline.weight(.semibold))
                                                .foregroundStyle(CivicStyle.ink)
                                            Text("\(source.publisher) · \(source.reliability)")
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer(minLength: 6)
                                        Image(systemName: "arrow.up.right")
                                            .font(.caption.weight(.bold))
                                    }
                                    .padding(13)
                                    .civicCard(radius: 16)
                                }
                                .buttonStyle(CivicPressStyle())
                            }
                        }
                    }
                }

                Label(
                    "Confirm meeting times and agenda status with the official source before traveling or submitting comment.",
                    systemImage: "exclamationmark.shield.fill"
                )
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .padding(15)
                .background(CivicStyle.amber.opacity(0.075), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .padding(18)
            .padding(.bottom, 34)
        }
        .accessibilityIdentifier("event-detail")
        .sensoryFeedback(.success, trigger: copied)
    }

    private func hero(_ event: CivicEvent) -> some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack {
                UrgencyBadge(urgency: event.urgency)
                Spacer()
                Text(event.topicSlug.replacingOccurrences(of: "-", with: " ").uppercased())
                    .font(.caption2.weight(.bold))
                    .tracking(0.35)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Text(event.headline)
                .font(.system(.largeTitle, design: .rounded, weight: .bold))
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            Label(event.locationLabel, systemImage: "mappin.and.ellipse")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            if let timing = event.timingLabel {
                Label(timing, systemImage: "calendar.badge.clock")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(CivicStyle.red)
            }
        }
        .padding(19)
        .background(
            LinearGradient(
                colors: [event.urgency.color.opacity(0.11), CivicStyle.card],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 26, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(event.urgency.color.opacity(0.18), lineWidth: 1)
        }
        .shadow(color: CivicStyle.shadow, radius: 14, y: 6)
    }

    private func load() async {
        do {
            event = try await repository.event(key: eventKey)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
