import SwiftUI
import SwiftData

struct LibraryView: View {
    @Query(sort: \Book.dateAdded, order: .reverse) private var books: [Book]
    @State private var query = ""

    private var filtered: [Book] {
        guard !query.isEmpty else { return books }
        return books.filter {
            $0.title.localizedCaseInsensitiveContains(query) ||
            $0.author.localizedCaseInsensitiveContains(query)
        }
    }

    private var reading: [Book] { filtered.filter { $0.status == .reading } }
    private var upNext: [Book] {
        filtered.filter { $0.status == .toRead }.sorted { $0.queueOrder < $1.queueOrder }
    }
    private var finished: [Book] {
        filtered.filter { $0.status == .finished }
            .sorted { ($0.finishDate ?? .distantPast) > ($1.finishDate ?? .distantPast) }
    }

    var body: some View {
        Group {
            if books.isEmpty {
                ContentUnavailableView(
                    "Your library is empty",
                    systemImage: "books.vertical",
                    description: Text("Tap + to log your first book.")
                )
            } else {
                List {
                    if !reading.isEmpty {
                        Section("Currently Reading") {
                            ForEach(reading) { book in
                                NavigationLink(value: book) { ReadingRow(book: book) }
                            }
                        }
                    }
                    if !upNext.isEmpty {
                        Section("Up Next") {
                            ForEach(upNext) { book in
                                NavigationLink(value: book) { QueueRow(book: book) }
                            }
                        }
                    }
                    if !finished.isEmpty {
                        Section("Finished") {
                            ForEach(finished) { book in
                                NavigationLink(value: book) { FinishedRow(book: book) }
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Library")
        .searchable(text: $query)
        .navigationDestination(for: Book.self) { BookDetailView(book: $0) }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    // Quick-log sheet arrives in step 3.
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Log a book")
            }
        }
    }
}

#Preview {
    NavigationStack { LibraryView() }
        .modelContainer(SampleData.previewContainer)
}
