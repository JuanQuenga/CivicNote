import SwiftUI
import UIKit
import UserNotifications

struct SettingsView: View {
    let environment: AppEnvironment
    @ObservedObject private var preferences: PreferencesStore
    @ObservedObject private var notifications: NotificationService

    init(environment: AppEnvironment) {
        self.environment = environment
        _preferences = ObservedObject(wrappedValue: environment.preferences)
        _notifications = ObservedObject(wrappedValue: environment.notificationService)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                CivicMasthead(eyebrow: "YOUR CIVIC RADAR", title: "Alerts without the noise", subtitle: "Control what reaches you. CivicNote keeps every preference visible.")
                NotificationStatusCard(service: notifications, preferences: preferences)

                SettingsGroup(title: "Your watchlist") {
                    Button { environment.coordinator.showTopics() } label: {
                        SettingsRow(symbol: "bookmark.fill", tint: CivicStyle.blue, title: "Followed topics", detail: "\(preferences.topicSlugs.count) selected")
                    }
                    .buttonStyle(.plain)
                    Divider().padding(.leading, 48)
                    NavigationLink(value: CivicRoute.regionEditor) {
                        SettingsRow(symbol: "mappin.and.ellipse", tint: CivicStyle.green, title: "Home area", detail: preferences.areaLabel.isEmpty ? "Not set" : preferences.areaLabel)
                    }
                    .buttonStyle(.plain)
                }

                SettingsGroup(title: "Alert cadence") {
                    Picker("Cadence", selection: $preferences.cadence) {
                        ForEach(AlertCadence.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .accessibilityIdentifier("cadence-picker")
                    Text(preferences.cadence == .instant ? "Instant alerts are reserved for timely decision points and major changes." : "Briefs group relevant updates at your chosen pace.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.top, 10)
                }

                SettingsGroup(title: "Perspective") {
                    Picker("Position", selection: $preferences.position) {
                        ForEach(CivicPosition.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }

                SettingsGroup(title: "Trust & transparency") {
                    NavigationLink(value: CivicRoute.trust) {
                        SettingsRow(symbol: "checkmark.shield.fill", tint: CivicStyle.green, title: "How CivicNote verifies updates", detail: "Sources, timestamps, and corrections")
                    }
                    .buttonStyle(.plain)
                    if let url = URL(string: "https://civicnote.org") {
                        Divider().padding(.leading, 48)
                        Link(destination: url) {
                            SettingsRow(symbol: "safari.fill", tint: CivicStyle.blue, title: "CivicNote on the web", detail: "Privacy, support, and methodology")
                        }
                        .buttonStyle(.plain)
                    }
                }

                Button("Reset onboarding and preferences", role: .destructive) { preferences.reset() }
                    .font(.footnote.weight(.semibold))
                    .padding(.horizontal, 4)
                    .accessibilityIdentifier("reset-preferences")

                Text("CivicNote is an independent civic information tool. It is not affiliated with a government agency or political campaign.\nVersion \(versionLabel)")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
            .padding(18)
            .padding(.bottom, 34)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
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
            VStack(spacing: 16) {
                NotificationStatusCard(service: service, preferences: preferences)
                SettingsGroup(title: "Delivery") {
                    SettingsRow(symbol: "clock.badge.exclamationmark", tint: CivicStyle.red, title: "Decision timing", detail: "Hearings, filings, votes, and deadlines", showsChevron: false)
                    Divider().padding(.leading, 48)
                    SettingsRow(symbol: "location.fill", tint: CivicStyle.green, title: "Local relevance", detail: "Your state and home jurisdiction", showsChevron: false)
                    Divider().padding(.leading, 48)
                    SettingsRow(symbol: "doc.text.magnifyingglass", tint: CivicStyle.blue, title: "Evidence", detail: "Source links and what was verified", showsChevron: false)
                }
            }
            .padding(18)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Civic alerts")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
    }
}

struct NotificationStatusCard: View {
    @ObservedObject var service: NotificationService
    @ObservedObject var preferences: PreferencesStore
    @Environment(\.openURL) private var openURL
    @State private var isWorking = false

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack(spacing: 12) {
                Image(systemName: statusSymbol)
                    .font(.title3.weight(.semibold))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(statusTint)
                    .frame(width: 46, height: 46)
                    .background(statusTint.opacity(0.11), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                VStack(alignment: .leading, spacing: 3) {
                    Text(statusTitle)
                        .font(.headline)
                        .foregroundStyle(CivicStyle.ink)
                    Text(service.syncMessage)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(statusTint)
                }
            }
            Text(statusDetail)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
            if let error = service.errorMessage {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(CivicStyle.red)
            }
            Button {
                performAction()
            } label: {
                Label(buttonTitle, systemImage: preferences.notificationsEnabled ? "pause.fill" : "bell.badge.fill")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .background(CivicStyle.red.gradient, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
            .shadow(color: CivicStyle.red.opacity(0.18), radius: 10, y: 4)
            .disabled(isWorking)
            .accessibilityIdentifier("notification-action")
        }
        .padding(18)
        .background(
            LinearGradient(
                colors: [statusTint.opacity(0.07), CivicStyle.card],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 26, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(statusTint.opacity(0.12), lineWidth: 1)
        }
        .shadow(color: CivicStyle.shadow, radius: 14, y: 6)
    }

    private var statusTitle: String {
        if service.authorizationStatus == .denied { return "Alerts are blocked in iOS Settings" }
        if preferences.notificationsEnabled && service.notificationsAuthorized { return "Civic alerts are on" }
        return "Civic alerts are paused"
    }

    private var statusDetail: String {
        if service.authorizationStatus == .notDetermined { return "Permission is requested only after you choose to turn alerts on." }
        return preferences.notificationsEnabled ? "Relevant updates follow your topics, area, position, and cadence." : "Your preferences stay saved while delivery is paused."
    }

    private var statusSymbol: String { preferences.notificationsEnabled ? "bell.badge.fill" : "bell.slash.fill" }
    private var statusTint: Color { preferences.notificationsEnabled ? CivicStyle.green : CivicStyle.red }
    private var buttonTitle: String {
        if service.authorizationStatus == .denied { return "Open iOS Settings" }
        return preferences.notificationsEnabled ? "Pause alerts" : "Turn on civic alerts"
    }

    private func performAction() {
        if service.authorizationStatus == .denied {
            if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
            return
        }
        isWorking = true
        Task {
            if preferences.notificationsEnabled {
                await service.pause()
            } else if service.authorizationStatus == .notDetermined {
                await service.requestPermission()
            } else {
                await service.resume()
            }
            isWorking = false
        }
    }
}

struct RegionEditorView: View {
    @ObservedObject var preferences: PreferencesStore
    @State private var customArea = ""

    private let regions = [
        ("US", "Nationwide"),
        ("US-CA", "California"),
        ("US-FL", "Florida"),
        ("US-IL", "Illinois"),
        ("US-MI", "Michigan"),
        ("US-NY", "New York"),
        ("US-TX", "Texas"),
    ]

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
            Section("Optional area label") {
                TextField("City, county, or township", text: $customArea)
                    .textContentType(.addressCity)
                Button("Save area label") {
                    let value = customArea.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !value.isEmpty { preferences.areaLabel = value }
                }
                .disabled(customArea.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            Section {
                Text("CivicNote stores a coarse region and label, not your precise location.")
                    .font(.footnote)
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
        List {
            trustRow("building.columns.fill", "Prefer primary records", "Agendas, filings, contracts, votes, disclosures, and agency data come first.")
            trustRow("clock.badge.checkmark.fill", "Show freshness", "Time-sensitive claims carry a verification time and official schedule source.")
            trustRow("text.badge.checkmark", "Separate fact from analysis", "Reported facts, uncertainty, and CivicNote interpretation remain distinct.")
            trustRow("arrow.triangle.2.circlepath", "Correct transparently", "Material corrections are visible rather than silently overwritten.")
        }
        .scrollContentBackground(.hidden)
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("How verification works")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
    }

    private func trustRow(_ symbol: String, _ title: String, _ detail: String) -> some View {
        Label {
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(detail).font(.subheadline).foregroundStyle(.secondary)
            }
            .padding(.vertical, 6)
        } icon: {
            Image(systemName: symbol).foregroundStyle(CivicStyle.red)
        }
    }
}
