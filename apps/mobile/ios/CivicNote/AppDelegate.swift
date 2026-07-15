import SwiftUI
import UIKit
import UserNotifications

@UIApplicationMain
final class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let environment = AppEnvironment.shared
        UNUserNotificationCenter.current().delegate = self

        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = UIHostingController(rootView: CivicNoteAppView(environment: environment))
        window.makeKeyAndVisible()
        self.window = window

        if let notification = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
            environment.route(payload: notification)
        }
        Task { await environment.start() }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        Task { await AppEnvironment.shared.enterForeground() }
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        AppEnvironment.shared.notificationService.receivedDeviceToken(deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        AppEnvironment.shared.notificationService.registrationFailed(error)
    }

    func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        guard DeepLinkRouter.route(url: url) != nil else { return false }
        AppEnvironment.shared.route(url: url)
        return true
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        guard let url = userActivity.webpageURL, DeepLinkRouter.route(url: url) != nil else { return false }
        AppEnvironment.shared.route(url: url)
        return true
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .badge]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        await MainActor.run {
            AppEnvironment.shared.route(payload: response.notification.request.content.userInfo)
        }
    }
}
