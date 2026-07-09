import Foundation
import Observation
import SwiftUI

@Observable
@MainActor
final class AppModel {
    var selectedTab: AppTab = .home
    var subscription = SubscriptionStatus.signedOut
    var isRefreshingSubscription = false
    var apiBaseURL: URL = AppConfig.apiBaseURL

    let auth = AuthService()
    let api: SweepAPIClient

    init() {
        self.api = SweepAPIClient(baseURL: AppConfig.apiBaseURL)
        Task { await refreshSubscription() }
    }

    func refreshSubscription() async {
        isRefreshingSubscription = true
        defer { isRefreshingSubscription = false }
        do {
            subscription = try await api.fetchSubscription()
        } catch {
            // Keep last known status; network may be offline at launch.
        }
    }

    var isPro: Bool { subscription.isActivePro || subscription.pro }
    var isSignedIn: Bool { subscription.signedIn }
}

enum AppTab: String, CaseIterable, Identifiable, Hashable {
    case home
    case stock
    case finance
    case realEstate
    case account

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: "Home"
        case .stock: "Stock"
        case .finance: "Finance"
        case .realEstate: "Real Estate"
        case .account: "Account"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "sparkles"
        case .stock: "chart.line.uptrend.xyaxis"
        case .finance: "building.columns"
        case .realEstate: "house.lodge"
        case .account: "person.crop.circle"
        }
    }
}
