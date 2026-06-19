import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            NavigationStack { LibraryView() }
                .tabItem { Label("Library", systemImage: "books.vertical.fill") }
            NavigationStack { StatsView() }
                .tabItem { Label("Stats", systemImage: "chart.bar.fill") }
            NavigationStack { SettingsView() }
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(.marginaliaTint)
    }
}

#Preview {
    RootView()
        .modelContainer(SampleData.previewContainer)
}
