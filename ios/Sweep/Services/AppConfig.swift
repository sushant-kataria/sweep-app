import Foundation

enum AppConfig {
    /// Override with scheme env `SWEEP_API_BASE_URL` or edit this default.
    static var apiBaseURL: URL {
        if let raw = ProcessInfo.processInfo.environment["SWEEP_API_BASE_URL"],
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "https://sweep-app.vercel.app")!
    }

    static let appName = "Sweep"
    static let tagline = "AI for Finance, Data & Real Estate"
    static let proPriceLabel = "$19/mo"
    static let callbackScheme = "sweep"
}
