import SwiftUI

struct CivicMasthead: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow)
                .font(.caption2.weight(.black))
                .tracking(1.2)
                .foregroundStyle(CivicStyle.red)
            Text(title)
                .font(.largeTitle.bold())
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

struct FeedStatusBanner: View {
    let state: FeedState

    var body: some View {
        Label(state.label, systemImage: symbol)
            .font(.caption.weight(.semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tint.opacity(0.09), in: RoundedRectangle(cornerRadius: 14))
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
        case .stale: Color.orange
        case .offline, .failed: CivicStyle.red
        }
    }
}

struct CivicEventCard: View {
    let event: CivicEvent
    var featured = false

    var body: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack {
                UrgencyBadge(urgency: event.urgency)
                Spacer()
                Text(event.topicSlug.replacingOccurrences(of: "-", with: " ").uppercased())
                    .font(.caption2.bold())
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Text(event.headline)
                .font(featured ? .title2.bold() : .headline)
                .foregroundStyle(CivicStyle.ink)
            Text(event.summary)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(featured ? 4 : 3)
            HStack {
                Label(event.locationLabel, systemImage: "mappin")
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.right")
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(featured ? CivicStyle.red : .secondary)
        }
        .padding(featured ? 20 : 17)
        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: featured ? 28 : 23, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: featured ? 28 : 23, style: .continuous)
                .stroke(featured ? CivicStyle.red.opacity(0.24) : Color.primary.opacity(0.06), lineWidth: 1)
        }
    }
}

struct UrgencyBadge: View {
    let urgency: CivicUrgency

    var body: some View {
        Label(urgency.title, systemImage: urgency == .urgent ? "bolt.fill" : "circle.fill")
            .font(.caption2.weight(.bold))
            .foregroundStyle(urgency.color)
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(urgency.color.opacity(0.10), in: Capsule())
    }
}

struct SectionLabel: View {
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.title3.bold()).foregroundStyle(CivicStyle.ink)
            Spacer()
            Text(detail).font(.caption).foregroundStyle(.secondary)
        }
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
                .font(.caption2.bold())
                .tracking(0.8)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
            VStack(spacing: 0) { content }
                .padding(14)
                .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
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
                .foregroundStyle(tint)
                .frame(width: 36, height: 36)
                .background(tint.opacity(0.11), in: RoundedRectangle(cornerRadius: 11))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold()).foregroundStyle(CivicStyle.ink)
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 4)
            if showsChevron {
                Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.tertiary)
            }
        }
        .contentShape(Rectangle())
        .padding(.vertical, 4)
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
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.title3.bold()).foregroundStyle(CivicStyle.ink)
            content
                .foregroundStyle(CivicStyle.ink.opacity(0.84))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

enum CivicStyle {
    static let red = Color(red: 0.77, green: 0.08, blue: 0.10)
    static let blue = Color(red: 0.12, green: 0.37, blue: 0.65)
    static let green = Color(red: 0.10, green: 0.43, blue: 0.30)
    static let ink = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.95, green: 0.95, blue: 0.94, alpha: 1)
            : UIColor(red: 0.08, green: 0.09, blue: 0.11, alpha: 1)
    })
    static let paper = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.055, green: 0.06, blue: 0.07, alpha: 1)
            : UIColor(red: 0.973, green: 0.961, blue: 0.937, alpha: 1)
    })
    static let card = Color(uiColor: .secondarySystemBackground)
}
