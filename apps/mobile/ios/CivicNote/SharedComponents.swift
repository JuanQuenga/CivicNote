import SwiftUI
import UIKit
import UnionTabView

// MARK: - Spacing
//
// One 4pt grid. Every padding, every stack spacing, every inset in the app
// comes from this scale. There are no other legal values.

enum CivicSpace {
    /// 4 — hairline gaps: label to value, icon to its own caption.
    static let xs: CGFloat = 4
    /// 8 — inside a single line of content: icon to text, chip internals.
    static let sm: CGFloat = 8
    /// 12 — between lines of one idea: headline to dateline to summary.
    static let md: CGFloat = 12
    /// 16 — padding inside a surface, and between rows in a list.
    static let lg: CGFloat = 16
    /// 24 — between distinct blocks on a screen.
    static let xl: CGFloat = 24
    /// 32 — between major sections, and above a screen's closing content.
    static let xxl: CGFloat = 32

    /// Horizontal page margin. Every screen uses this and nothing else.
    static let gutter: CGFloat = 16
    /// Bottom padding on every scroll view, so content clears the tab bar.
    /// `UnionTabView` pins its bar as an
    /// overlay and reserves no space, so every scroll surface has to leave room
    /// for it or the last card sits under the glass.
    static let screenBottom: CGFloat = UnionTabBarMetrics.height + 24
}

// MARK: - Radius
//
// Three values, three jobs. If a shape does not fit one of these jobs it
// should not be a rounded rectangle.

enum CivicRadius {
    /// 8 — controls: buttons, chips, icon wells, small toggles.
    static let control: CGFloat = 8
    /// 14 — surfaces: cards, grouped rows, inset panels.
    static let surface: CGFloat = 14
    /// 20 — hero: full-width media, the map, the detail hero.
    static let hero: CGFloat = 20
}

// MARK: - Type
//
// One family: San Francisco, the system face. Hierarchy comes from size and
// weight alone, not from a second typeface. Neither `.serif` nor `.rounded`
// appears here — a display face borrowed for "editorial" character reads as
// costume on a utility app, and SF at bold weights already carries a headline.

enum CivicType {
    /// Screen title. One per screen.
    static let display = Font.system(.largeTitle, weight: .bold)
    /// Event detail headline.
    static let headline = Font.system(.title2, weight: .bold)
    /// Card headline and detail section title.
    static let title = Font.system(.title3, weight: .semibold)
    /// Compact list-row headline.
    static let lede = Font.system(.headline, weight: .semibold)

    /// Running prose in the detail view.
    static let body = Font.body
    /// A claim or a quoted line inside prose.
    static let bodyStrong = Font.body.weight(.semibold)
    /// Summaries and supporting copy under a headline.
    static let secondary = Font.subheadline

    /// Dates, bodies, places, counts, sources.
    static let meta = Font.footnote
    /// The one piece of metadata that matters most on a surface: the date.
    static let metaStrong = Font.footnote.weight(.semibold)
    /// Urgency stamps and topic tags. The only uppercase in the app.
    static let label = Font.caption.weight(.bold)
}

// MARK: - Color
//
// Each hue means exactly one thing, everywhere:
//   red    urgency — a clock is running; this is also the app tint
//   amber  caution — important but not dated, cached data, verify-before-you-go
//   green  verified — sources, evidence, a live feed
//   blue   place — jurisdictions, maps, home area
// Informational content has no hue. It is ink and secondary text.

enum CivicStyle {
    /// Urgency. Deadlines, urgent events, the app tint.
    static let red = adaptive(
        light: UIColor(red: 0.72, green: 0.055, blue: 0.085, alpha: 1),
        dark: UIColor(red: 1.0, green: 0.29, blue: 0.32, alpha: 1)
    )
    /// Place. Jurisdictions, maps, home area.
    static let blue = adaptive(
        light: UIColor(red: 0.10, green: 0.36, blue: 0.66, alpha: 1),
        dark: UIColor(red: 0.38, green: 0.67, blue: 1.0, alpha: 1)
    )
    /// Verified. Sources, evidence, live feed.
    static let green = adaptive(
        light: UIColor(red: 0.06, green: 0.42, blue: 0.28, alpha: 1),
        dark: UIColor(red: 0.29, green: 0.78, blue: 0.56, alpha: 1)
    )
    /// Caution. Important-but-undated items, stale cache, confirm-before-you-go.
    static let amber = adaptive(
        light: UIColor(red: 0.76, green: 0.40, blue: 0.035, alpha: 1),
        dark: UIColor(red: 1.0, green: 0.65, blue: 0.25, alpha: 1)
    )

