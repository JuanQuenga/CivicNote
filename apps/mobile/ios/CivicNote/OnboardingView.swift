import SwiftUI
import UIKit

/// Three steps: what to track, where, and whether to be told.
/// Nothing is asked before the answer changes what the user sees.
struct OnboardingView: View {
    @ObservedObject var preferences: PreferencesStore
    let topics: [CivicTopic]
    @ObservedObject var notifications: NotificationService
    @ObservedObject var coordinator: AppCoordinator
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var step = 0
    @State private var isRequesting = false

    private static let stepCount = 3
    /// Measure cap so a line of text stays readable on iPad.
    private static let readableWidth: CGFloat = 680

    private static let regions: [(code: String, label: String)] = [
        ("US", "Nationwide"),
        ("US-MI", "Michigan"),
        ("US-CA", "California"),
        ("US-NY", "New York"),
        ("US-TX", "Texas"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: CivicSpace.xl) {
                    content
                }
                .id(step)
                .transition(.opacity)
                .padding(.horizontal, CivicSpace.gutter)
                .padding(.top, CivicSpace.md)
                .padding(.bottom, CivicSpace.screenBottom)
                .frame(maxWidth: Self.readableWidth, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)

            footer
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .tint(CivicStyle.red)
    }

    // MARK: - Steps

    @ViewBuilder
    private var content: some View {
        switch step {
        case 0: topicStep
        case 1: regionStep
        default: alertStep
        }
    }

    @ViewBuilder
    private var topicStep: some View {
        CivicMasthead(
            title: "Pick what to track",
            standfirst: "CivicNote reports what a named body decided, when the next date is, and links the source. It does not tell you what to think.",
            status: stepStatus
        )

        VStack(spacing: 0) {
            ForEach(topics.indices, id: \.self) { index in
                if index > 0 { CivicRule() }
                topicRow(topics[index])
            }
        }

        if !topics.isEmpty, preferences.topicSlugs.isEmpty {
            Text("Choose at least one topic to continue.")
                .font(CivicType.meta)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }

        independenceNote
    }

    @ViewBuilder
    private var regionStep: some View {
        CivicMasthead(
            title: "Set your home area",
            standfirst: "CivicNote shows meetings and deadlines for this state, plus national items. It saves the state code on this device and never asks for your location.",
            status: stepStatus
        )

        VStack(spacing: 0) {
            ForEach(Self.regions.indices, id: \.self) { index in
                if index > 0 { CivicRule() }
                let region = Self.regions[index]
                choiceRow(
                    title: region.label,
                    detail: nil,
                    isSelected: preferences.regionCode == region.code
                ) {
                    preferences.regionCode = region.code
                    preferences.areaLabel = region.label
                    UISelectionFeedbackGenerator().selectionChanged()
                }
                .accessibilityIdentifier("onboarding-region-\(region.code)")
            }
        }

        Text("Set a city or township label later in the Settings tab.")
            .font(CivicType.meta)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
    }

    @ViewBuilder
    private var alertStep: some View {
        CivicMasthead(
            title: "Turn on alerts",
            standfirst: "CivicNote sends a notification when a topic you follow reaches a vote, a hearing, or a public comment deadline. It sends nothing else.",
            status: stepStatus
        )

        SectionLabel(title: "How often")

        VStack(spacing: 0) {
            ForEach(cadences.indices, id: \.self) { index in
                if index > 0 { CivicRule() }
                let cadence = cadences[index]
                choiceRow(
                    title: cadence.title,
                    detail: cadenceDetail(cadence),
                    isSelected: preferences.cadence == cadence
                ) {
                    preferences.cadence = cadence
                    UISelectionFeedbackGenerator().selectionChanged()
                }
            }
        }

        Text("Turning alerts on asks iOS for permission. Change the pace or pause alerts in the Settings tab.")
            .font(CivicType.meta)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)

        Button {
            finish()
        } label: {
            Text("Not now")
                .font(CivicType.metaStrong)
                .frame(maxWidth: .infinity, minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.borderless)
        .accessibilityIdentifier("onboarding-skip-notifications")
    }

