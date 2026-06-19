import Foundation
import SwiftData

enum SampleData {
    /// Seeds the library on first launch (empty store only).
    static func seedIfNeeded(_ context: ModelContext) {
        let count = (try? context.fetchCount(FetchDescriptor<Book>())) ?? 0
        guard count == 0 else { return }
        for book in makeBooks() { context.insert(book) }
        try? context.save()
    }

    /// In-memory container for SwiftUI previews.
    @MainActor static let previewContainer: ModelContainer = {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try! ModelContainer(
            for: Book.self, Quote.self, ReadingSession.self,
            configurations: config
        )
        for book in makeBooks() { container.mainContext.insert(book) }
        return container
    }()

    static func makeBooks() -> [Book] {
        var result: [Book] = []

        let b1 = Book(title: "Red Sky Mourning", author: "Jack Carr", status: .reading)
        b1.series = "Terminal List"; b1.seriesNumber = 7; b1.tone = "carr"
        b1.pageCount = 528; b1.currentPage = 312; b1.format = .hardcover
        b1.genres = ["Thriller", "Military", "Action"]
        b1.startDate = date("2026-05-29"); b1.dateAdded = date("2026-05-29") ?? .now
        b1.notes = "Reece vs. an AI adversary — pacing is relentless. Picks up threads from In the Blood."
        b1.quotes = [
            Quote(text: "The mission dictated the man, and the man had long ago accepted what the mission required.",
                  page: 96, createdAt: date("2026-06-04") ?? .now),
            Quote(text: "Hesitation was a luxury paid for in blood.",
                  page: 211, createdAt: date("2026-06-08") ?? .now),
        ]
        result.append(b1)

        let b2 = Book(title: "The Chaos Agent", author: "Mark Greaney", status: .reading)
        b2.series = "Gray Man"; b2.seriesNumber = 13; b2.tone = "grey"
        b2.pageCount = 512; b2.currentPage = 88; b2.format = .audiobook
        b2.genres = ["Thriller", "Espionage", "Action"]
        b2.startDate = date("2026-06-06"); b2.dateAdded = date("2026-06-06") ?? .now
        b2.notes = "Court and Zoya again. Robotics/AI arms-race plot. Listening on the commute."
        result.append(b2)

        let b3 = Book(title: "The Terminal List", author: "Jack Carr", status: .finished)
        b3.series = "Terminal List"; b3.seriesNumber = 1; b3.tone = "carr"
        b3.pageCount = 416; b3.currentPage = 416; b3.format = .hardcover
        b3.rating = 4.5; b3.genres = ["Thriller", "Military"]
        b3.finishDate = date("2026-04-20"); b3.dateAdded = date("2026-03-30") ?? .now
        b3.review = "The one that started it. Brutal and propulsive — sets the bar for the series."
        result.append(b3)

        let b4 = Book(title: "Dark Sky", author: "C.J. Box", status: .finished)
        b4.series = "Joe Pickett"; b4.seriesNumber = 21; b4.tone = "thor"
        b4.pageCount = 368; b4.currentPage = 368; b4.format = .ebook
        b4.rating = 4.0; b4.genres = ["Thriller", "Mystery"]
        b4.finishDate = date("2026-05-12"); b4.dateAdded = date("2026-04-28") ?? .now
        result.append(b4)

        let b5 = Book(title: "Mind of a Spy", author: "Andrew Bailey", status: .toRead)
        b5.tone = "grey"; b5.pageCount = 384; b5.queueOrder = 0
        b5.genres = ["Espionage"]; b5.dateAdded = date("2026-06-01") ?? .now
        result.append(b5)

        let b6 = Book(title: "The Last Ranger", author: "Peter Heller", status: .toRead)
        b6.tone = "thor"; b6.pageCount = 304; b6.queueOrder = 1
        b6.genres = ["Mystery"]; b6.dateAdded = date("2026-06-03") ?? .now
        result.append(b6)

        return result
    }

    private static func date(_ s: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = .current
        return f.date(from: s)
    }
}
