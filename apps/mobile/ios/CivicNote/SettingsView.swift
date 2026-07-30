import SwiftUI
import UIKit
import UserNotifications

struct SettingsView: View {
    let environment: AppEnvironment
    @ObservedObject private var preferences: PreferencesStore
    @ObservedObject private var notifications: NotificationService
    @State private var isConfirmingReset = false

    init(environment: AppEnvironment) {
        self.environment = environment
        _preferences = ObservedObject(wrappedValue: environment.preferences)
        _notifications = ObservedObject(wrappedValue: environment.notificationService)
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(title: "Settings")

                AlertsPanel(service: notifications, preferences: preferences)

                SettingsGroup(title: "What alerts cover") {
                    Button { environment.coordinator.showTopics() } label: {
                        SettingsRow(
                            symbol: "bookmark",
                            tint: Color.secondary,
                            title: "Topics",
                            detail: AlertCopy.topicList(preferences.topicSlugs)
                        )
                    }
                    .buttonStyle(.plain)
                    Divider().padding(.leading, SettingsRow.dividerInset)
                    NavigationLink(value: CivicRoute.regionEditor) {
                        SettingsRow(
                            symbol: "mappin.and.ellipse",
                            tint: CivicStyle.blue,
                            title: "Home area",
                            detail: AlertCopy.areaName(label: preferences.areaLabel, code: preferences.regionCode)
                        )
                    }
                    .buttonStyle(.plain)
                }

                SettingsGroup(title: "About") {
                    NavigationLink(value: CivicRoute.trust) {
                        SettingsRow(
                            symbol: "doc.text.magnifyingglass",
                            tint: CivicStyle.green,
                            title: "How verification works",
                            detail: "Where each event comes from and how corrections are published"
                        )
                    }
                    .buttonStyle(.plain)
                    if let url = URL(string: "https://civicnote.org") {
                        Divider().padding(.leading, SettingsRow.dividerInset)
                        Link(destination: url) {
                            SettingsRow(
                                symbol: "safari",
                                tint: Color.secondary,
                                title: "civicnote.org",
                                detail: "Privacy policy and support"
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                closingBlock
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .civicMastheadChrome("Settings")
    }

    private var closingBlock: some View {
        VStack(alignment: .leading, spacing: CivicSpace.lg) {
            CivicRule()
            Button("Erase topics, home area, and alert settings", role: .destructive) {
                isConfirmingReset = true
            }
            .font(CivicType.metaStrong)
            .foregroundStyle(CivicStyle.red)
            .frame(minHeight: 44, alignment: .leading)
            .accessibilityIdentifier("reset-preferences")
            .confirmationDialog(
                "Erase your settings?",
                isPresented: $isConfirmingReset,
                titleVisibility: .visible
            ) {
                Button("Erase settings", role: .destructive) { preferences.reset() }
                Button("Keep them", role: .cancel) {}
            } message: {
                Text(resetWarning)
            }

            VStack(alignment: .leading, spacing: CivicSpace.xs) {
                Text("CivicNote is an independent tool. It is not affiliated with a government agency or a political campaign.")
                    .fixedSize(horizontal: false, vertical: true)
                Text("Version \(versionLabel)")
                    .fixedSize(horizontal: false, vertical: true)
            }
            .font(CivicType.meta)
            .foregroundStyle(.secondary)
        }
    }

    private var resetWarning: String {
        let count = preferences.topicSlugs.count
        let topics = count == 1 ? "1 followed topic" : "\(count) followed topics"
        return "This clears your \(topics), your home area, and your alert settings, then starts onboarding over."
    }

    private var versionLabel: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }
}

struct NotificationSettingsView: View {
    @ObservedObject var service: NotificationService
    @ObservedObject var preferences: PreferencesStore

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(title: "Civic alerts")

                AlertsPanel(service: service, preferences: preferences, showsCadence: false)

                VStack(alignment: .leading, spacing: 0) {
                    SectionLabel(title: "What a push has to match")
                    AlertFactRow(label: "Topics", value: AlertCopy.topicList(preferences.topicSlugs, empty: "None yet"))
                    CivicRule()
                    AlertFactRow(
                        label: "Home area",
                        value: AlertCopy.areaName(label: preferences.areaLabel, code: preferences.regionCode)
                    )
                    CivicRule()
                    AlertFactRow(label: "How often", value: preferences.cadence.title)
                    Text("Change any of these in the Settings tab.")
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, CivicSpace.lg)
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .civicMastheadChrome("Civic alerts")
    }
}

/// The alert state, in the order a person asks about it: is it on, what will
/// arrive, how often, and the one control that changes it. Tier one — the only
/// tinted surface here is the caution panel iOS forces on us when permission
/// is denied.
private struct AlertsPanel: View {
    @ObservedObject var service: NotificationService
    @ObservedObject var preferences: PreferencesStore
    var showsCadence = true

    @Environment(\.openURL) private var openURL
    @State private var isWorking = false
    @State private var isConfirmingPause = false

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            Text(stateTitle)
                .font(CivicType.title)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)

            if isBlocked {
                Text(stateDetail)
                    .font(CivicType.secondary)
                    .foregroundStyle(CivicStyle.ink)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(CivicSpace.lg)
                    .civicSurface(.inset, tint: CivicStyle.amber)
            } else {
                Text(stateDetail)
                    .font(CivicType.secondary)
                    .foregroundStyle(.secondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Text(service.syncMessage)
                .font(CivicType.meta)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            if let error = service.errorMessage {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(CivicType.meta)
                    .foregroundStyle(CivicStyle.red)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if showsCadence && !isBlocked {
                cadenceControl
            }

            actionControl
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var cadenceControl: some View {
        VStack(alignment: .leading, spacing: CivicSpace.sm) {
            Text("How often")
                .font(CivicType.metaStrong)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            Picker("How often", selection: $preferences.cadence) {
                ForEach(AlertCadence.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("cadence-picker")
            Text(AlertCopy.cadenceLine(preferences.cadence))
                .font(CivicType.meta)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, CivicSpace.xs)
    }

    @ViewBuilder
    private var actionControl: some View {
        if isBlocked {
            Button("Open iOS Settings") { openSystemSettings() }
                .buttonStyle(CivicFilledButtonStyle())
                .accessibilityIdentifier("notification-action")
        } else if isOn {
            Button("Pause alerts") { isConfirmingPause = true }
                .font(CivicType.metaStrong)
                .buttonStyle(.bordered)
                .tint(CivicStyle.red)
                .frame(minHeight: 44)
                .disabled(isWorking)
                .accessibilityIdentifier("notification-action")
                .confirmationDialog(
                    "Pause every alert?",
                    isPresented: $isConfirmingPause,
                    titleVisibility: .visible
                ) {
                    Button("Pause alerts", role: .destructive) { pauseAlerts() }
                    Button("Keep them on", role: .cancel) {}
                } message: {
                    Text("Nothing will be pushed until you turn alerts back on. Your topics and home area stay saved.")
                }
        } else {
            Button("Turn on alerts") { enableAlerts() }
                .buttonStyle(CivicFilledButtonStyle())
                .disabled(isWorking)
                .accessibilityIdentifier("notification-action")
        }
    }

    private var isBlocked: Bool { service.authorizationStatus == .denied }
    private var isOn: Bool { preferences.notificationsEnabled && service.notificationsAuthorized }

    private var stateTitle: String {
        if isBlocked { return "iOS is blocking CivicNote alerts" }
        return isOn ? "Alerts are on" : "Alerts are off"
    }

    private var stateDetail: String {
        if isBlocked {
            return "Notifications are turned off for CivicNote in iOS Settings, so nothing arrives no matter what is set here."
        }
        if isOn {
            guard !preferences.topicSlugs.isEmpty else {
                return "You follow no topics, so nothing will be pushed. Pick a topic in the Topics tab."
            }
            let count = preferences.topicSlugs.count
            let topics = count == 1 ? "the topic you follow" : "one of the \(count) topics you follow"
            let area = AlertCopy.areaName(label: preferences.areaLabel, code: preferences.regionCode)
            return "A push goes out when CivicNote publishes an event in \(topics) that lands in \(area)."
        }
        if service.authorizationStatus == .notDetermined {
            return "iOS asks for permission the first time you turn alerts on."
        }
        return "Nothing is pushed. Your topics and home area stay saved."
    }

    private func openSystemSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
    }

    private func enableAlerts() {
        isWorking = true
        Task {
            if service.authorizationStatus == .notDetermined {
                await service.requestPermission()
            } else {
                await service.resume()
            }
            isWorking = false
        }
    }

    private func pauseAlerts() {
        isWorking = true
        Task {
            await service.pause()
            isWorking = false
        }
    }
}

/// One stated fact about delivery. Label left, value right, rules between.
private struct AlertFactRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: CivicSpace.md) {
            Text(label)
                .font(CivicType.meta)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: CivicSpace.sm)
            Text(value)
                .font(CivicType.metaStrong)
                .foregroundStyle(CivicStyle.ink)
                .multilineTextAlignment(.trailing)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, CivicSpace.md)
        .accessibilityElement(children: .combine)
    }
}

/// Plain functions so both alert screens say the same true thing.
private enum AlertCopy {
    /// Deliberately ignores `areaLabel`. Only `regionCode` filters the feed
    /// (`PreferencesStore.event(_:matchesRegionCode:)`), so a sentence about
    /// what gets pushed must not name a township the app never matches on.
    static func areaName(label: String, code: String) -> String {
        CivicFormat.regionName(code)
    }