    /// Primary text.
    static let ink = Color(uiColor: .label)
    /// Screen background.
    static let paper = adaptive(
        light: UIColor(red: 0.973, green: 0.965, blue: 0.944, alpha: 1),
        dark: UIColor(red: 0.045, green: 0.05, blue: 0.06, alpha: 1)
    )
    /// Fill for raised surfaces only.
    static let card = adaptive(
        light: UIColor(red: 1.0, green: 0.997, blue: 0.988, alpha: 1),
        dark: UIColor(red: 0.085, green: 0.095, blue: 0.11, alpha: 1)
    )
    /// Fill for inset surfaces: grouped rows, panels, placeholders.
    static let inset = adaptive(
        light: UIColor(red: 0.945, green: 0.948, blue: 0.955, alpha: 1),
        dark: UIColor(red: 0.11, green: 0.12, blue: 0.14, alpha: 1)
    )
    /// The only stroke color in the app.
    static let hairline = Color.primary.opacity(0.075)
    /// The only shadow in the app, and only on `.raised`.
    static let shadow = Color.black.opacity(0.07)

    /// Urgency color. `.watch` deliberately has no hue: the low tier does not
    /// get to spend color. Use this instead of `CivicUrgency.color`.
    static func urgencyTint(_ urgency: CivicUrgency) -> Color {
        switch urgency {
        case .urgent: return red
        case .important: return amber
        case .watch: return Color.secondary
        }
    }

    /// Green means verified, so only a documented claim may wear it. A general
    /// risk or an advocacy position that renders green would make the app
    /// vouch for something it has not established.
    static func evidenceTint(_ classification: String) -> Color {
        switch classification {
        case "documented_local_impact": return green
        case "general_risk", "uncertain": return amber
        default: return Color.secondary
        }
    }

    private static func adaptive(light: UIColor, dark: UIColor) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}

// MARK: - Elevation
//
// Visual weight encodes priority. Most content is `.plain`. `.raised` is
// reserved for the primary tappable card on a screen — if two things on one
// screen are raised, one of them is wrong.

enum CivicElevation {
    /// No fill, no border, no shadow. The default for content.
    case plain
    /// Subtle fill + hairline. No shadow. Grouped rows, panels, placeholders.
    case inset
    /// Fill + hairline + one shadow. Primary tappable cards only.
    case raised
}

private struct CivicSurfaceModifier: ViewModifier {
    let elevation: CivicElevation
    let radius: CGFloat
    let tint: Color?

    @ViewBuilder
    func body(content: Content) -> some View {
        switch elevation {
        case .plain:
            content
        case .inset:
            content
                .background(fill, in: shape)
                .overlay { shape.strokeBorder(stroke, lineWidth: 1) }
        case .raised:
            content
                .background(CivicStyle.card, in: shape)
                .overlay { shape.strokeBorder(CivicStyle.hairline, lineWidth: 1) }
                .shadow(color: CivicStyle.shadow, radius: 10, y: 4)
        }
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: radius, style: .continuous)
    }

    private var fill: Color {
        guard let tint else { return CivicStyle.inset }
        return tint.opacity(0.08)
    }

    private var stroke: Color {
        guard let tint else { return CivicStyle.hairline }
        return tint.opacity(0.18)
    }
}

extension View {
    /// The only way to give a view a fill, a border, or a shadow.
    /// - Parameters:
    ///   - elevation: priority tier. Default `.inset`.
    ///   - radius: one of `CivicRadius`. Default `CivicRadius.surface`.
    ///   - tint: role color for a semantic inset (caution panel, verified
    ///     panel). `nil` gives the neutral inset fill. Ignored by `.raised`.
    func civicSurface(
        _ elevation: CivicElevation = .inset,
        radius: CGFloat = CivicRadius.surface,
        tint: Color? = nil
    ) -> some View {
        modifier(CivicSurfaceModifier(elevation: elevation, radius: radius, tint: tint))
    }

