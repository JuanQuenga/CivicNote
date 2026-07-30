import XCTest

final class CivicNoteUITests: XCTestCase {
    func testTabSwitching() {
        let app = fixtureApp()
        app.launch()
        for tab in ["topics", "act", "nearby", "settings", "today"] {
            let button = app.buttons["tab-\(tab)"]
            XCTAssertTrue(button.waitForExistence(timeout: 5))
            button.tap()
        }
    }

    func testOnboardingCompletion() {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTestMode", "-uiTestOnboarding"]
        app.launch()
        XCTAssertTrue(app.buttons["onboarding-continue"].waitForExistence(timeout: 5))

        // Walk to the alerts step. How many steps precede it is a design detail,
        // so advance until the footer swaps "Continue" for the alerts prompt
        // instead of tapping a fixed number of times.
        let skip = app.buttons["onboarding-skip-notifications"]
        for _ in 0..<8 where !skip.exists {
            let next = app.buttons["onboarding-continue"]
            guard next.exists, next.isEnabled else { break }
            next.tap()
        }

        XCTAssertTrue(skip.waitForExistence(timeout: 2))
        skip.tap()
        XCTAssertTrue(app.buttons["tab-today"].waitForExistence(timeout: 5))
    }

    func testEventDetailNavigation() {
        let app = fixtureApp()
        app.launch()
        let event = app.buttons["event-ypsilanti-data-center-session"]
        XCTAssertTrue(event.waitForExistence(timeout: 5))
        event.tap()
        XCTAssertTrue(app.scrollViews["event-detail"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testScreenshotScenarios() {
        capture(tab: "today", name: "Today")
        capture(tab: "topics", name: "Topics")
        capture(tab: "nearby", name: "NearYou")
        capture(tab: "act", name: "Act")
        capture(tab: "settings", name: "Settings")

        let app = fixtureApp()
        setupSnapshot(app)
        app.launch()
        let event = app.buttons["event-ypsilanti-data-center-session"]
        XCTAssertTrue(event.waitForExistence(timeout: 5))
        event.tap()
        XCTAssertTrue(app.scrollViews["event-detail"].waitForExistence(timeout: 5))
        snapshot("Detail")
    }

    @MainActor
    private func capture(tab: String, name: String) {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTestMode", "-screenshotFixtures", "-selectTab", tab]
        setupSnapshot(app)
        app.launch()
        XCTAssertTrue(app.buttons["tab-today"].waitForExistence(timeout: 5))
        snapshot(name)
        app.terminate()
    }

    private func fixtureApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTestMode", "-screenshotFixtures"]
        return app
    }
}
