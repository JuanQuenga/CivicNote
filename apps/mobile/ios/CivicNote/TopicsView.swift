import SwiftUI
import UIKit

struct TopicsView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore

    private let columns = [GridItem(.adaptive(minimum: 154), spacing: 12)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                CivicMasthead(
                    eyebrow: "CHOOSE YOUR WATCHLIST",
                    title: "Follow the issues you care about",
                    subtitle: "Your feed and alerts adapt to these choices. Change them anytime."
                )
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(repository.topics) { topic in
                        TopicTile(topic: topic, isFollowing: preferences.topicSlugs.contains(topic.id)) {
                            if preferences.topicSlugs.contains(topic.id) {
                                preferences.topicSlugs.remove(topic.id)
                            } else {
                                preferences.topicSlugs.insert(topic.id)
                            }
                            UISelectionFeedbackGenerator().selectionChanged()
                        }
                    }
                }
                Text("CivicNote does not infer your politics. You choose what to follow, and every alert should lead back to evidence and an accountable decision-maker.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(18)
            .padding(.bottom, 28)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Topics")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct TopicTile: View {
    let topic: CivicTopic
    let isFollowing: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Image(systemName: topic.symbol)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(topic.tint)
                        .frame(width: 44, height: 44)
                        .background(topic.tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 13))
                    Spacer()
                    Image(systemName: isFollowing ? "checkmark.circle.fill" : "plus.circle")
                        .font(.title3)
                        .foregroundStyle(isFollowing ? CivicStyle.red : .secondary)
                }
                Text(topic.title)
                    .font(.headline)
                    .foregroundStyle(CivicStyle.ink)
                    .multilineTextAlignment(.leading)
                Text(topic.summary)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(4)
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, minHeight: 178, alignment: .topLeading)
            .padding(16)
            .background(CivicStyle.card, in: RoundedRectangle(cornerRadius: 24))
            .overlay {
                RoundedRectangle(cornerRadius: 24)
                    .stroke(isFollowing ? CivicStyle.red.opacity(0.34) : Color.primary.opacity(0.06), lineWidth: isFollowing ? 1.5 : 1)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(topic.title), \(isFollowing ? "following" : "not followed")")
        .accessibilityIdentifier("topic-\(topic.id)")
    }
}
