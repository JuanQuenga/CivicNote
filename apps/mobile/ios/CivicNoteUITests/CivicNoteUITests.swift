import XCTest

final class CivicNoteUITests: XCTestCase {
    func testTabSwitching() {
        let app = fixtureApp()
        app.launch()
        XCTAssertTrue(app.waitForTabBar())
        for tab in ["topics", "act", "nearby", "settings", "today"] {
            app.tapTab(tab)
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
        XCTAssertTrue(app.waitForTabBar())
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
        XCTAssertTrue(app.waitForTabBar())
        snapshot(name)
        app.terminate()
    }

    private func fixtureApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTestMode", "-screenshotFixtures"]
        return app
    }
}

/// The glass tab bar takes its touches on a `UISegmentedControl` layered behind
/// the labels, so the tab items are not buttons and cannot be tapped by
/// identifier. Below iOS 26 the app falls back to the system bar. Address both
/// by position, in the order `CivicNoteAppView.tabOrder` declares.
private extension XCUIApplication {
    static let tabOrder = ["today", "act", "nearby", "topics", "settings"]

    func waitForTabBar(timeout: TimeInterval = 5) -> Bool {
        segmentedControls.firstMatch.waitForExistence(timeout: timeout)
            || tabBars.firstMatch.waitForExistence(timeout: 1)
    }

    func tapTab(_ tab: String, file: StaticString = #filePath, line: UInt = #line) {
        guard let index = Self.tabOrder.firstIndex(of: tab) else {
            return XCTFail("Unknown tab \(tab)", file: file, line: line)
        }
        let bar = segmentedControls.firstMatch.exists ? segmentedControls.firstMatch : tabBars.firstMatch
        let segment = bar.buttons.element(boundBy: index)
        XCTAssertTrue(segment.waitForExistence(timeout: 5), "No segment for \(tab)", file: file, line: line)
        segment.tap()
    }
}