    func civicNavigationChrome() -> some View {
        toolbarBackground(CivicStyle.paper.opacity(0.94), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
    }

    /// For screens whose `CivicMasthead` already states the title. Printing the
    /// same string in the nav bar and again in serif 24pt below it is the
    /// duplication this app kept shipping; the masthead wins.
    /// `navigationTitle` stays set so a pushed screen's back button still reads
    /// the parent's name — only the visible inline title is suppressed.
    func civicMastheadChrome(_ title: String) -> some View {
        navigationTitle(title)
            .toolbar { ToolbarItem(placement: .principal) { EmptyView() } }
            .navigationBarTitleDisplayMode(.inline)
            .civicNavigationChrome()
    }
}

// MARK: - Formatting
//
// Every surface answers: what changed, who decided, when, what can I do, how
// do I know. These turn model values into those answers. No view should build
// a date string or clean a slug by hand.

enum CivicFormat {
    /// "Aug 12", or "Aug 12, 2027" when the year differs from now.
    static func day(_ date: Date, reference: Date = Date()) -> String {
        let calendar = Calendar.current
        if calendar.component(.year, from: date) == calendar.component(.year, from: reference) {
            return date.formatted(.dateTime.month(.abbreviated).day())
        }
        return date.formatted(.dateTime.month(.abbreviated).day().year())
    }

    /// "today", "tomorrow", "in 5 days". `nil` when the date is past or more
    /// than a week out — a countdown that far ahead is noise.
    static func countdown(to date: Date, from reference: Date = Date()) -> String? {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: reference)
        let end = calendar.startOfDay(for: date)
        guard let days = calendar.dateComponents([.day], from: start, to: end).day else { return nil }
        switch days {
        case 0: return "today"
        case 1: return "tomorrow"
        case 2...7: return "in \(days) days"
        default: return nil
        }
    }

    /// Who decides: the named body when there is a meeting, otherwise the
    /// jurisdiction. Never "decision-makers".
    static func decider(for event: CivicEvent) -> String {
        if let bodyName = event.meeting?.bodyName, !bodyName.isEmpty { return bodyName }
        return event.geographicScope
    }

    /// The date that matters, with the verb that makes it actionable:
    /// "Comment by Aug 12 · in 3 days", "Meets Aug 12", "Updated Jul 15".
    /// Always returns a real date — never "recently".
    static func when(for event: CivicEvent, now: Date = Date()) -> String {
        if let deadline = event.deadlineAt ?? event.meeting?.publicCommentDeadline {
            return phrase("Comment by", deadline, now)
        }
        if let meets = event.meeting?.startsAt {
            return phrase("Meets", meets, now)
        }
        if let starts = event.startsAt {
            return phrase("Starts", starts, now)
        }
        return "Updated \(day(event.updatedAt, reference: now))"
    }

    /// "Ypsilanti Township · Meets Aug 12 · in 3 days"
    static func dateline(for event: CivicEvent, now: Date = Date()) -> String {
        "\(decider(for: event)) · \(when(for: event, now: now))"
    }

    /// The regions the app can actually filter by. `areaLabel` is display copy
    /// and narrows nothing, so anything describing what the feed or a push
    /// covers must resolve through here, off `regionCode`.
    static let filterableRegions: [(code: String, name: String)] = [
        ("US", "Nationwide"),
        ("US-CA", "California"),
        ("US-FL", "Florida"),
        ("US-IL", "Illinois"),
        ("US-MI", "Michigan"),
        ("US-NY", "New York"),
        ("US-TX", "Texas"),
    ]

    /// "US-MI" -> "Michigan". Falls back to the raw code rather than inventing
    /// a name for a region the app cannot filter by.
    static func regionName(_ code: String) -> String {
        let trimmed = code.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard !trimmed.isEmpty else { return "any U.S. jurisdiction" }
        if let match = filterableRegions.first(where: { $0.code == trimmed }) { return match.name }
        return trimmed
    }

    /// "documented_local_impact" -> "Documented local impact". The API sends
    /// snake_case enum values; showing them raw leaks the schema at the user.
    static func evidenceLabel(_ classification: String, strength: String) -> String {
        let words = classification.replacingOccurrences(of: "_", with: " ")
        let name = words.isEmpty ? "Unclassified" : words.prefix(1).uppercased() + words.dropFirst()
        let detail = strength.replacingOccurrences(of: "_", with: " ")
        return detail.isEmpty ? name : "\(name) · \(detail) evidence"
    }