    static func topicList(_ slugs: Set<String>, empty: String = "None yet. Pick the topics you want alerts about.") -> String {
        let names = slugs.sorted().map(CivicFormat.topicName)
        guard !names.isEmpty else { return empty }
        return names.joined(separator: ", ")
    }

    static func cadenceLine(_ cadence: AlertCadence) -> String {
        switch cadence {
        case .instant: return "Each event is pushed as CivicNote publishes it."
        case .daily: return "Events are held and sent in one push a day."
        case .weekly: return "Events are held and sent in one push a week."
        }
    }
}

struct RegionEditorView: View {
    @ObservedObject var preferences: PreferencesStore
    @State private var customArea = ""

    private let regions = CivicFormat.filterableRegions

    var body: some View {
        List {
            Section("State or region") {
                ForEach(regions, id: \.0) { code, label in
                    Button {
                        preferences.regionCode = code
                        preferences.areaLabel = label
                    } label: {
                        HStack {
                            Text(label)
                            Spacer()
                            if preferences.regionCode == code { Image(systemName: "checkmark").foregroundStyle(CivicStyle.red) }
                        }
                    }
                    .foregroundStyle(CivicStyle.ink)
                }
            }
            Section {
                TextField("Ypsilanti Township", text: $customArea)
                    .textContentType(.addressCity)
                Button("Save this label") {
                    let value = customArea.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !value.isEmpty { preferences.areaLabel = value }
                }
                .disabled(customArea.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            } header: {
                Text("City, county, or township")
            } footer: {
                Text("A name for your own reference. CivicNote cannot filter below the state level yet, so this does not narrow your feed or your alerts — those follow \(CivicFormat.regionName(preferences.regionCode)).")
            }
            Section {
                Text("CivicNote stores the state code and the label you type here. It never reads your device location.")
                    .font(CivicType.meta)
                    .foregroundStyle(.secondary)
            }
        }
        .scrollContentBackground(.hidden)
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Home area")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
        .onAppear { customArea = preferences.areaLabel }
        .accessibilityIdentifier("region-editor")
    }
}

struct TrustView: View {
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(
                    title: "How verification works",
                    standfirst: "Every event links to the record it came from, and to the body that decided it."
                )

                DetailSection(title: "Sources", showsRule: false) {
                    Text("Each event lists the records it was built from: agendas, filings, contracts, vote rolls, disclosures, and agency data. Tap a source to open the original document.")
                        .fixedSize(horizontal: false, vertical: true)
                }

                DetailSection(title: "Dates") {
                    Text("Hearing dates, comment deadlines, and vote dates come from the schedule the body itself published, with the time CivicNote last checked it. Confirm the time with the body before you travel.")
                        .fixedSize(horizontal: false, vertical: true)
                }

                DetailSection(title: "Claims and analysis") {
                    Text("A reported fact carries its source. Where CivicNote characterizes what a decision does, the event marks that line as interpretation and states how strong the evidence is.")
                        .fixedSize(horizontal: false, vertical: true)
                }

                DetailSection(title: "Corrections") {
                    Text("When a fact changes, the event is updated and the change is recorded instead of being overwritten quietly.")
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .civicMastheadChrome("How verification works")
    }
}
