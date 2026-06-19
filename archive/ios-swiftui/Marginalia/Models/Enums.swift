import Foundation

enum ReadingStatus: String, Codable, CaseIterable, Identifiable {
    case reading, toRead, finished

    var id: String { rawValue }

    var label: String {
        switch self {
        case .reading: "Currently Reading"
        case .toRead: "Up Next"
        case .finished: "Finished"
        }
    }
}

enum BookFormat: String, Codable, CaseIterable, Identifiable {
    case hardcover, paperback, ebook, audiobook

    var id: String { rawValue }

    var label: String {
        switch self {
        case .hardcover: "Hardcover"
        case .paperback: "Paperback"
        case .ebook: "eBook"
        case .audiobook: "Audiobook"
        }
    }

    /// Audiobooks have no page count and count toward the streak at level 1.
    var isAudio: Bool { self == .audiobook }
}
