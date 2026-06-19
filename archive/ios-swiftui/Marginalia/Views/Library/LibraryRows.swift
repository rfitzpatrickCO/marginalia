import SwiftUI

struct ReadingRow: View {
    let book: Book

    var body: some View {
        HStack(spacing: 12) {
            CoverView(book: book, width: 46)
            VStack(alignment: .leading, spacing: 5) {
                Text(book.title).font(.bookTitle).lineLimit(1)
                Text(book.author).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                ProgressView(value: book.progress).tint(.marginaliaTint)
                HStack {
                    if book.format.isAudio {
                        Label("Audiobook", systemImage: "headphones")
                    } else {
                        Text("\(book.currentPage) / \(book.pageCount)")
                    }
                    Spacer()
                    if !book.format.isAudio {
                        Text("\(Int(book.progress * 100))%")
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                .monospacedDigit()
            }
        }
        .padding(.vertical, 4)
    }
}

struct QueueRow: View {
    let book: Book

    var body: some View {
        HStack(spacing: 12) {
            CoverView(book: book, width: 38)
            VStack(alignment: .leading, spacing: 2) {
                Text(book.title).font(.body).lineLimit(1)
                Text(book.author).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
            }
        }
        .padding(.vertical, 2)
    }
}

struct FinishedRow: View {
    let book: Book

    var body: some View {
        HStack(spacing: 12) {
            CoverView(book: book, width: 38)
            VStack(alignment: .leading, spacing: 2) {
                Text(book.title).font(.body).lineLimit(1)
                Text(book.author).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
            if let rating = book.rating {
                StarRatingView(rating: rating).font(.caption2)
            }
        }
        .padding(.vertical, 2)
    }
}
