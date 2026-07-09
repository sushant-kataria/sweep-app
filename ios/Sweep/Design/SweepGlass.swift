import SwiftUI

/// Liquid Glass helpers with a material fallback when the iOS 26 SDK APIs
/// are unavailable at compile time (older Xcode). Prefer system TabView /
/// NavigationStack / sheets — they adopt Liquid Glass automatically on iOS 26.
enum SweepGlass {
    static var isLiquidGlassAvailable: Bool {
        if #available(iOS 26.0, *) { return true }
        return false
    }
}

extension View {
    /// Applies Apple Liquid Glass when available; otherwise ultra-thin material.
    @ViewBuilder
    func sweepGlass(
        interactive: Bool = false,
        shape: SweepGlassShape = .capsule
    ) -> some View {
        if #available(iOS 26.0, *) {
            self.modifier(LiquidGlassModifier(interactive: interactive, shape: shape))
        } else {
            self.modifier(FallbackGlassModifier(shape: shape))
        }
    }

    /// Groups glass children so they can morph / share sampling (iOS 26+).
    @ViewBuilder
    func sweepGlassContainer<Content: View>(
        @ViewBuilder content: () -> Content
    ) -> some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer {
                content()
            }
        } else {
            content()
        }
    }
}

enum SweepGlassShape {
    case capsule
    case rounded(CGFloat)
    case circle
}

@available(iOS 26.0, *)
private struct LiquidGlassModifier: ViewModifier {
    let interactive: Bool
    let shape: SweepGlassShape

    func body(content: Content) -> some View {
        switch shape {
        case .capsule:
            apply(content, in: Capsule())
        case .rounded(let radius):
            apply(content, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
        case .circle:
            apply(content, in: Circle())
        }
    }

    @ViewBuilder
    private func apply<S: Shape>(_ content: Content, in shape: S) -> some View {
        if interactive {
            content.glassEffect(.regular.interactive(), in: shape)
        } else {
            content.glassEffect(.regular, in: shape)
        }
    }
}

private struct FallbackGlassModifier: ViewModifier {
    let shape: SweepGlassShape

    func body(content: Content) -> some View {
        content
            .background {
                fallbackFill
            }
    }

    @ViewBuilder
    private var fallbackFill: some View {
        switch shape {
        case .capsule:
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay { Capsule().strokeBorder(SweepColor.border, lineWidth: 0.75) }
        case .rounded(let radius):
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(SweepColor.border, lineWidth: 0.75)
                }
        case .circle:
            Circle()
                .fill(.ultraThinMaterial)
                .overlay { Circle().strokeBorder(SweepColor.border, lineWidth: 0.75) }
        }
    }
}

/// Atmospheric wallpaper — soft orbs behind glass chrome (mirrors web liquid glass backdrop).
struct SweepAtmosphere: View {
    var body: some View {
        ZStack {
            SweepColor.bg.ignoresSafeArea()
            Circle()
                .fill(SweepColor.accent.opacity(0.28))
                .frame(width: 280, height: 280)
                .blur(radius: 80)
                .offset(x: -120, y: -220)
            Circle()
                .fill(SweepColor.cyan.opacity(0.22))
                .frame(width: 260, height: 260)
                .blur(radius: 90)
                .offset(x: 140, y: -80)
            Circle()
                .fill(SweepColor.pink.opacity(0.16))
                .frame(width: 300, height: 300)
                .blur(radius: 100)
                .offset(x: 40, y: 320)
        }
        .allowsHitTesting(false)
    }
}
