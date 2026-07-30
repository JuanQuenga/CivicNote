import SwiftUI
import UIKit

/// The record for one event, in the order a person actually asks:
/// what changed, who decides and when, what it does to you, what you can do,
/// and how you check it yourself.
struct EventDetailView: View {
    let eventKey: String
    @ObservedObject var repository: CivicRepositoryStore
    @State private var event: CivicEvent?
    @State private var errorMessage: String?
    @State private var copiedActionID: String?

    var body: some View {
        Group {
            if let event {
                detail(event)
            } else if let errorMessage {
                CivicEmptyState(
                    title: "This item did not load",
                    message: errorMessage,
                    symbol: "exclamationmark.triangle",
                    tint: CivicStyle.red,
                    actionTitle: "Load it again",
                    action: { Task { await load() } }
                )
                .padding(.horizontal, CivicSpace.gutter)
            } else {
                ProgressView()
                    .controlSize(.large)
                    .accessibilityLabel("Loading")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
        .task(id: eventKey) { await load() }
    }

    // MARK: - Article

    private func detail(_ event: CivicEvent) -> some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                hero(event)

                DetailSection(title: "What happened") {
                    prose(event.summary)
                }

                DetailSection(title: "Why it matters") {
                    prose(event.whyItMatters)
                }

                if let meeting = event.meeting {
                    meetingSection(meeting)
                }

                ForEach(event.actions) { action in
                    actionSection(action)
                }

                if !event.evidence.isEmpty {
                    evidenceSection(event.evidence)
                }

                if !event.sources.isEmpty {
                    sourcesSection(event.sources)
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .accessibilityIdentifier("event-detail")
        .safeAreaInset(edge: .bottom, spacing: 0) { actionBar(event) }
        .sensoryFeedback(.success, trigger: copiedActionID)
    }

    // MARK: - Hero

    private func hero(_ event: CivicEvent) -> some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            UrgencyBadge(urgency: event.urgency)

            Text(event.headline)
                .font(CivicType.headline)
                .foregroundStyle(CivicStyle.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            Text(CivicFormat.dateline(for: event))
                .font(CivicType.metaStrong)
                .foregroundStyle(CivicStyle.urgencyTint(event.urgency))
                .fixedSize(horizontal: false, vertical: true)

            if event.locationLabel != CivicFormat.decider(for: event) {
                Text(event.locationLabel)
                    .font(CivicType.meta)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let source = event.sources.first, let label = CivicFormat.sources(for: event) {
                Link(destination: source.url) {
                    HStack(spacing: CivicSpace.sm) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .symbolRenderingMode(.hierarchical)
                        Text(label)
                            .fixedSize(horizontal: false, vertical: true)
                        Image(systemName: "arrow.up.right")
                        Spacer(minLength: 0)
                    }
                    .font(CivicType.metaStrong)
                    .foregroundStyle(CivicStyle.green)
                    .frame(minHeight: 44, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityLabel("Open \(source.publisher)")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Meeting

    private func meetingSection(_ meeting: CivicMeeting) -> some View {
        DetailSection(title: "The meeting") {
            VStack(alignment: .leading, spacing: CivicSpace.lg) {
                fact(
                    symbol: "calendar",
                    tint: CivicStyle.red,
                    title: meetingTime(meeting),
                    detail: meeting.title
                )
                fact(
                    symbol: "building.columns",
                    tint: CivicStyle.blue,
                    title: meeting.bodyName,
                    detail: meetingStatus(meeting)
                )
                if let address = meeting.address {
                    fact(
                        symbol: "mappin.and.ellipse",
                        tint: CivicStyle.blue,
                        title: address,
                        detail: meeting.locationName
                    )
                }
                if let deadline = meeting.publicCommentDeadline {
                    fact(
                        symbol: "clock",
                        tint: CivicStyle.red,
                        title: "Comment closes \(CivicFormat.day(deadline))",
                        detail: CivicFormat.countdown(to: deadline)
                    )
                }
                if let agendaURL = meeting.agendaURL {
                    CivicRule()
                    Link(destination: agendaURL) {
                        externalLabel("Open the agenda", tint: CivicStyle.green)
                    }
                    .buttonStyle(CivicPressStyle())
                }
                CivicRule()
                HStack(alignment: .top, spacing: CivicSpace.sm) {
                    Image(systemName: "exclamationmark.triangle")
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(CivicStyle.amber)
                    Text("Confirm the time and agenda with \(meeting.bodyName) before you travel.")
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .font(CivicType.meta)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(CivicSpace.lg)
            .civicSurface(.inset)
        }
    }

    /// Only worth a line when the meeting is not simply on the calendar —
    /// "canceled" and "postponed" change what a person does today.
    private func meetingStatus(_ meeting: CivicMeeting) -> String? {
        let status = meeting.status.trimmingCharacters(in: .whitespaces)
        guard !status.isEmpty, status.lowercased() != "scheduled" else { return nil }
        return status.prefix(1).uppercased() + status.dropFirst()
    }

    private func meetingTime(_ meeting: CivicMeeting) -> String {
        let day = CivicFormat.day(meeting.startsAt)
        let time = meeting.startsAt.formatted(date: .omitted, time: .shortened)
        if let countdown = CivicFormat.countdown(to: meeting.startsAt) {
            return "\(day), \(time) · \(countdown)"
        }
        return "\(day), \(time)"
    }

    // MARK: - Actions

    private func actionSection(_ action: CivicAction) -> some View {
        DetailSection(title: action.title) {
            VStack(alignment: .leading, spacing: CivicSpace.md) {
                if let deadline = action.deadlineAt {
                    Text(deadlineLine(deadline))
                        .font(CivicType.metaStrong)
                        .foregroundStyle(CivicStyle.red)
                        .fixedSize(horizontal: false, vertical: true)
                }

                prose(action.description)

                if !action.audience.isEmpty {
                    Text("For \(action.audience)")
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let script = action.script, !script.isEmpty {
                    Text(script)
                        .font(CivicType.secondary)
                        .foregroundStyle(CivicStyle.ink)
                        .lineSpacing(3)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(CivicSpace.lg)
                        .civicSurface(.inset)

                    Button {
                        UIPasteboard.general.string = script
                        copiedActionID = action.id
                    } label: {
                        Label(
                            copiedActionID == action.id ? "Copied" : "Copy this text",
                            systemImage: copiedActionID == action.id ? "checkmark" : "doc.on.doc"
                        )
                        .font(CivicType.metaStrong)
                    }
                    .buttonStyle(.bordered)
                    .tint(CivicStyle.red)
                }

                if let url = action.ctaURL {
                    Link(destination: url) {
                        externalLabel(action.ctaLabel, tint: CivicStyle.red)
                    }
                    .buttonStyle(CivicPressStyle())
                }
            }
        }
    }

    private func deadlineLine(_ deadline: Date) -> String {
        guard let countdown = CivicFormat.countdown(to: deadline) else {
            return "Send by \(CivicFormat.day(deadline))"
        }
        return "Send by \(CivicFormat.day(deadline)) · \(countdown)"
    }

    // MARK: - Evidence

    private func evidenceSection(_ evidence: [CivicEvidence]) -> some View {
        DetailSection(title: "Evidence") {
            VStack(alignment: .leading, spacing: CivicSpace.lg) {
                ForEach(Array(evidence.enumerated()), id: \.element.id) { index, item in
                    if index > 0 { CivicRule() }
                    HStack(alignment: .top, spacing: CivicSpace.md) {
                        Image(systemName: CivicFormat.evidenceSymbol(item.classification))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundStyle(CivicStyle.evidenceTint(item.classification))
                            .frame(width: 28, alignment: .leading)
                        VStack(alignment: .leading, spacing: CivicSpace.xs) {
                            Text(item.claim)
                                .font(CivicType.bodyStrong)
                                .foregroundStyle(CivicStyle.ink)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(item.context)
                                .font(CivicType.meta)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(CivicFormat.evidenceLabel(item.classification, strength: item.evidenceStrength))
                                .font(CivicType.meta)
                                .foregroundStyle(CivicStyle.evidenceTint(item.classification))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 0)
                    }
                }
            }
        }
    }

    // MARK: - Sources

    private func sourcesSection(_ sources: [CivicSource]) -> some View {
        DetailSection(title: "Sources") {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(sources.enumerated()), id: \.element.id) { index, source in
                    if index > 0 { CivicRule() }
                    Link(destination: source.url) {
                        HStack(alignment: .top, spacing: CivicSpace.md) {
                            Image(systemName: "doc.text.magnifyingglass")
                                .symbolRenderingMode(.hierarchical)
                                .foregroundStyle(CivicStyle.green)
                                .frame(width: 28, alignment: .leading)
                            VStack(alignment: .leading, spacing: CivicSpace.xs) {
                                Text(source.title)
                                    .font(CivicType.body)
                                    .foregroundStyle(CivicStyle.ink)
                                    .multilineTextAlignment(.leading)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text(sourceDetail(source))
                                    .font(CivicType.meta)
                                    .foregroundStyle(.secondary)
                                    .multilineTextAlignment(.leading)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: CivicSpace.sm)
                            Image(systemName: "arrow.up.right")
                                .font(CivicType.meta)
                                .foregroundStyle(CivicStyle.green)
                        }
                        .padding(.vertical, CivicSpace.md)
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(CivicPressStyle())
                }
            }
        }
    }

    private func sourceDetail(_ source: CivicSource) -> String {
        var parts = [source.publisher, source.reliability]
        if let published = source.publishedAt {
            parts.append(CivicFormat.day(published))
        }
        return parts.filter { !$0.isEmpty }.joined(separator: " · ")
    }

    // MARK: - Persistent action

    @ViewBuilder
    private func actionBar(_ event: CivicEvent) -> some View {
        if let action = event.primaryAction {
            VStack(spacing: 0) {
                CivicRule()
                Group {
                    if let url = action.ctaURL {
                        Link(action.ctaLabel, destination: url)
                            .buttonStyle(CivicFilledButtonStyle())
                    } else if let script = action.script, !script.isEmpty {
                        Button(copiedActionID == action.id ? "Copied" : "Copy this text") {
                            UIPasteboard.general.string = script
                            copiedActionID = action.id
                        }
                        .buttonStyle(CivicFilledButtonStyle())
                    }
                }
                .padding(.horizontal, CivicSpace.gutter)
                .padding(.vertical, CivicSpace.md)
            }
            .background(CivicStyle.paper)
            .accessibilityIdentifier("event-primary-action")
        }
    }

    // MARK: - Pieces

    /// Long-form copy, split into paragraphs so the article has rhythm instead
    /// of one unbroken block.
    private func prose(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            ForEach(Array(paragraphs(of: text).enumerated()), id: \.offset) { _, paragraph in
                Text(paragraph)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func paragraphs(of text: String) -> [String] {
        let parts = text
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? [text] : parts
    }

    private func fact(symbol: String, tint: Color, title: String, detail: String?) -> some View {
        HStack(alignment: .top, spacing: CivicSpace.md) {
            Image(systemName: symbol)
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(tint)
                .frame(width: 28, alignment: .leading)
            VStack(alignment: .leading, spacing: CivicSpace.xs) {
                Text(title)
                    .font(CivicType.body)
                    .foregroundStyle(CivicStyle.ink)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                if let detail, !detail.isEmpty {
                    Text(detail)
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }

    private func externalLabel(_ title: String, tint: Color) -> some View {
        HStack(spacing: CivicSpace.sm) {
            Text(title)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
            Image(systemName: "arrow.up.right")
            Spacer(minLength: 0)
        }
        .font(CivicType.metaStrong)
        .foregroundStyle(tint)
        .frame(minHeight: 44, alignment: .leading)
        .contentShape(Rectangle())
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
