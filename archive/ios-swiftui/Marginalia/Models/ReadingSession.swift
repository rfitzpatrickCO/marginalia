import Foundation
import SwiftData

@Model
final class ReadingSession {
    var id: UUID = UUID()
    var date: Date = Date.now
    var fromPage: Int = 0
    var toPage: Int = 0
    var pagesRead: Int = 0
    var book: Book?

    init(date: Date = .now, fromPage: Int = 0, toPage: Int = 0, pagesRead: Int = 0) {
        self.date = date
        self.fromPage = fromPage
        self.toPage = toPage
        self.pagesRead = pagesRead
    }
}
