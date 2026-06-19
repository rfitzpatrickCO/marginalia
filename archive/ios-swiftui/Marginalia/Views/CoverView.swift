import SwiftUI

/// Generated gradient cover keyed to a series "tone" with a serif title.
/// No network art — covers never break.
struct CoverView: View {
    let book: Book
    var width: CGFloat = 44

    private struct Tone { let base: Color; let edge: Color; let ink: Color }

    private var tone: Tone {
        switch book.tone {
        case "carr": Tone(base: Color(hex: 0x2a1715), edge: Color(hex: 0x120a09), ink: Color(hex: 0xe9c9a3))
        case "grey": Tone(base: Color(hex: 0x1b2228), edge: Color(hex: 0x0b0f12), ink: Color(hex: 0xcfd8de))
        case "thor": Tone(base: Color(hex: 0x13211c), edge: Color(hex: 0x080f0c), ink: Color(hex: 0xbcd6c6))
        default: Tone(base: Color(hex: 0x2a2a30), edge: Color(hex: 0x111114), ink: Color(hex: 0xe8e2d6))
        }
    }

    var body: some View {
        let t = tone
        let radius = width * 0.06
        RoundedRectangle(cornerRadius: radius, style: .continuous)
            .fill(LinearGradient(colors: [t.base, t.edge],
                                 startPoint: .topLeading, endPoint: .bottomTrailing))
            .overlay(alignment: .topLeading) {
                Text(book.title)
                    .font(.system(size: max(8, width * 0.15), weight: .semibold, design: .serif))
                    .foregroundStyle(t.ink)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                    .padding(width * 0.11)
            }
            .frame(width: width, height: width * 1.5)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(.white.opacity(0.08), lineWidth: 0.5)
            )
    }
}
