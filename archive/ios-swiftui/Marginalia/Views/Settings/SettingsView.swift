import SwiftUI

struct SettingsView: View {
    var body: some View {
        ContentUnavailableView(
            "Settings coming soon",
            systemImage: "gearshape.fill",
            description: Text("Genres, heatmap thresholds, tint, and Goodreads import land later.")
        )
        .navigationTitle("Settings")
    }
}
