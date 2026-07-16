import SwiftUI
import UIKit

struct OnboardingView: View {
    @ObservedObject var preferences: PreferencesStore
    let topics: [CivicTopic]
    @ObservedObject var notifications: NotificationService
    @ObservedObject var coordinator: AppCoordinator
    @State private var step = 0
    @State private var isRequesting = false

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 10) {
                HStack {
                    Label("CIVICNOTE", systemImage: "checkmark.seal.fill")
                        .font(.caption2.weight(.black))
                        .tracking(1)
                        .foregroundStyle(CivicStyle.red)
                    Spacer()
                    Text("\(step + 1) of 6")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                ProgressView(value: Double(step + 1), total: 6)
                    .tint(CivicStyle.red)
            }
            .padding(.horizontal, 22)
            .padding(.top, 14)
            .padding(.bottom, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    content
                }
                .id(step)
                .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                .padding(22)
                .frame(maxWidth: 680, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)

            HStack(spacing: 12) {
                if step > 0 {
                    Button {
                        withAnimation(.snappy(duration: 0.3)) { step -= 1 }
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.body.weight(.bold))
                            .frame(width: 46, height: 46)
                    }
                    .buttonStyle(.bordered)
                    .accessibilityLabel("Back")
                }
                Button(primaryTitle) { advance() }
                    .font(.body.weight(.semibold))
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .disabled(!canContinue || isRequesting)
                    .accessibilityIdentifier("onboarding-continue")
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(.ultraThinMaterial)
            .overlay(alignment: .top) { Divider().opacity(0.45) }
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .tint(CivicStyle.red)
    }

    @ViewBuilder
    private var content: some View {
        switch step {
        case 0:
            WelcomeMark()
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
            CivicMasthead(
                eyebrow: "WELCOME TO CIVICNOTE",
                title: "Know what is being decided",
                subtitle: "A focused civic brief for public decisions, evidence, and useful action."
            )
            disclosure
        case 1:
            CivicMasthead(eyebrow: "YOUR WATCHLIST", title: "Choose at least one topic", subtitle: "You can change this anytime.")
            ForEach(topics) { topic in
                Button {
                    withAnimation(.snappy(duration: 0.22)) {
                        if preferences.topicSlugs.contains(topic.id) { preferences.topicSlugs.remove(topic.id) }
                        else { preferences.topicSlugs.insert(topic.id) }
                    }
                    UISelectionFeedbackGenerator().selectionChanged()
                } label: {
                    HStack(spacing: 13) {
                        Image(systemName: topic.symbol)
                            .font(.body.weight(.semibold))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundStyle(topic.tint)
                            .frame(width: 42, height: 42)
                            .background(topic.tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(topic.title).font(.headline).foregroundStyle(CivicStyle.ink)
                            Text(topic.summary).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                        }
                        Spacer(minLength: 8)
                        selectionMark(preferences.topicSlugs.contains(topic.id))
                    }
                    .padding(14)
                    .background(
                        preferences.topicSlugs.contains(topic.id) ? topic.tint.opacity(0.055) : CivicStyle.card,
                        in: RoundedRectangle(cornerRadius: 19, style: .continuous)
                    )
                    .overlay {
                        RoundedRectangle(cornerRadius: 19, style: .continuous)
                            .stroke(preferences.topicSlugs.contains(topic.id) ? topic.tint.opacity(0.35) : CivicStyle.hairline, lineWidth: 1)
                    }
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityIdentifier("onboarding-topic-\(topic.id)")
            }
        case 2:
            CivicMasthead(eyebrow: "HOME AREA", title: "Where should we look?", subtitle: "Choose a coarse state or national region. CivicNote does not need precise location.")
            regionButtons
        case 3:
            CivicMasthead(eyebrow: "YOUR POSITION", title: "How do you want to follow these issues?", subtitle: "This helps prioritize actions without inferring your politics.")
            choiceButtons(CivicPosition.allCases, selection: preferences.position, title: { $0.title }) { preferences.position = $0 }
        case 4:
            CivicMasthead(eyebrow: "ALERT CADENCE", title: "Choose your pace", subtitle: "Instant is reserved for timely decision points. Daily and weekly options group updates.")
            choiceButtons(AlertCadence.allCases, selection: preferences.cadence, title: { $0.title }) { preferences.cadence = $0 }
        default:
            Image(systemName: "bell.badge.fill")
                .font(.system(size: 40, weight: .semibold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(CivicStyle.red)
                .frame(width: 82, height: 82)
                .background(CivicStyle.red.opacity(0.10), in: RoundedRectangle(cornerRadius: 25, style: .continuous))
            CivicMasthead(eyebrow: "OPTIONAL ALERTS", title: "Never miss the decision point", subtitle: "CivicNote asks for notification permission only when you explicitly choose to enable alerts.")
            disclosure
            Button {
                isRequesting = true
                Task {
                    await notifications.requestPermission()
                    isRequesting = false
                    finish()
                }
            } label: {
                Label("Enable civic alerts", systemImage: "bell.badge.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .disabled(isRequesting)
            .accessibilityIdentifier("onboarding-enable-notifications")
            Button("Not now") { finish() }
                .font(.body.weight(.semibold))
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("onboarding-skip-notifications")
        }
    }

    private var disclosure: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "info.circle.fill")
                .font(.body.weight(.semibold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(CivicStyle.blue)
            Text("CivicNote is an independent civic information tool. It is not a government agency, political campaign, or official emergency service.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
        }
        .padding(16)
        .background(CivicStyle.blue.opacity(0.075), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(CivicStyle.blue.opacity(0.11), lineWidth: 1)
        }
    }

    private var regionButtons: some View {
        VStack(spacing: 10) {
            regionButton("US", "Nationwide")
            regionButton("US-MI", "Michigan")
            regionButton("US-CA", "California")
            regionButton("US-NY", "New York")
            regionButton("US-TX", "Texas")
        }
    }

    private func regionButton(_ code: String, _ label: String) -> some View {
        let isSelected = preferences.regionCode == code
        return Button {
            preferences.regionCode = code
            preferences.areaLabel = label
            UISelectionFeedbackGenerator().selectionChanged()
        } label: {
            HStack {
                Label(label, systemImage: code == "US" ? "globe.americas.fill" : "mappin.circle.fill")
                    .font(.headline)
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(CivicStyle.ink)
                Spacer()
                selectionMark(isSelected)
            }
            .padding(16)
            .background(isSelected ? CivicStyle.red.opacity(0.055) : CivicStyle.card, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(isSelected ? CivicStyle.red.opacity(0.30) : CivicStyle.hairline, lineWidth: 1)
            }
        }
        .buttonStyle(CivicPressStyle())
        .accessibilityIdentifier("onboarding-region-\(code)")
    }

    private func choiceButtons<Value: Hashable>(
        _ values: [Value],
        selection: Value,
        title: @escaping (Value) -> String,
        action: @escaping (Value) -> Void
    ) -> some View {
        VStack(spacing: 10) {
            ForEach(values, id: \.self) { value in
                let isSelected = selection == value
                Button {
                    action(value)
                    UISelectionFeedbackGenerator().selectionChanged()
                } label: {
                    HStack {
                        Text(title(value)).font(.headline).foregroundStyle(CivicStyle.ink)
                        Spacer()
                        selectionMark(isSelected)
                    }
                    .padding(16)
                    .background(isSelected ? CivicStyle.red.opacity(0.055) : CivicStyle.card, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(isSelected ? CivicStyle.red.opacity(0.30) : CivicStyle.hairline, lineWidth: 1)
                    }
                }
                .buttonStyle(CivicPressStyle())
            }
        }
    }

    private func selectionMark(_ isSelected: Bool) -> some View {
        Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
            .font(.title3.weight(.semibold))
            .symbolRenderingMode(.hierarchical)
            .foregroundStyle(isSelected ? CivicStyle.red : Color.secondary)
    }

    private var canContinue: Bool {
        switch step {
        case 1: !preferences.topicSlugs.isEmpty
        case 2: !preferences.regionCode.isEmpty
        default: true
        }
    }

    private var primaryTitle: String { step == 5 ? "Finish without alerts" : "Continue" }

    private func advance() {
        if step < 5 {
            withAnimation(.snappy(duration: 0.3)) { step += 1 }
        } else {
            finish()
        }
    }

    private func finish() {
        coordinator.completeOnboarding()
        Task { await notifications.reconcile(force: true) }
    }
}

private struct WelcomeMark: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(CivicStyle.red.opacity(0.08))
                .frame(width: 112, height: 112)
            Circle()
                .stroke(CivicStyle.red.opacity(0.16), lineWidth: 1)
                .frame(width: 90, height: 90)
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 48, weight: .semibold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(CivicStyle.red)
        }
        .accessibilityHidden(true)
    }
}