    /// The seal must match the claim's standing, not flatter it.
    static func evidenceSymbol(_ classification: String) -> String {
        switch classification {
        case "documented_local_impact": return "checkmark.seal"
        case "general_risk": return "exclamationmark.triangle"
        case "advocacy_position": return "quote.bubble"
        default: return "questionmark.circle"
        }
    }

    /// The evidence affordance: one publisher's name, or a count.
    /// `nil` when the event carries no sources — say nothing rather than
    /// imply verification that is not there.
    static func sources(for event: CivicEvent) -> String? {
        guard let first = event.sources.first else { return nil }
        if event.sources.count == 1 { return first.publisher }
        return "\(event.sources.count) sources"
    }

    /// "michigan-data-centers" -> "Michigan Data Centers".
    /// Prefer passing a real `CivicTopic.shortTitle` where one is in scope;
    /// this is the fallback so slugs never reach the screen as shouty
    /// machine text.
    static func topicName(_ slug: String) -> String {
        let words = slug.split(whereSeparator: { $0 == "-" || $0 == "_" })
        guard !words.isEmpty else { return slug }
        return words.map { word in
            let lower = word.lowercased()
            if acronyms.contains(lower) { return lower.uppercased() }
            return lower.prefix(1).uppercased() + lower.dropFirst()
        }
        .joined(separator: " ")
    }

    private static let acronyms: Set<String> = [
        "us", "usa", "ai", "alpr", "epa", "fbi", "fcc", "ftc", "dhs", "ice",
        "irs", "nsa", "pfas", "gis", "hoa", "led", "id",
    ]

    private static func phrase(_ verb: String, _ date: Date, _ now: Date) -> String {
        guard let countdown = countdown(to: date, from: now) else {
            return "\(verb) \(day(date, reference: now))"
        }
        return "\(verb) \(day(date, reference: now)) · \(countdown)"
    }
}

// MARK: - Rule

/// A 1pt hairline. The app's only divider. Use it to separate sections;
/// never as decoration.
struct CivicRule: View {
    var body: some View {
        Rectangle()
            .fill(CivicStyle.hairline)
            .frame(height: 1)
            .accessibilityHidden(true)
    }
}

// MARK: - Masthead

