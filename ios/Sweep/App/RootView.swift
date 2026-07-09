import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var appModel

    var body: some View {
        @Bindable var model = appModel
        TabView(selection: $model.selectedTab) {
            Tab(AppTab.home.title, systemImage: AppTab.home.systemImage, value: .home) {
                HomeView()
            }
            Tab(AppTab.stock.title, systemImage: AppTab.stock.systemImage, value: .stock) {
                StockRootView()
            }
            Tab(AppTab.finance.title, systemImage: AppTab.finance.systemImage, value: .finance) {
                FinanceRootView()
            }
            Tab(AppTab.realEstate.title, systemImage: AppTab.realEstate.systemImage, value: .realEstate) {
                RealEstateRootView()
            }
            Tab(AppTab.account.title, systemImage: AppTab.account.systemImage, value: .account) {
                AccountView()
            }
        }
        .tint(SweepColor.accent)
    }
}

#Preview {
    RootView()
        .environment(AppModel())
}
