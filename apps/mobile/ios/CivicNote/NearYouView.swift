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

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                CivicMasthead(
                    eyebrow: "NEAR YOU",
                    title: "Local decisions are where leverage starts",
                    subtitle: "Hearings, contracts, filings, and votes for \(preferences.areaLabel.isEmpty ? "your selected area" : preferences.areaLabel)."
                )

                if localEvents.isEmpty {
                    CivicEmptyState(
                        title: "No local items yet",
                        message: "Update your home area in Settings or follow more topics.",
                        symbol: "mappin.slash.fill",
                        tint: CivicStyle.blue
                    )
                } else {
                    SectionLabel(title: "Local watch", detail: "\(localEvents.count) active")
                    ForEach(localEvents) { event in
                        NavigationLink(value: CivicRoute.event(event.key)) {
                            HStack(spacing: 14) {
                                Image(systemName: event.urgency == .urgent ? "building.columns.fill" : "doc.text.fill")
                                    .font(.title3.weight(.semibold))
                                    .symbolRenderingMode(.hierarchical)
                                    .foregroundStyle(event.urgency.color)
                                    .frame(width: 50, height: 54)
                                    .background(event.urgency.color.opacity(0.10), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(event.headline)
                                        .font(.headline)
                                        .foregroundStyle(CivicStyle.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Label(event.locationLabel, systemImage: "mappin")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(1)
                                }
                                Spacer(minLength: 4)
                                Image(systemName: "chevron.right")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.tertiary)
                            }
                            .padding(14)
                            .civicCard(radius: 21)
                        }
                        .buttonStyle(CivicPressStyle())
                    }
                }

                if !pins.isEmpty {
                    SectionLabel(title: "Meeting map", detail: "Confirmed coordinates")
                    Map(position: $position) {
                        ForEach(pins) { pin in
                            Annotation(pin.event.headline, coordinate: pin.coordinate) {
                                Image(systemName: "building.columns.fill")
                                    .font(.caption.weight(.bold))
                                    .symbolRenderingMode(.hierarchical)
                                    .foregroundStyle(.white)
                                    .frame(width: 38, height: 38)
                                    .background(CivicStyle.red.gradient, in: Circle())
                                    .overlay { Circle().stroke(.white.opacity(0.85), lineWidth: 2) }
                                    .shadow(color: Color.black.opacity(0.22), radius: 6, y: 3)
                            }
                        }
                    }
                    .mapStyle(.standard(elevation: .realistic, emphasis: .muted))
                    .frame(height: 280)
                    .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .stroke(CivicStyle.hairline, lineWidth: 1)
                    }
                    .shadow(color: CivicStyle.shadow, radius: 14, y: 6)
                    .accessibilityIdentifier("near-you-map")
                }
            }
            .padding(18)
            .padding(.bottom, 34)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Near You")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
    }
}

private struct EventMapPin: Identifiable {
    var id: String { event.key }
    let event: CivicEvent
    let coordinate: CLLocationCoordinate2D
}
