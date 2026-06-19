import SwiftUI

struct StatsView: View {
    var body: some View {
        ContentUnavailableView(
            "Stats coming soon",
            systemImage: "chart.bar.fill",
            description: Text("Reading totals, streaks, and the activity heatmap land in step 4–5.")
        )
        .navigationTitle("Stats")
    }
}
