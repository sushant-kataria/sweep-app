import SwiftUI

struct GlassPillButton: View {
    let title: String
    var systemImage: String? = nil
    var prominent: Bool = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .fontWeight(.semibold)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
        }
        .modifier(GlassButtonStyleModifier(prominent: prominent))
    }
}

private struct GlassButtonStyleModifier: ViewModifier {
    let prominent: Bool

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            if prominent {
                content.buttonStyle(.glassProminent)
            } else {
                content.buttonStyle(.glass)
            }
        } else {
            content
                .buttonStyle(.plain)
                .foregroundStyle(prominent ? Color.black : SweepColor.fg)
                .background {
                    Capsule()
                        .fill(prominent ? SweepColor.fg : Color.white.opacity(0.12))
                }
        }
    }
}

struct SectionHeader: View {
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(SweepColor.fg)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(SweepColor.fgMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct MetricChip: View {
    let label: String
    let value: String
    var tone: Tone = .neutral

    enum Tone { case neutral, up, down }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(SweepColor.fgSubtle)
            Text(value)
                .font(.headline.monospacedDigit())
                .foregroundStyle(color)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .sweepGlass(shape: .rounded(SweepRadius.sm))
    }

    private var color: Color {
        switch tone {
        case .neutral: SweepColor.fg
        case .up: SweepColor.up
        case .down: SweepColor.down
        }
    }
}

struct ProGateBanner: View {
    var message: String = "Sweep Pro unlocks AI chat, full screens, and live SEC reports."
    var onUpgrade: () -> Void

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: "sparkles")
                .foregroundStyle(SweepColor.accent)
            Text(message)
                .font(.footnote)
                .foregroundStyle(SweepColor.fgMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
            GlassPillButton(title: "Upgrade", systemImage: "arrow.up.right", prominent: true, action: onUpgrade)
        }
        .padding(14)
        .sweepGlass(shape: .rounded(SweepRadius.md))
    }
}

struct LoadingState: View {
    var label: String = "Loading…"

    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text(label)
                .font(.subheadline)
                .foregroundStyle(SweepColor.fgMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorState: View {
    let message: String
    var retry: (() -> Void)?

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(SweepColor.down)
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundStyle(SweepColor.fgMuted)
                .font(.subheadline)
            if let retry {
                GlassPillButton(title: "Try again", systemImage: "arrow.clockwise", action: retry)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct SimpleLineChart: View {
    let points: [PricePoint]

    var body: some View {
        GeometryReader { geo in
            let values = points.map(\.value)
            let minV = values.min() ?? 0
            let maxV = values.max() ?? 1
            let span = max(maxV - minV, 0.0001)
            Path { path in
                guard points.count > 1 else { return }
                for (index, point) in points.enumerated() {
                    let x = geo.size.width * CGFloat(index) / CGFloat(points.count - 1)
                    let y = geo.size.height * (1 - CGFloat((point.value - minV) / span))
                    if index == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(
                LinearGradient(colors: [SweepColor.cyan, SweepColor.accent], startPoint: .leading, endPoint: .trailing),
                style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round)
            )
        }
        .frame(height: 160)
    }
}

struct BulletList: View {
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 8) {
                    Circle()
                        .fill(SweepColor.accent)
                        .frame(width: 6, height: 6)
                        .padding(.top, 6)
                    Text(item)
                        .font(.subheadline)
                        .foregroundStyle(SweepColor.fgMuted)
                }
            }
        }
    }
}

struct Formatters {
    static func currency(_ value: Double, code: String = "USD") -> String {
        value.formatted(.currency(code: code).precision(.fractionLength(0...2)))
    }

    static func compactCurrency(_ value: Double) -> String {
        if abs(value) >= 1_000_000_000 {
            return String(format: "$%.2fB", value / 1_000_000_000)
        }
        if abs(value) >= 1_000_000 {
            return String(format: "$%.2fM", value / 1_000_000)
        }
        if abs(value) >= 1_000 {
            return String(format: "$%.1fK", value / 1_000)
        }
        return currency(value)
    }

    static func percent(_ value: Double, digits: Int = 1) -> String {
        (value / 100).formatted(.percent.precision(.fractionLength(digits)))
    }

    static func ratio(_ value: Double?) -> String {
        guard let value else { return "—" }
        return value.formatted(.number.precision(.fractionLength(2)))
    }
}
