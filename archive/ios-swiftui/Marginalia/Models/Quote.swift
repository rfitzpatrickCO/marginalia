import Foundation
import SwiftData

@Model
final class Quote {
    var id: UUID = UUID()
    var text: String = ""
    var page: Int?
    var createdAt: Date = Date.now
    var book: Book?

    init(text: String = "", page: Int? = nil, createdAt: Date = .now) {
        self.text = text
        self.page = page
        self.createdAt = createdAt
    }
}
