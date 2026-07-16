import SwiftUI
import UIKit

struct CivicMasthead: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 9) {
                Capsule()
                    .fill(CivicStyle.red)
                    .frame(width: 28, height: 3)
                Text(eyebrow)
                    .font(.caption2.weight(.black))
                    .tracking(1.3)
                    .foregroundStyle(CivicStyle.red)
            }
            Text(title)
                .font(.system(.largeTitle, design: .rounded, weight: .bold))
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(subtitle)
                .font(.body)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }
}

struct FeedStatusBanner: View {
    let state: FeedState

    var body: some View {
        HStack(spacing: 9) {
            Image(systemName: symbol)
                .font(.subheadline.weight(.semibold))
                .symbolRenderingMode(.hierarchical)
            Text(state.label)
                .font(.caption.weight(.semibold))
            Spacer(minLength: 8)
            Circle()
                .fill(tint)
                .frame(width: 7, height: 7)
                .accessibilityHidden(true)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 13)
        .frame(minHeight: 42)
        .background(tint.opacity(0.09), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(tint.opacity(0.14), lineWidth: 1)
        }
        .accessibilityIdentifier("feed-status")
    }

    private var symbol: String {
        switch state {
        case .live: "checkmark.circle.fill"
        case .loading: "arrow.triangle.2.circlepath"
        case .stale: "clock.badge.exclamationmark"
        case .offline: "wifi.slash"
        case .failed: "exclamationmark.triangle.fill"
        }
    }

    private var tint: Color {
        switch state {
        case .live: CivicStyle.green
        case .loading: CivicStyle.blue
        case .stale: CivicStyle.amber
        case .offline, .failed: CivicStyle.red
        }
    }
}

struct CivicEventCard: View {
    let event: CivicEvent
    var featured = false

    var body: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack(spacing: 10) {
                UrgencyBadge(urgency: event.urgency)
                Spacer(minLength: 8)
                Text(event.topicSlug.replacingOccurrences(of: "-", with: " ").uppercased())
                    .font(.caption2.weight(.bold))
                    .tracking(0.35)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Text(event.headline)
                .font(featured ? .title2.weight(.bold) : .headline)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(event.summary)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .lineLimit(featured ? 4 : 3)
            HStack(spacing: 8) {
                Label(event.locationLabel, systemImage: "mappin.and.ellipse")
                    .lineLimit(1)
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(featured ? CivicStyle.red : .secondary)
        }
        .padding(featured ? 20 : 17)
        .background {
            RoundedRectangle(cornerRadius: featured ? 28 : 22, style: .continuous)
                .fill(CivicStyle.card)
                .overlay(alignment: .top) {
                    if featured {
                        LinearGradient(
                            colors: [CivicStyle.red, CivicStyle.amber],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(height: 4)
                        .clipShape(Capsule())
                        .padding(.horizontal, 24)
                        .padding(.top, 1)
                    }
                }
        }
        .overlay {
            RoundedRectangle(cornerRadius: featured ? 28 : 22, style: .continuous)
                .stroke(featured ? CivicStyle.red.opacity(0.22) : CivicStyle.hairline, lineWidth: 1)
        }
        .shadow(color: CivicStyle.shadow, radius: featured ? 18 : 10, y: featured ? 8 : 4)
    }
}

struct UrgencyBadge: View {
    let urgency: CivicUrgency

    var body: some View {
        Label(urgency.title, systemImage: urgency == .urgent ? "bolt.fill" : "circle.fill")
            .font(.caption2.weight(.bold))
            .symbolRenderingMode(.hierarchical)
            .foregroundStyle(urgency.color)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(urgency.color.opacity(0.10), in: Capsule())
            .overlay { Capsule().stroke(urgency.color.opacity(0.12), lineWidth: 1) }
    }
}

struct SectionLabel: View {
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text(title)
                .font(.title3.weight(.bold))
                .foregroundStyle(CivicStyle.ink)
            Spacer(minLength: 8)
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct CivicEmptyState: View {
    let title: String
    let message: String
    let symbol: String
    var tint = CivicStyle.green

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(.largeTitle, design: .rounded, weight: .semibold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(tint)
                .frame(width: 62, height: 62)
                .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 19, style: .continuous))
            Text(title)
                .font(.headline)
                .foregroundStyle(CivicStyle.ink)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 28)
        .civicCard(radius: 24)
    }
}

