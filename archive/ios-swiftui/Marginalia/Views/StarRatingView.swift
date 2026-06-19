import SwiftUI

/// Read-only half-star rating display. (Interactive editing lands in step 2.)
struct StarRatingView: View {
    let rating: Double

    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...5, id: \.self) { i in
                Image(systemName: symbol(for: i))
                    .foregroundStyle(Color.marginaliaTint)
            }
        }
        .accessibilityLabel("\(rating, specifier: "%.1f") out of 5 stars")
    }

    private func symbol(for index: Int) -> String {
        let d = Double(index)
        if rating >= d { return "star.fill" }
        if rating >= d - 0.5 { return "star.leadinghalf.filled" }
        return "star"
    }
}
