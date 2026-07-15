import Combine
import Foundation
import UIKit
import UserNotifications

@MainActor
final class NotificationService: ObservableObject {
    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var pushToken: String?
    @Published private(set) var syncMessage = "Not synced yet"
    @Published private(set) var errorMessage: String?

    private let preferences: PreferencesStore
    private let baseURL: URL
    private let session: URLSession
    private let center: UNUserNotificationCenter
    private let defaults: UserDefaults
    private let networkEnabled: Bool
    private var reconcileTask: Task<Void, Never>?
    private var subscriptions: Set<AnyCancellable> = []

    init(
        preferences: PreferencesStore,
        baseURL: URL,
        session: URLSession = .shared,
        center: UNUserNotificationCenter = .current(),
        defaults: UserDefaults = .standard,
        networkEnabled: Bool = true
    ) {
        self.preferences = preferences
        self.baseURL = baseURL
        self.session = session
        self.center = center
        self.defaults = defaults
        self.networkEnabled = networkEnabled
        pushToken = defaults.string(forKey: Keys.pushToken)
        preferences.objectWillChange
            .sink { [weak self] _ in self?.scheduleReconcile() }
            .store(in: &subscriptions)
    }

    var notificationsAuthorized: Bool {
        switch authorizationStatus {
        case .authorized, .provisional, .ephemeral: true
        default: false
        }
    }

    func refreshPermissionAndRetry() async {
        let settings = await center.notificationSettings()
        authorizationStatus = settings.authorizationStatus
        if notificationsAuthorized, preferences.notificationsEnabled {
            UIApplication.shared.registerForRemoteNotifications()
        }
        await reconcile(force: false)
    }

    @discardableResult
    func requestPermission() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            let settings = await center.notificationSettings()
            authorizationStatus = settings.authorizationStatus
            preferences.notificationsEnabled = granted
            if granted { UIApplication.shared.registerForRemoteNotifications() }
            await reconcile(force: true)
            return granted
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func receivedDeviceToken(_ data: Data) {
        let token = data.map { String(format: "%02x", $0) }.joined()
        guard token != pushToken else { return }
        pushToken = token
        defaults.set(token, forKey: Keys.pushToken)
        scheduleReconcile(immediate: true)
    }

    func registrationFailed(_ error: Error) {
        errorMessage = error.localizedDescription
    }

