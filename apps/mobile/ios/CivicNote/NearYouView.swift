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
            VStack(alignment: .leading, spacing: 16) {
                CivicMasthead(
                    eyebrow: "NEAR YOU",
                    title: "Local decisions are where leverage starts",
                    subtitle: "Hearings, contracts, filings, and votes for \(preferences.areaLabel.isEmpty ? "your selected area" : preferences.areaLabel)."
                )

                if localEvents.isEmpty {
                    ContentUnavailableView("No local items yet", systemImage: "mappin.slash", description: Text("Update your home area in Settings or follow more topics."))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 28)
                        .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 24))
                } else {
                    SectionLabel(title: "Local watch", detail: "\(localEvents.count) active")
                    ForEach(localEvents) { event in
                        NavigationLink(value: CivicRoute.event(event.key)) {
                            HStack(spacing: 14) {
                                Image(systemName: "building.columns.fill")
                                    .font(.title3)
                                    .foregroundStyle(event.urgency.color)
                                    .frame(width: 54, height: 58)
                                    .background(event.urgency.color.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(event.headline).font(.headline).foregroundStyle(CivicStyle.ink)
                                    Text(event.locationLabel).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.tertiary)
                            }
                            .padding(14)
                            .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 21))
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !pins.isEmpty {
                    SectionLabel(title: "Meeting map", detail: "Only confirmed coordinates")
                    Map(position: $position) {
                        ForEach(pins) { pin in
                            Annotation(pin.event.headline, coordinate: pin.coordinate) {
                                Image(systemName: "building.columns.fill")
                                    .font(.caption.bold())
                                    .foregroundStyle(.white)
                                    .frame(width: 34, height: 34)
                                    .background(CivicStyle.red, in: Circle())
                            }
                        }
                    }
                    .mapStyle(.standard(elevation: .realistic, emphasis: .muted))
                    .frame(height: 280)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
                    .accessibilityIdentifier("near-you-map")
                }
            }
            .padding(18)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Near You")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct EventMapPin: Identifiable {
    var id: String { event.key }
    let event: CivicEvent
    let coordinate: CLLocationCoordinate2D
}
