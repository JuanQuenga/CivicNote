import SwiftUI
import UIKit

/// Metrics for the floating tab bar. These sit outside `CivicSpace` on purpose:
/// they size a system control, not content. Every padding inside the bar still
/// comes from the scale.
enum TabBarChrome {
    /// Caps the bar's width so it stays thumb-reachable on iPad.
    static let maxWidth: CGFloat = 500
    /// Touch target per tab. `minHeight`, so the bar grows with Dynamic Type.
    static let itemMinHeight: CGFloat = 48
    /// Height of the fade that carries scrolling content into `CivicStyle.paper`
    /// behind the bar, so there is no seam.
    static let scrimHeight = CivicSpace.xxl * 3
    /// Tab glyph. Fixed so five items keep their row at any text size.
    static let glyph = Font.system(size: 20, weight: .medium)
    /// Tab label. Hidden entirely at accessibility text sizes.
    static let label = Font.caption2.weight(.semibold)
}

/// The app shell: a `TabView` with a floating capsule bar inset over it.
/// This capsule and the selected-tab pill are the only capsules in the app —
/// they are system chrome, not content surfaces.
struct UnionTabView<Tab: Hashable, Content: View, Item: View>: View {
    @Binding private var selection: Tab
    private let tabs: [Tab]
    private let isTabBarHidden: Bool
    private let content: Content
    private let item: (Tab, Bool) -> Item

    init(
        selection: Binding<Tab>,
        tabs: [Tab],
        isTabBarHidden: Bool = false,
        @ViewBuilder content: () -> Content,
        @ViewBuilder item: @escaping (Tab, Bool) -> Item
    ) {
        _selection = selection
        self.tabs = tabs
        self.isTabBarHidden = isTabBarHidden
        self.content = content()
        self.item = item
    }

    var body: some View {
        TabView(selection: $selection) { content }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if !isTabBarHidden {
                    tabBar
                        .frame(maxWidth: TabBarChrome.maxWidth)
                        .padding(.horizontal, CivicSpace.gutter)
                        .padding(.vertical, CivicSpace.sm)
                        .frame(maxWidth: .infinity)
                        .background(alignment: .bottom) { bottomScrim }
                }
            }
    }

    @ViewBuilder
    private var tabBar: some View {
        if #available(iOS 26, *) {
            tabItems
                .padding(CivicSpace.xs)
                .glassEffect(.regular.interactive(), in: .capsule)
        } else {
            tabItems
                .padding(CivicSpace.xs)
                .background(.ultraThinMaterial, in: Capsule())
                .overlay { Capsule().strokeBorder(CivicStyle.hairline, lineWidth: 1) }
                .shadow(color: CivicStyle.shadow, radius: 10, y: 4)
        }
    }

    private var tabItems: some View {
        HStack(spacing: CivicSpace.xs) {
            ForEach(tabs, id: \.self) { tab in
                let isSelected = selection == tab
                Button {
                    guard !isSelected else { return }
                    selection = tab
                    UISelectionFeedbackGenerator().selectionChanged()
                } label: {
                    item(tab, isSelected)
                        .frame(maxWidth: .infinity, minHeight: TabBarChrome.itemMinHeight)
                        .contentShape(Rectangle())
                }
                .buttonStyle(CivicPressStyle())
                .accessibilityAddTraits(isSelected ? .isSelected : [])
            }
        }
    }

    private var bottomScrim: some View {
        LinearGradient(
            stops: [
                .init(color: CivicStyle.paper.opacity(0), location: 0),
                .init(color: CivicStyle.paper.opacity(0.85), location: 0.5),
                .init(color: CivicStyle.paper, location: 1),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .frame(height: TabBarChrome.scrimHeight)
        .allowsHitTesting(false)
        .ignoresSafeArea(edges: .bottom)
    }
}

extension View {
    @ViewBuilder
    func unionTab<Tab: Hashable>(_ tab: Tab) -> some View {
        tag(tab).toolbar(.hidden, for: .tabBar)
    }
}