    func pause() async {
        preferences.notificationsEnabled = false
        guard networkEnabled else {
            syncMessage = "Fixture mode"
            return
        }
        do {
            let _: PauseResponseDTO = try await post(path: ["api", "v1", "installations", "pause"], body: PauseRequest(installationId: preferences.installationID))
            syncMessage = "Alerts paused"
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func resume() async {
        preferences.notificationsEnabled = true
        if notificationsAuthorized { UIApplication.shared.registerForRemoteNotifications() }
        await reconcile(force: true)
    }

    func scheduleReconcile(immediate: Bool = false) {
        reconcileTask?.cancel()
        reconcileTask = Task { [weak self] in
            if !immediate {
                try? await Task.sleep(for: .milliseconds(650))
            }
            guard !Task.isCancelled else { return }
            await self?.reconcile(force: false)
        }
    }

    func reconcile(force: Bool) async {
        guard networkEnabled else {
            syncMessage = "Fixture mode"
            return
        }
        guard preferences.onboardingComplete else { return }
        let payload = reconcileRequest()
        guard let data = try? CivicJSON.encoder().encode(payload) else { return }
        let fingerprint = data.base64EncodedString()
        guard force || defaults.string(forKey: Keys.lastFingerprint) != fingerprint else {
            syncMessage = "Preferences synced"
            return
        }
        do {
            let response: ReconcileResponseDTO = try await post(path: ["api", "v1", "installations", "reconcile"], body: payload)
            guard response.ok else { throw CivicRepositoryError.invalidResponse }
            defaults.set(fingerprint, forKey: Keys.lastFingerprint)
            syncMessage = "Synced for \(response.jurisdictionKeys.count) area\(response.jurisdictionKeys.count == 1 ? "" : "s")"
            errorMessage = nil
        } catch {
            syncMessage = "Sync pending"
            errorMessage = error.localizedDescription
        }
    }

    func reconcileRequest() -> InstallationReconcileRequest {
        let permission: NotificationPermissionValue
        switch authorizationStatus {
        case .authorized, .provisional, .ephemeral: permission = .granted
        case .denied: permission = .denied
        case .notDetermined: permission = .unknown
        @unknown default: permission = .unknown
        }
        let target = pushToken.map {
            PushTargetPayload(token: $0, environment: Self.pushEnvironment)
        }
        return InstallationReconcileRequest(
            installationId: preferences.installationID,
            appVersion: Self.appVersion,
            preferences: InstallationPreferencesPayload(
                topicSlugs: preferences.topicSlugs.sorted(),
                cadence: preferences.cadence.rawValue,
                position: preferences.position.rawValue,
                regionCode: preferences.regionCode.nilIfEmpty,
                notificationsEnabled: preferences.notificationsEnabled,
                notificationPermission: permission
            ),
            pushTarget: target
        )
    }

    private func post<Body: Encodable, Response: Decodable>(path: [String], body: Body) async throws -> Response {
        var url = baseURL
        for component in path { url.appendPathComponent(component) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try CivicJSON.encoder().encode(body)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw CivicRepositoryError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw CivicRepositoryError.httpStatus(http.statusCode) }
        return try CivicJSON.decoder().decode(Response.self, from: data)
    }

    private static var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }

    private static var pushEnvironment: String {
        #if DEBUG
        "development"
        #else
        "production"
        #endif
    }

    private enum Keys {
        static let pushToken = "civicnote.push-token"
        static let lastFingerprint = "civicnote.last-reconcile-fingerprint"
    }
}

@MainActor
final class AppEnvironment {
    static let shared = AppEnvironment()

    let configuration: AppConfiguration
    let preferences: PreferencesStore
    let repositoryStore: CivicRepositoryStore
    let notificationService: NotificationService
    let coordinator: AppCoordinator

    private init() {
        configuration = .current
        let preferences = PreferencesStore()
        configuration.apply(to: preferences)
        self.preferences = preferences

        let baseURL = Self.apiBaseURL
        let networkEnabled = !configuration.isUITestMode && Self.isConfigured(baseURL)
        let source: CivicRepository = networkEnabled
            ? LiveCivicRepository(baseURL: baseURL)
            : BundledCivicRepository()
        let fixtureCache = configuration.isUITestMode
            ? FileManager.default.temporaryDirectory.appendingPathComponent("CivicNoteUITest-\(ProcessInfo.processInfo.processIdentifier)")
            : nil
        let repository = CachedCivicRepository(live: source, cacheDirectory: fixtureCache)
        repositoryStore = CivicRepositoryStore(repository: repository, preferences: preferences)
        notificationService = NotificationService(
            preferences: preferences,
            baseURL: baseURL,
            networkEnabled: networkEnabled
        )
        coordinator = AppCoordinator(preferences: preferences, configuration: configuration)
    }

    func start() async {
        await repositoryStore.start()
        await notificationService.refreshPermissionAndRetry()
        coordinator.finishHydration()
    }

    func enterForeground() async {
        await repositoryStore.refresh()
        await notificationService.refreshPermissionAndRetry()
    }

    func route(url: URL) {
        guard let route = DeepLinkRouter.route(url: url) else { return }
        coordinator.handle(route)
    }

    func route(payload: [AnyHashable: Any]) {
        guard let route = DeepLinkRouter.route(payload: payload) else { return }
        coordinator.handle(route)
    }

    private static func isConfigured(_ url: URL) -> Bool {
        guard url.scheme == "https", let host = url.host else { return false }
        return !host.localizedCaseInsensitiveContains("YOUR-DEPLOYMENT")
    }

    private static var apiBaseURL: URL {
        if let value = Bundle.main.object(forInfoDictionaryKey: "CivicNoteAPIBaseURL") as? String,
           let url = URL(string: value) {
            return url
        }
        return URL(fileURLWithPath: "/")
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