/// Screen header. `status` must carry a fact — a count, a date, a feed state.
/// If there is nothing true to put there, leave it nil rather than inventing
/// an eyebrow.
struct CivicMasthead: View {
    let title: String
    var standfirst: String? = nil
    var status: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.sm) {
            if let status, !status.isEmpty {
                Text(status)
                    .font(CivicType.metaStrong)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Text(title)
                .font(CivicType.display)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let standfirst, !standfirst.isEmpty {
                Text(standfirst)
                    .font(CivicType.secondary)
                    .foregroundStyle(.secondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            CivicRule()
                .padding(.top, CivicSpace.xs)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("masthead")
    }
}

// MARK: - Feed status

/// Where the data came from and when. This is metadata, not an announcement:
/// tier one, no fill, no border, no shadow.
struct CivicFeedStatus: View {
    let state: FeedState

    var body: some View {
        HStack(spacing: CivicSpace.sm) {
            Circle()
                .fill(tint)
                .frame(width: 6, height: 6)
                .accessibilityHidden(true)
            Text(state.label)
                .font(CivicType.meta)
                .foregroundStyle(textStyle)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("feed-status")
    }

    private var tint: Color {
        switch state {
        case .live: return CivicStyle.green
        case .loading: return Color.secondary
        case .stale, .offline: return CivicStyle.amber
        case .failed: return CivicStyle.red
        }
    }

    private var textStyle: Color {
        switch state {
        case .failed: return CivicStyle.red
        default: return Color.secondary
        }
    }
}

// MARK: - Urgency

/// An uppercase stamp, not a chip. No fill, no capsule, no border.
/// `.watch` renders in secondary ink because the low tier does not earn color.
struct UrgencyBadge: View {
    let urgency: CivicUrgency

    var body: some View {
        Text(urgency.title.uppercased())
            .font(CivicType.label)
            .tracking(0.9)
            .foregroundStyle(CivicStyle.urgencyTint(urgency))
            .lineLimit(1)
            .accessibilityLabel("\(urgency.title) priority")
    }
}

// MARK: - Event card

/// The primary surface in the app, and the only `.raised` one.
/// Reads top to bottom as: how urgent, what topic, what changed, who decides
/// and when, the gist, where the evidence is, what to do.
struct CivicEventCard: View {
    let event: CivicEvent
    /// A resolved topic name (`CivicTopic.shortTitle`) when the caller has the
    /// topic list. Falls back to a cleaned slug.
    var topicName: String? = nil

    private var topic: String { topicName ?? CivicFormat.topicName(event.topicSlug) }
    private var tint: Color { CivicStyle.urgencyTint(event.urgency) }
    private var actionLabel: String { event.primaryAction?.title ?? "Open the record" }

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            HStack(spacing: CivicSpace.sm) {
                UrgencyBadge(urgency: event.urgency)
                Spacer(minLength: CivicSpace.sm)
                Text(topic)
                    .font(CivicType.label)
                    .tracking(0.6)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Text(event.headline)
                .font(CivicType.title)
                .foregroundStyle(CivicStyle.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            Text(CivicFormat.dateline(for: event))
                .font(CivicType.metaStrong)
                .foregroundStyle(tint)
                .fixedSize(horizontal: false, vertical: true)

            Text(event.summary)
                .font(CivicType.secondary)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            CivicRule()

            footer
        }
        .padding(CivicSpace.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            ZStack(alignment: .leading) {
                CivicStyle.card
                if event.urgency == .urgent {
                    Rectangle()
                        .fill(CivicStyle.red)
                        .frame(width: 3)
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: CivicRadius.surface, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: CivicRadius.surface, style: .continuous)
                .strokeBorder(CivicStyle.hairline, lineWidth: 1)
        }
        .shadow(color: CivicStyle.shadow, radius: 10, y: 4)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }

    private var footer: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: CivicSpace.sm) {
                sourceMark
                Spacer(minLength: CivicSpace.sm)
                actionMark
            }
            HStack(spacing: CivicSpace.sm) {
                Spacer(minLength: 0)
                actionMark
            }
        }
    }

    @ViewBuilder
    private var sourceMark: some View {
        if let sources = CivicFormat.sources(for: event) {
            Label(sources, systemImage: "doc.text.magnifyingglass")
                .font(CivicType.meta)
                .foregroundStyle(CivicStyle.green)
                .lineLimit(1)
        }
    }

    private var actionMark: some View {
        HStack(spacing: CivicSpace.xs) {
            Text(actionLabel)
                .font(CivicType.metaStrong)
                .lineLimit(1)
            Image(systemName: "chevron.right")
                .font(.caption2.weight(.bold))
        }
        .foregroundStyle(CivicStyle.red)
    }
}

// MARK: - Event row

/// Compact list row for screens that show many events. Tier one: no fill, no
/// border, no shadow. Separate rows with `CivicRule`, not with cards.
struct CivicEventRow: View {
    let event: CivicEvent
    /// One extra fact worth the line — an audience, a place, an action.
    var detail: String? = nil

    var body: some View {
        HStack(alignment: .top, spacing: CivicSpace.md) {
            VStack(alignment: .leading, spacing: CivicSpace.xs) {
                if event.urgency != .watch {
                    UrgencyBadge(urgency: event.urgency)
                }
                Text(event.headline)
                    .font(CivicType.lede)
                    .foregroundStyle(CivicStyle.ink)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(CivicFormat.dateline(for: event))
                    .font(CivicType.meta)
                    .foregroundStyle(CivicStyle.urgencyTint(event.urgency))
                    .fixedSize(horizontal: false, vertical: true)
                if let detail, !detail.isEmpty {
                    Text(detail)
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(.tertiary)
                .padding(.top, CivicSpace.xs)
        }
        .padding(.vertical, CivicSpace.md)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Section label

/// Section header. `detail` should carry a count or a date, not a slogan.
struct SectionLabel: View {
    let title: String
    var detail: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.sm) {
            HStack(alignment: .firstTextBaseline, spacing: CivicSpace.md) {
                Text(title)
                    .font(CivicType.metaStrong)
                    .foregroundStyle(CivicStyle.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: CivicSpace.sm)
                if let detail, !detail.isEmpty {
                    Text(detail)
                        .font(CivicType.meta)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.trailing)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            CivicRule()
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Empty state

/// `message` must say what to do next. `actionTitle` + `action` turn that
/// instruction into a tap when the fix lives inside the app.
struct CivicEmptyState: View {
    let title: String
    let message: String
    let symbol: String
    var tint: Color = .secondary
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            Image(systemName: symbol)
                .font(.title2)
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(tint)
            Text(title)
                .font(CivicType.title)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(message)
                .font(CivicType.secondary)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
            if let actionTitle, let action, !actionTitle.isEmpty {
                Button(actionTitle, action: action)
                    .font(CivicType.metaStrong)
                    .buttonStyle(.bordered)
                    .tint(CivicStyle.red)
                    .accessibilityIdentifier("empty-state-action")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(CivicSpace.lg)
        .civicSurface(.inset)
        .accessibilityIdentifier("empty-state")
    }
}

// MARK: - Settings

/// Grouped rows. Inset, never raised.
struct SettingsGroup<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.sm) {
            Text(title)
                .font(CivicType.metaStrong)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            VStack(spacing: 0) { content }
                .padding(.horizontal, CivicSpace.lg)
                .padding(.vertical, CivicSpace.xs)
                .civicSurface(.inset)
        }
    }
}

struct SettingsRow: View {
    /// Leading inset for a `Divider` placed between rows inside a
    /// `SettingsGroup`, so the rule starts at the row's title.
    static let dividerInset: CGFloat = 40

    let symbol: String
    let tint: Color
    let title: String
    let detail: String
    var showsChevron = true

    var body: some View {
        HStack(spacing: CivicSpace.md) {
            Image(systemName: symbol)
                .font(.body)
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(tint)
                .frame(width: 28, alignment: .leading)
            VStack(alignment: .leading, spacing: CivicSpace.xs) {
                Text(title)
                    .font(CivicType.body)
                    .foregroundStyle(CivicStyle.ink)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .font(CivicType.meta)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: CivicSpace.sm)
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
            }
        }
        .contentShape(Rectangle())
        .frame(minHeight: 44)
        .padding(.vertical, CivicSpace.sm)
    }
}

// MARK: - Detail section

/// A block in the event detail article. Tier one — the rule above it does the
/// separating, not a card.
struct DetailSection<Content: View>: View {
    let title: String
    let showsRule: Bool
    @ViewBuilder let content: Content

    init(title: String, showsRule: Bool = true, @ViewBuilder content: () -> Content) {
        self.title = title
        self.showsRule = showsRule
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            if showsRule { CivicRule() }
            Text(title)
                .font(CivicType.title)
                .foregroundStyle(CivicStyle.ink)
                .fixedSize(horizontal: false, vertical: true)
            content
                .font(CivicType.body)
                .foregroundStyle(CivicStyle.ink)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Follow

/// The follow state, stated twice: word and mark. Red carries the untaken
/// action; once the topic is followed the state stops spending color.
/// The tappable wrapper is the caller's — this only draws the state.
struct FollowMark: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let isFollowing: Bool

    var body: some View {
        HStack(spacing: CivicSpace.xs) {
            Image(systemName: isFollowing ? "checkmark" : "plus")
                .font(.caption.weight(.bold))
            if !dynamicTypeSize.isAccessibilitySize {
                Text(isFollowing ? "Following" : "Follow")
                    .font(CivicType.metaStrong)
                    .lineLimit(1)
            }
        }
        .foregroundStyle(isFollowing ? Color.secondary : CivicStyle.red)
        .padding(.horizontal, CivicSpace.md)
        .padding(.vertical, CivicSpace.sm)
        .frame(minHeight: 44)
        .civicSurface(
            .inset,
            radius: CivicRadius.control,
            tint: isFollowing ? nil : CivicStyle.red
        )
        .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: isFollowing)
        .accessibilityHidden(true)
    }
}

// MARK: - Buttons

/// Press feedback for custom tappable surfaces (cards, rows, tiles).
struct CivicPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(reduceMotion ? 1 : (configuration.isPressed ? 0.99 : 1))
            .opacity(configuration.isPressed ? 0.82 : 1)
            .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: configuration.isPressed)
    }
}

/// The one filled button in the app. Flat red, no gradient, no shadow.
/// Use for a screen's single primary commitment.
struct CivicFilledButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(CivicType.bodyStrong)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 48)
            .padding(.horizontal, CivicSpace.lg)
            .background(
                CivicStyle.red.opacity(isEnabled ? 1 : 0.4),
                in: RoundedRectangle(cornerRadius: CivicRadius.control, style: .continuous)
            )
            .opacity(configuration.isPressed ? 0.86 : 1)
            .scaleEffect(reduceMotion ? 1 : (configuration.isPressed ? 0.99 : 1))
            .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: configuration.isPressed)
    }
}
