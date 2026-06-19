import SwiftUI
import SwiftData

@main
struct MarginaliaApp: App {
    let container: ModelContainer

    init() {
        do {
            // Local SwiftData store for now. The models are CloudKit-safe, so
            // enabling iCloud sync later is a matter of adding the iCloud
            // entitlement + container — no model changes required.
            container = try ModelContainer(for: Book.self, Quote.self, ReadingSession.self)
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
        SampleData.seedIfNeeded(container.mainContext)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(container)
    }
}
