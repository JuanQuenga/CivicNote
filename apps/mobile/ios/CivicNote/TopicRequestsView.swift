import SwiftUI
import UIKit

/// Where a reader names something CivicNote does not yet watch. The screen has
/// two jobs and states both plainly: take the subject, and show what happened
/// to the ones already sent — including why a request was turned down.
struct TopicRequestsView: View {
    @ObservedObject var store: TopicRequestStore
    @ObservedObject var preferences: PreferencesStore

    @State private var subject = ""
    @State private var reason = ""
    @State private var regionHint = ""
    @FocusState private var subjectFocused: Bool

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(
                    title: "Ask CivicNote to watch",
                    standfirst: "Name a subject and CivicNote starts a feed for it. An editor reads every request first, so some are turned down — you will see why."
                )

                if store.isAvailable {
                    composer
                    history
                } else {
                    CivicEmptyState(
                        title: "Not connected",
                        message: "This build has no CivicNote server configured, so requests cannot be sent.",
                        symbol: "wifi.slash"
                    )
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .scrollDismissesKeyboard(.interactively)
        .refreshable { await store.load() }
        .civicMastheadChrome("Request a topic")
        .task {
            if regionHint.isEmpty { regionHint = preferences.areaLabel }
            await store.load()
        }
        .accessibilityIdentifier("topic-requests")
    }

    // MARK: - Composer

    private var trimmedSubject: String {
        subject.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSubmit: Bool {
        trimmedSubject.count >= TopicRequestStore.minimumSubjectLength && !store.isSubmitting
    }

    private var composer: some View {
        VStack(alignment: .leading, spacing: CivicSpace.lg) {
            field(
                title: "Subject",
                prompt: "Ypsilanti Township water rate increase",
                text: $subject,
                lineLimit: 4,
                identifier: "topic-request-subject"
            )
            .focused($subjectFocused)

            field(
                title: "Why it matters",
                prompt: "Optional. A decision, a deadline, or who it affects.",
                text: $reason,
                lineLimit: 3,
                identifier: "topic-request-reason"
            )

            field(
                title: "Where",
                prompt: "Optional. A city, county, or state.",
                text: $regionHint,
                lineLimit: 1,
                identifier: "topic-request-region"
            )

            if let errorMessage = store.errorMessage {
                notice(errorMessage, symbol: "exclamationmark.triangle", tint: CivicStyle.red)
            }
            if let confirmation = store.confirmation {
                notice(confirmation, symbol: "checkmark.circle", tint: CivicStyle.green)
            }

            Button {
                submit()
            } label: {
                Text(store.isSubmitting ? "Sending…" : "Send request")
            }
            .buttonStyle(CivicFilledButtonStyle())
            .disabled(!canSubmit)
            .accessibilityIdentifier("topic-request-submit")

            Text("A subject becomes a topic only if it is a public matter with a public record. CivicNote will not track a private individual.")
                .font(CivicType.meta)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(CivicSpace.lg)
        .civicSurface(.inset)
    }

    private func field(
        title: String,
        prompt: String,
        text: Binding<String>,
        lineLimit: Int,
        identifier: String
    ) -> some View {
        VStack(alignment: .leading, spacing: CivicSpace.xs) {
            Text(title)
                .font(CivicType.metaStrong)
                .foregroundStyle(CivicStyle.ink)
            TextField(prompt, text: text, axis: .vertical)
                .font(CivicType.body)
                .foregroundStyle(CivicStyle.ink)
                .lineLimit(1...lineLimit)
                .textInputAutocapitalization(.sentences)
                .frame(minHeight: 32)
                .padding(.vertical, CivicSpace.sm)
                .padding(.horizontal, CivicSpace.md)
                // The card behind this is already `.inset`; an input inside it
                // has to come forward rather than sink further.
                .background(CivicStyle.card, in: fieldShape)
                .overlay { fieldShape.strokeBorder(CivicStyle.hairline, lineWidth: 1) }
                .accessibilityIdentifier(identifier)
        }
    }

    private var fieldShape: RoundedRectangle {
        RoundedRectangle(cornerRadius: CivicRadius.control, style: .continuous)
    }

    private func notice(_ message: String, symbol: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: CivicSpace.sm) {
            Image(systemName: symbol)
                .font(CivicType.meta)
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(tint)
            Text(message)
                .font(CivicType.meta)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    private func submit() {
        subjectFocused = false
        let sent = (subject, reason, regionHint)
        Task {
            let filed = await store.submit(
                subject: sent.0,
                reason: sent.1,
                regionHint: sent.2
            )
            if filed {
                subject = ""
                reason = ""
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }
        }
    }

    // MARK: - History

    @ViewBuilder
    private var history: some View {
        if !store.requests.isEmpty {
            VStack(alignment: .leading, spacing: CivicSpace.md) {
                SectionLabel(
                    title: "What you have asked for",
                    detail: store.isLoading ? "Refreshing" : nil
                )
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(store.requests.enumerated()), id: \.element.id) { index, request in
                        if index > 0 { CivicRule() }
                        TopicRequestRow(
                            request: request,
                            isFollowing: request.topicSlug.map { preferences.topicSlugs.contains($0) } ?? false,
                            follow: { follow(request) }
                        )
                    }
                }
            }
        }
    }

    /// An approved request produced a real topic, so the reader can start
    /// following it without hunting for it back in the list.
    private func follow(_ request: TopicRequest) {
        guard let slug = request.topicSlug else { return }
        if preferences.topicSlugs.contains(slug) {
            preferences.topicSlugs.remove(slug)
        } else {
            preferences.topicSlugs.insert(slug)
        }
        UISelectionFeedbackGenerator().selectionChanged()
    }
}

// MARK: - Row

private struct TopicRequestRow: View {
    let request: TopicRequest
    let isFollowing: Bool
    let follow: () -> Void

    private var canFollow: Bool {
        request.topicSlug != nil
            && (request.status == .approved || request.status == .duplicate)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.sm) {
            Text(request.subject)
                .font(CivicType.lede)
                .foregroundStyle(CivicStyle.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: CivicSpace.xs) {
                Image(systemName: request.status.symbol)
                    .font(.caption.weight(.bold))
                Text(request.status.title)
                    .font(CivicType.metaStrong)
                Text("·")
                    .font(CivicType.meta)
                    .foregroundStyle(.tertiary)
                Text("asked \(CivicFormat.day(request.createdAt))")
                    .font(CivicType.meta)
                    .foregroundStyle(.secondary)
            }
            .foregroundStyle(request.status.tint)

            Text(request.explanation)
                .font(CivicType.meta)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            if canFollow {
                Button(action: follow) {
                    FollowMark(isFollowing: isFollowing)
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityLabel(isFollowing ? "Following this topic" : "Follow this topic")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, CivicSpace.md)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("topic-request-\(request.id)")
    }
}