    // MARK: - Rows

    private func topicRow(_ topic: CivicTopic) -> some View {
        let isSelected = preferences.topicSlugs.contains(topic.id)
        return Button {
            toggle(topic)
        } label: {
            HStack(alignment: .top, spacing: CivicSpace.md) {
                VStack(alignment: .leading, spacing: CivicSpace.xs) {
                    Text(topic.title)
                        .font(CivicType.lede)
                        .foregroundStyle(CivicStyle.ink)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(topic.summary)
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: CivicSpace.sm)
                selectionMark(isSelected)
            }
            .padding(.vertical, CivicSpace.md)
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(CivicPressStyle())
        .accessibilityIdentifier("onboarding-topic-\(topic.id)")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private func choiceRow(
        title: String,
        detail: String?,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: CivicSpace.md) {
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
                Spacer(minLength: CivicSpace.sm)
                selectionMark(isSelected)
            }
            .padding(.vertical, CivicSpace.md)
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(CivicPressStyle())
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private func selectionMark(_ isSelected: Bool) -> some View {
        Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
            .font(.title3)
            .symbolRenderingMode(.hierarchical)
            .foregroundStyle(isSelected ? CivicStyle.red : Color.secondary)
            .accessibilityHidden(true)
    }

    private var independenceNote: some View {
        Text("CivicNote is run independently. It is not a government agency, a campaign, or an emergency service.")
            .font(CivicType.meta)
            .foregroundStyle(.secondary)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(CivicSpace.lg)
            .civicSurface(.inset)
    }

    // MARK: - Footer

    private var footer: some View {
        HStack(spacing: CivicSpace.md) {
            if step > 0 {
                Button {
                    setStep(step - 1)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(CivicType.bodyStrong)
                        .foregroundStyle(.secondary)
                        .frame(minWidth: 48, minHeight: 48)
                        .contentShape(Rectangle())
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityLabel("Back")
            }
            primaryButton
        }
        .padding(.horizontal, CivicSpace.gutter)
        .padding(.vertical, CivicSpace.md)
        .frame(maxWidth: Self.readableWidth)
        .frame(maxWidth: .infinity)
        .background(CivicStyle.paper)
        .overlay(alignment: .top) { CivicRule() }
    }

    @ViewBuilder
    private var primaryButton: some View {
        if step == Self.stepCount - 1 {
            Button("Turn on alerts") {
                isRequesting = true
                Task {
                    await notifications.requestPermission()
                    isRequesting = false
                    finish()
                }
            }
            .buttonStyle(CivicFilledButtonStyle())
            .disabled(isRequesting)
            .accessibilityIdentifier("onboarding-enable-notifications")
        } else {
            Button("Continue") { advance() }
                .buttonStyle(CivicFilledButtonStyle())
                .disabled(!canContinue)
                .accessibilityIdentifier("onboarding-continue")
        }
    }

    // MARK: - State

    private var cadences: [AlertCadence] { AlertCadence.allCases }

    private var stepStatus: String { "Step \(step + 1) of \(Self.stepCount)" }

    private var canContinue: Bool {
        switch step {
        case 0: topics.isEmpty || !preferences.topicSlugs.isEmpty
        case 1: !preferences.regionCode.isEmpty
        default: true
        }
    }

    private func cadenceDetail(_ cadence: AlertCadence) -> String {
        switch cadence {
        case .instant: "One notification per dated decision point."
        case .daily: "One notification a day, grouped."
        case .weekly: "One notification a week, grouped."
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

    private func setStep(_ next: Int) {
        guard next != step else { return }
        if reduceMotion {
            step = next
        } else {
            withAnimation(.snappy(duration: 0.28)) { step = next }
        }
    }

    private func advance() {
        guard step < Self.stepCount - 1 else {
            finish()
            return
        }
        setStep(step + 1)
    }

    private func finish() {
        coordinator.completeOnboarding()
        Task { await notifications.reconcile(force: true) }
    }
}
