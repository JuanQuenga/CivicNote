import MapKit
import SwiftUI

struct NearYouView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore
    @State private var position: MapCameraPosition = .automatic

    private var localEvents: [CivicEvent] { repository.filteredEvents }
    private var pins: [EventMapPin] {
        localEvents.compactMap { event in
            guard let latitude = event.meeting?.latitude, let longitude = event.meeting?.longitude else { return nil }
            return EventMapPin(event: event, coordinate: CLLocationCoordinate2D(latitude: latitude, longitude: longitude))
        }
    }

    /// The area the feed is filtered to. The label the reader chose, else the
    /// region code, else nothing.
    private var areaName: String {
        let label = preferences.areaLabel.trimmingCharacters(in: .whitespacesAndNewlines)
        if !label.isEmpty { return label }
        return preferences.regionCode.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var countLabel: String {
        localEvents.count == 1 ? "1 item" : "\(localEvents.count) items"
    }

    private var pinLabel: String {
        pins.count == 1 ? "1 address" : "\(pins.count) addresses"
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: CivicSpace.xl) {
                CivicMasthead(
                    title: "Near You",
                    status: areaName.isEmpty ? "No home area set" : areaName
                )

                CivicFeedStatus(state: repository.state)

                if localEvents.isEmpty {
                    emptyArea
                } else {
                    eventList
                    if !pins.isEmpty { mapSection }
                    homeAreaRow
                }
            }
            .padding(.horizontal, CivicSpace.gutter)
            .padding(.top, CivicSpace.md)
            .padding(.bottom, CivicSpace.screenBottom)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .civicMastheadChrome("Near You")
    }

    private var eventList: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(title: "Local decisions", detail: countLabel)
            ForEach(localEvents) { event in
                VStack(alignment: .leading, spacing: 0) {
                    NavigationLink(value: CivicRoute.event(event.key)) {
                        CivicEventRow(event: event, detail: event.locationLabel)
                    }
                    .buttonStyle(CivicPressStyle())
                    CivicRule()
                }
            }
        }
    }

    private var mapSection: some View {
        VStack(alignment: .leading, spacing: CivicSpace.md) {
            SectionLabel(title: "Meeting locations", detail: pinLabel)
            map
            Text("Addresses come from the meeting notice. Confirm the room and start time before you go.")
                .font(CivicType.meta)
                .foregroundStyle(CivicStyle.amber)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var map: some View {
        Map(position: $position) {
            ForEach(pins) { pin in
                Annotation(pin.event.headline, coordinate: pin.coordinate) {
                    Image(systemName: "building.columns.fill")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(CivicSpace.sm)
                        .background(CivicStyle.urgencyTint(pin.event.urgency), in: Circle())
                }
            }
        }
        .mapStyle(.standard(elevation: .flat, emphasis: .muted))
        .frame(height: 240)
        .clipShape(RoundedRectangle(cornerRadius: CivicRadius.hero, style: .continuous))
        .civicSurface(.inset, radius: CivicRadius.hero)
        .accessibilityIdentifier("near-you-map")
    }

    /// The always-visible way to change what "near you" means.
    private var homeAreaRow: some View {
        NavigationLink(value: CivicRoute.regionEditor) {
            SettingsRow(
                symbol: "mappin.and.ellipse",
                tint: CivicStyle.blue,
                title: areaName.isEmpty ? "Set your home area" : areaName,
                detail: "Filters every tab to one state, or nationwide."
            )
        }
        .buttonStyle(CivicPressStyle())
        .padding(.horizontal, CivicSpace.lg)
        .civicSurface(.inset)
        .accessibilityIdentifier("near-you-home-area")
    }

    /// Nothing to show. The fix is one tap away, not an explanation.
    private var emptyArea: some View {
        VStack(alignment: .leading, spacing: CivicSpace.lg) {
            CivicEmptyState(
                title: areaName.isEmpty ? "Set a home area" : "No items for \(areaName)",
                message: areaName.isEmpty
                    ? "Pick a state or region. CivicNote then lists the meetings, contracts, and votes recorded there."
                    : "Pick a wider region, or follow another topic under Topics.",
                symbol: "mappin.and.ellipse",
                tint: CivicStyle.blue
            )
            NavigationLink(value: CivicRoute.regionEditor) {
                Text(areaName.isEmpty ? "Choose a home area" : "Change home area")
            }
            .buttonStyle(CivicFilledButtonStyle())
            .accessibilityIdentifier("near-you-home-area")
        }
    }
}

private struct EventMapPin: Identifiable {
    var id: String { event.key }
    let event: CivicEvent
    let coordinate: CLLocationCoordinate2D
}
