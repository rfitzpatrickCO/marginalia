import SwiftUI

struct BookDetailView: View {
    @Bindable var book: Book

    var body: some View {
        List {
            Section {
                HStack(alignment: .top, spacing: 16) {
                    CoverView(book: book, width: 92)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(book.title).font(.bookTitle)
                        Text(book.author).foregroundStyle(.secondary)
                        if let series = book.displaySeries {
                            Text(series).font(.caption).foregroundStyle(.secondary)
                        }
                        Label(book.format.label, systemImage: "doc.fill")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(.vertical, 4)
            }

            if book.status == .reading {
                Section("Progress") {
                    ProgressView(value: book.progress).tint(.marginaliaTint)
                    Text(book.format.isAudio
                         ? "Audiobook"
                         : "\(book.currentPage) of \(book.pageCount) pages · \(Int(book.progress * 100))%")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
            }

            if let rating = book.rating {
                Section("Rating") { StarRatingView(rating: rating) }
            }

            if !book.genres.isEmpty {
                Section("Genres") {
                    Text(book.genres.joined(separator: ", "))
                        .foregroundStyle(.secondary)
                }
            }

            if !book.notes.isEmpty {
                Section("Notes") { Text(book.notes) }
            }

            if !book.review.isEmpty {
                Section("Review") { Text(book.review) }
            }

            if let quotes = book.quotes, !quotes.isEmpty {
                Section("Quotes") {
                    ForEach(quotes.sorted { $0.createdAt < $1.createdAt }) { quote in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("“\(quote.text)”").italic()
                            if let page = quote.page {
                                Text("p. \(page)").font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
        .navigationTitle(book.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
