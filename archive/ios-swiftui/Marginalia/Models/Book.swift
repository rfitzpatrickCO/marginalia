import Foundation
import SwiftData

@Model
final class Book {
    // All attributes carry defaults and relationships are optional so the
    // schema stays CloudKit-compatible.
    var id: UUID = UUID()
    var title: String = ""
    var author: String = ""
    var series: String?
    var seriesNumber: Int?
    var status: ReadingStatus = ReadingStatus.toRead
    var pageCount: Int = 0
    var currentPage: Int = 0
    var rating: Double?            // 0…5, half-steps
    var format: BookFormat = BookFormat.hardcover
    var genres: [String] = []
    var language: String = "English"
    var isbn: String?
    var coverUrl: String?
    var tone: String?             // generated-cover tone key (carr / grey / thor)
    var notes: String = ""
    var review: String = ""
    var startDate: Date?
    var finishDate: Date?
    var rereadCount: Int = 0
    var dateAdded: Date = Date.now
    var queueOrder: Int = 0       // position within the Up Next queue

    @Relationship(deleteRule: .cascade, inverse: \Quote.book)
    var quotes: [Quote]? = []

    @Relationship(deleteRule: .cascade, inverse: \ReadingSession.book)
    var sessions: [ReadingSession]? = []

    init(title: String = "", author: String = "", status: ReadingStatus = .toRead) {
        self.title = title
        self.author = author
        self.status = status
    }

    var progress: Double {
        pageCount > 0 ? Double(currentPage) / Double(pageCount) : 0
    }

    var displaySeries: String? {
        guard let series else { return nil }
        if let n = seriesNumber { return "\(series) #\(n)" }
        return series
    }
}
