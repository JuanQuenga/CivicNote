import SwiftUI

struct OnboardingView: View {
    @ObservedObject var preferences: PreferencesStore
    let topics: [CivicTopic]
    @ObservedObject var notifications: NotificationService
    @ObservedObject var coordinator: AppCoordinator
    @State private var step = 0
    @State private var isRequesting = false

    var body: some View {
        VStack(spacing: 0) {
            ProgressView(value: Double(step + 1), total: 6)
                .tint(CivicStyle.red)
                .padding(.horizontal, 22)
                .padding(.top, 14)
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    content
                }
                .padding(22)
                .frame(maxWidth: 680, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            HStack(spacing: 12) {
                if step > 0 {
                    Button("Back") { step -= 1 }
                        .buttonStyle(.bordered)
                        .frame(minHeight: 44)
                }
                Button(primaryTitle) { advance() }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .disabled(!canContinue || isRequesting)
                    .accessibilityIdentifier("onboarding-continue")
            }
            .padding(18)
            .background(.ultraThinMaterial)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
    }

    @ViewBuilder
    private var content: some View {
        switch step {
        case 0:
            CivicMasthead(eyebrow: "WELCOME TO CIVICNOTE", title: "Know what is being decided", subtitle: "A focused civic brief for public decisions, evidence, and useful action.")
            disclosure
        case 1:
            CivicMasthead(eyebrow: "YOUR WATCHLIST", title: "Choose at least one topic", subtitle: "You can change this anytime.")
            ForEach(topics) { topic in
                Button {
                    if preferences.topicSlugs.contains(topic.id) { preferences.topicSlugs.remove(topic.id) }
                    else { preferences.topicSlugs.insert(topic.id) }
                } label: {
                    HStack {
                        Image(systemName: topic.symbol).foregroundStyle(topic.tint).frame(width: 28)
                        VStack(alignment: .leading) {
                            Text(topic.title).font(.headline)
                            Text(topic.summary).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                        }
                        Spacer()
                        Image(systemName: preferences.topicSlugs.contains(topic.id) ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(preferences.topicSlugs.contains(topic.id) ? CivicStyle.red : .secondary)
                    }
                    .padding(14)
                    .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(.plain)
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
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("onboarding-skip-notifications")
        }
    }

    private var disclosure: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "info.circle.fill").foregroundStyle(CivicStyle.blue)
            Text("CivicNote is an independent civic information tool. It is not a government agency, political campaign, or official emergency service.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(CivicStyle.blue.opacity(0.08), in: RoundedRectangle(cornerRadius: 18))
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
        Button {
            preferences.regionCode = code
            preferences.areaLabel = label
        } label: {
            HStack {
                Text(label).font(.headline)
                Spacer()
                Image(systemName: preferences.regionCode == code ? "checkmark.circle.fill" : "circle")
            }
            .padding(16)
            .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 18))
        }
        .buttonStyle(.plain)
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
                Button { action(value) } label: {
                    HStack {
                        Text(title(value)).font(.headline)
                        Spacer()
                        Image(systemName: selection == value ? "checkmark.circle.fill" : "circle")
                    }
                    .padding(16)
                    .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(.plain)
            }
        }
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
        if step < 5 { step += 1 }
        else { finish() }
    }

    private func finish() {
        coordinator.completeOnboarding()
        Task { await notifications.reconcile(force: true) }
    }
}
