import SwiftUI

enum SweepColor {
    static let bg = Color(red: 0.02, green: 0.02, blue: 0.024) // #050506
    static let bg2 = Color(red: 0.043, green: 0.043, blue: 0.051) // #0b0b0d
    static let surface = Color.white.opacity(0.08)
    static let border = Color.white.opacity(0.13)
    static let borderStrong = Color.white.opacity(0.28)
    static let fg = Color(red: 0.929, green: 0.929, blue: 0.929) // #ededed
    static let fgMuted = Color(red: 0.639, green: 0.639, blue: 0.639) // #a3a3a3
    static let fgSubtle = Color(red: 0.451, green: 0.451, blue: 0.451) // #737373
    static let accent = Color(red: 0.39, green: 0.40, blue: 0.95) // indigo-ish
    static let up = Color(red: 0.29, green: 0.87, blue: 0.50) // #4ade80
    static let down = Color(red: 0.97, green: 0.44, blue: 0.44) // #f87171
    static let cyan = Color(red: 0.055, green: 0.647, blue: 0.914)
    static let pink = Color(red: 0.925, green: 0.345, blue: 0.60)
}

enum SweepSpacing {
    static let xs: CGFloat = 6
    static let sm: CGFloat = 10
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

enum SweepRadius {
    static let sm: CGFloat = 12
    static let md: CGFloat = 18
    static let lg: CGFloat = 28
    static let pill: CGFloat = 999
}
