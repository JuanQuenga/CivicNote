import SwiftUI
import UIKit

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
                        .frame(maxWidth: 500)
                        .padding(.horizontal, 18)
                        .padding(.top, 8)
                        .padding(.bottom, 8)
                        .frame(maxWidth: .infinity)
                        .background(alignment: .bottom) { bottomScrim }
                }
            }
    }

    @ViewBuilder
    private var tabBar: some View {
        if #available(iOS 26, *) {
            tabItems.padding(4).glassEffect(.regular.interactive(), in: .capsule)
        } else {
            tabItems
                .padding(4)
                .background(.ultraThinMaterial, in: Capsule())
                .overlay { Capsule().stroke(Color.primary.opacity(0.10), lineWidth: 0.5) }
                .shadow(color: Color.black.opacity(0.12), radius: 20, y: 9)
        }
    }

    private var tabItems: some View {
        HStack(spacing: 2) {
            ForEach(tabs, id: \.self) { tab in
                let isSelected = selection == tab
                Button {
                    guard !isSelected else { return }
                    selection = tab
                    UISelectionFeedbackGenerator().selectionChanged()
                } label: {
                    item(tab, isSelected)
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .frame(height: 52)
                        .contentShape(Rectangle())
                }
                .buttonStyle(UnionTabButtonStyle())
                .accessibilityAddTraits(isSelected ? .isSelected : [])
            }
        }
    }

    private var bottomScrim: some View {
        LinearGradient(
            stops: [
                .init(color: Color(uiColor: .systemBackground).opacity(0), location: 0),
                .init(color: Color(uiColor: .systemBackground).opacity(0.84), location: 0.42),
                .init(color: Color(uiColor: .systemBackground), location: 1),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .frame(height: 104)
        .padding(.horizontal, -18)
        .padding(.bottom, -8)
        .allowsHitTesting(false)
        .ignoresSafeArea(edges: .bottom)
    }
}

private struct UnionTabButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(reduceMotion ? 1 : (configuration.isPressed ? 0.92 : 1))
            .opacity(configuration.isPressed ? 0.72 : 1)
            .animation(reduceMotion ? nil : .snappy(duration: 0.2), value: configuration.isPressed)
    }
}

extension View {
    @ViewBuilder
    func unionTab<Tab: Hashable>(_ tab: Tab) -> some View {
        tag(tab).toolbar(.hidden, for: .tabBar)
    }
}
