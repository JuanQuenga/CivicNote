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
                ContentUnavailableView("Event unavailable", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
            } else {
                ProgressView("Loading event")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task(id: eventKey) { await load() }
    }

    private func detail(_ event: CivicEvent) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    UrgencyBadge(urgency: event.urgency)
                    Text(event.headline).font(.largeTitle.bold()).foregroundStyle(CivicStyle.ink)
                    Label(event.locationLabel, systemImage: "mappin.and.ellipse").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                    if let timing = event.timingLabel {
                        Label(timing, systemImage: "calendar.badge.clock").font(.subheadline.weight(.semibold)).foregroundStyle(CivicStyle.red)
                    }
                }
                DetailSection(title: "What’s happening") { Text(event.summary) }
                DetailSection(title: "Why it matters") { Text(event.whyItMatters) }

                if !event.evidence.isEmpty {
                    DetailSection(title: "Evidence") {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(event.evidence) { evidence in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(evidence.claim).font(.body.weight(.semibold))
                                    Text(evidence.context).font(.subheadline).foregroundStyle(.secondary)
                                    Text("\(evidence.classification) · \(evidence.evidenceStrength)")
                                        .font(.caption.bold()).foregroundStyle(CivicStyle.green)
                                }
                                .padding(14)
                                .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 16))
                            }
                        }
                    }
                }

                ForEach(event.actions) { action in
                    DetailSection(title: action.title) {
                        Text(action.description)
                        if let script = action.script, !script.isEmpty {
                            Text(script)
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(CivicStyle.red.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
                            Button {
                                UIPasteboard.general.string = script
                                copied = true
                            } label: {
                                Label(copied ? "Copied" : "Copy as a starting point", systemImage: copied ? "checkmark" : "doc.on.doc")
                            }
                            .buttonStyle(.bordered)
                        }
                        if let url = action.ctaURL {
                            Link(action.ctaLabel, destination: url).buttonStyle(.borderedProminent)
                        }
                    }
                }

                if let meeting = event.meeting {
                    DetailSection(title: "Meeting") {
                        Label(meeting.title, systemImage: "building.columns.fill")
                        Text(meeting.bodyName).font(.subheadline).foregroundStyle(.secondary)
                        if let address = meeting.address { Text(address) }
                        if let agendaURL = meeting.agendaURL { Link("Open official agenda", destination: agendaURL) }
                    }
                }

                if !event.sources.isEmpty {
                    DetailSection(title: "Sources") {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(event.sources) { source in
                                Link(destination: source.url) {
                                    HStack {
                                        Image(systemName: "arrow.up.right.square")
                                        VStack(alignment: .leading) {
                                            Text(source.title).font(.subheadline.bold())
                                            Text("\(source.publisher) · \(source.reliability)").font(.caption).foregroundStyle(.secondary)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Text("Confirm meeting times and agenda status with the official source before traveling or submitting comment.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(18)
            .padding(.bottom, 28)
        }
        .accessibilityIdentifier("event-detail")
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
