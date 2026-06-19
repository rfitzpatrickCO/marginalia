import SwiftUI

extension Font {
    /// Book titles — system serif (New York), echoing Apple Books.
    static let bookTitle = Font.system(.title3, design: .serif).weight(.semibold)
}

extension Color {
    /// Global accent. Mirrors the "Tint" asset; defaults to system blue.
    static let marginaliaTint = Color("Tint")

    init(hex: UInt) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255,
            opacity: 1
        )
    }
}

enum Heat {
    /// Maps a heat level (0 = empty, 1…4) to its color.
    static func color(level: Int) -> Color {
        switch level {
        case 1: Color("Heat1")
        case 2: Color("Heat2")
        case 3: Color("Heat3")
        case 4: Color("Heat4")
        default: Color(.tertiarySystemFill)
        }
    }
}