struct SettingsGroup<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text(title.uppercased())
                .font(.caption2.weight(.bold))
                .tracking(0.9)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
            VStack(spacing: 0) { content }
                .padding(14)
                .civicCard(radius: 22)
        }
    }
}

struct SettingsRow: View {
    let symbol: String
    let tint: Color
    let title: String
    let detail: String
    var showsChevron = true

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(tint)
                .frame(width: 38, height: 38)
                .background(tint.opacity(0.11), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(CivicStyle.ink)
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            Spacer(minLength: 4)
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
            }
        }
        .contentShape(Rectangle())
        .frame(minHeight: 48)
    }
}

struct DetailSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text(title)
                .font(.title3.weight(.bold))
                .foregroundStyle(CivicStyle.ink)
            content
                .font(.body)
                .foregroundStyle(CivicStyle.ink.opacity(0.86))
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct CivicPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(reduceMotion ? 1 : (configuration.isPressed ? 0.985 : 1))
            .opacity(configuration.isPressed ? 0.82 : 1)
            .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: configuration.isPressed)
    }
}

private struct CivicCardModifier: ViewModifier {
    let radius: CGFloat
    let shadowed: Bool

    func body(content: Content) -> some View {
        content
            .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(CivicStyle.hairline, lineWidth: 1)
            }
            .shadow(color: shadowed ? CivicStyle.shadow : .clear, radius: 12, y: 5)
    }
}

extension View {
    func civicCard(radius: CGFloat = 22, shadowed: Bool = true) -> some View {
        modifier(CivicCardModifier(radius: radius, shadowed: shadowed))
    }

    func civicNavigationChrome() -> some View {
        toolbarBackground(CivicStyle.paper.opacity(0.94), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
    }
}

enum CivicStyle {
    static let red = adaptive(
        light: UIColor(red: 0.72, green: 0.055, blue: 0.085, alpha: 1),
        dark: UIColor(red: 1.0, green: 0.29, blue: 0.32, alpha: 1)
    )
    static let blue = adaptive(
        light: UIColor(red: 0.10, green: 0.36, blue: 0.66, alpha: 1),
        dark: UIColor(red: 0.38, green: 0.67, blue: 1.0, alpha: 1)
    )
    static let green = adaptive(
        light: UIColor(red: 0.06, green: 0.42, blue: 0.28, alpha: 1),
        dark: UIColor(red: 0.29, green: 0.78, blue: 0.56, alpha: 1)
    )
    static let amber = adaptive(
        light: UIColor(red: 0.76, green: 0.40, blue: 0.035, alpha: 1),
        dark: UIColor(red: 1.0, green: 0.65, blue: 0.25, alpha: 1)
    )
    static let ink = Color(uiColor: .label)
    static let paper = adaptive(
        light: UIColor(red: 0.973, green: 0.965, blue: 0.944, alpha: 1),
        dark: UIColor(red: 0.045, green: 0.05, blue: 0.06, alpha: 1)
    )
    static let card = adaptive(
        light: UIColor(red: 1.0, green: 0.997, blue: 0.988, alpha: 1),
        dark: UIColor(red: 0.085, green: 0.095, blue: 0.11, alpha: 1)
    )
    static let cardMuted = adaptive(
        light: UIColor(red: 0.945, green: 0.948, blue: 0.955, alpha: 1),
        dark: UIColor(red: 0.11, green: 0.12, blue: 0.14, alpha: 1)
    )
    static let hairline = Color.primary.opacity(0.075)
    static let shadow = Color.black.opacity(0.07)

    private static func adaptive(light: UIColor, dark: UIColor) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}
