import SwiftUI
import UIKit

struct TopicsView: View {
    @ObservedObject var repository: CivicRepositoryStore
    @ObservedObject var preferences: PreferencesStore

    private let columns = [GridItem(.adaptive(minimum: 158), spacing: 12)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                CivicMasthead(
                    eyebrow: "CHOOSE YOUR WATCHLIST",
                    title: "Follow the issues you care about",
                    subtitle: "Your feed and alerts adapt to these choices. Change them anytime."
                )
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(repository.topics) { topic in
                        TopicTile(topic: topic, isFollowing: preferences.topicSlugs.contains(topic.id)) {
                            withAnimation(.snappy(duration: 0.24)) {
                                if preferences.topicSlugs.contains(topic.id) {
                                    preferences.topicSlugs.remove(topic.id)
                                } else {
                                    preferences.topicSlugs.insert(topic.id)
                                }
                            }
                            UISelectionFeedbackGenerator().selectionChanged()
                        }
                    }
                }
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "hand.raised.fill")
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(CivicStyle.blue)
                    Text("CivicNote does not infer your politics. You choose what to follow, and every alert should lead back to evidence and an accountable decision-maker.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineSpacing(2)
                }
                .padding(15)
                .background(CivicStyle.blue.opacity(0.065), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .padding(18)
            .padding(.bottom, 34)
        }
        .background(CivicStyle.paper.ignoresSafeArea())
        .navigationTitle("Topics")
        .navigationBarTitleDisplayMode(.inline)
        .civicNavigationChrome()
    }
}

private struct TopicTile: View {
    let topic: CivicTopic
    let isFollowing: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 13) {
                HStack {
                    Image(systemName: topic.symbol)
                        .font(.title3.weight(.semibold))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(topic.tint)
                        .frame(width: 44, height: 44)
                        .background(topic.tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    Spacer(minLength: 8)
                    Image(systemName: isFollowing ? "checkmark.circle.fill" : "plus.circle")
                        .font(.title3.weight(.semibold))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(isFollowing ? CivicStyle.red : Color.secondary)
                        .symbolEffect(.bounce, value: isFollowing)
                }
                Text(topic.title)
                    .font(.headline)
                    .foregroundStyle(CivicStyle.ink)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(topic.summary)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineSpacing(2)
                    .lineLimit(5)
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, minHeight: 184, alignment: .topLeading)
            .padding(16)
            .background(
                isFollowing ? topic.tint.opacity(0.055) : CivicStyle.card,
                in: RoundedRectangle(cornerRadius: 23, style: .continuous)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 23, style: .continuous)
                    .stroke(isFollowing ? topic.tint.opacity(0.42) : CivicStyle.hairline, lineWidth: isFollowing ? 1.5 : 1)
            }
            .shadow(color: CivicStyle.shadow, radius: isFollowing ? 13 : 8, y: isFollowing ? 6 : 3)
        }
        .buttonStyle(CivicPressStyle())
        .accessibilityLabel("\(topic.title), \(isFollowing ? "following" : "not followed")")
        .accessibilityIdentifier("topic-\(topic.id)")
    }
}
