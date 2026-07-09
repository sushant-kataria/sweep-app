import SwiftUI

struct RealEstateRootView: View {
    @Environment(AppModel.self) private var appModel
    @State private var path = NavigationPath()
    @State private var metros: [MetroSummary] = []
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                SweepAtmosphere()
                Group {
                    if isLoading {
                        LoadingState(label: "Loading markets…")
                    } else if let errorMessage {
                        ErrorState(message: errorMessage) { Task { await load() } }
                    } else {
                        ScrollView {
                            VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                                SectionHeader(
                                    title: "Real estate",
                                    subtitle: "30 US metros · investor screens · deal analyzer"
                                )
                                screens
                                dealAnalyzerLink
                                metrosList
                            }
                            .padding(SweepSpacing.md)
                        }
                    }
                }
            }
            .navigationTitle("Real Estate")
            .navigationDestination(for: RealEstateRoute.self) { route in
                switch route {
                case .screen(let id):
                    if let meta = Catalog.realEstateScreens.first(where: { $0.id == id }) {
                        RealEstateScreenView(screen: meta)
                    }
                case .dealAnalyzer:
                    DealAnalyzerView()
                case .metro(let slug):
                    MetroDetailView(slug: slug, metros: metros)
                }
            }
            .task { await load() }
        }
    }

    private var screens: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Investor screens")
                .font(.headline)
            ForEach(Catalog.realEstateScreens) { screen in
                Button {
                    path.append(RealEstateRoute.screen(screen.id))
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(screen.title).font(.headline)
                            Spacer()
                            Text(screen.category)
                                .font(.caption2.weight(.semibold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .sweepGlass(shape: .capsule)
                        }
                        Text(screen.description)
                            .font(.caption)
                            .foregroundStyle(SweepColor.fgMuted)
                    }
                    .foregroundStyle(SweepColor.fg)
                    .padding(14)
                    .sweepGlass(interactive: true, shape: .rounded(SweepRadius.sm))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var dealAnalyzerLink: some View {
        Button {
            path.append(RealEstateRoute.dealAnalyzer)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Deal analyzer")
                        .font(.headline)
                    Text("Mortgage-rate aware cash-flow model")
                        .font(.caption)
                        .foregroundStyle(SweepColor.fgMuted)
                }
                Spacer()
                Image(systemName: "function")
            }
            .foregroundStyle(SweepColor.fg)
            .padding(14)
            .sweepGlass(interactive: true, shape: .rounded(SweepRadius.md))
        }
        .buttonStyle(.plain)
    }

    private var metrosList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Metros")
                .font(.headline)
            ForEach(metros.prefix(20)) { metro in
                Button {
                    path.append(RealEstateRoute.metro(metro.slug))
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(metro.name)
                                .font(.subheadline.weight(.semibold))
                            Text("\(metro.zipCount) ZIPs · \(metro.stateCode)")
                                .font(.caption)
                                .foregroundStyle(SweepColor.fgSubtle)
                        }
                        Spacer()
                        if let price = metro.medianSalePrice {
                            Text(Formatters.compactCurrency(price))
                                .font(.subheadline.monospacedDigit())
                        }
                    }
                    .foregroundStyle(SweepColor.fg)
                    .padding(12)
                    .sweepGlass(shape: .rounded(SweepRadius.sm))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            metros = try await appModel.api.fetchMarkets()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private enum RealEstateRoute: Hashable {
    case screen(String)
    case dealAnalyzer
    case metro(String)
}

struct RealEstateScreenView: View {
    @Environment(AppModel.self) private var appModel
    let screen: RealEstateScreenMeta

    @State private var results: RealEstateScreenResults?
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        ZStack {
            SweepAtmosphere()
            Group {
                if isLoading {
                    LoadingState()
                } else if let errorMessage {
                    ErrorState(message: errorMessage) { Task { await load() } }
                } else if let results {
                    List {
                        Section {
                            Text(results.formula)
                                .font(.caption)
                                .foregroundStyle(SweepColor.fgMuted)
                            if results.preview == true {
                                Text("Free preview — upgrade for full results.")
                                    .font(.footnote)
                                    .foregroundStyle(SweepColor.cyan)
                            }
                        }
                        Section("Results") {
                            ForEach(results.rows) { row in
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(row.zip).font(.headline.monospaced())
                                        Spacer()
                                        if let score = row.dealScore {
                                            Text("Score \(Int(score))")
                                                .foregroundStyle(SweepColor.cyan)
                                        }
                                    }
                                    Text("\(row.city ?? "—"), \(row.stateCode) · \(row.metro)")
                                        .font(.caption)
                                        .foregroundStyle(SweepColor.fgMuted)
                                    HStack {
                                        if let price = row.medianSalePrice {
                                            Text(Formatters.compactCurrency(price))
                                        }
                                        if let yld = row.grossYield {
                                            Text(String(format: "%.1f%% yield", yld))
                                                .foregroundStyle(SweepColor.up)
                                        }
                                    }
                                    .font(.caption)
                                }
                                .listRowBackground(Color.clear)
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .navigationTitle(screen.title)
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            results = try await appModel.api.fetchRealEstateScreen(id: screen.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct MetroDetailView: View {
    let slug: String
    let metros: [MetroSummary]

    var body: some View {
        let metro = metros.first(where: { $0.slug == slug })
        ZStack {
            SweepAtmosphere()
            if let metro {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(metro.name)
                            .font(.largeTitle.weight(.bold))
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            MetricChip(label: "Median sale", value: metro.medianSalePrice.map(Formatters.compactCurrency) ?? "—")
                            MetricChip(label: "Median rent", value: metro.medianRent.map(Formatters.compactCurrency) ?? "—")
                            MetricChip(label: "Yield", value: metro.medianYield.map { String(format: "%.1f%%", $0) } ?? "—")
                            MetricChip(label: "DOM", value: metro.medianDom.map { "\(Int($0))d" } ?? "—")
                        }
                        if let yoy = metro.priceYoy {
                            MetricChip(
                                label: "Price YoY",
                                value: Formatters.percent(yoy),
                                tone: yoy >= 0 ? .up : .down
                            )
                        }
                        Text("\(metro.zipCount) ZIP markets tracked")
                            .foregroundStyle(SweepColor.fgMuted)
                    }
                    .padding(SweepSpacing.md)
                }
            } else {
                ErrorState(message: "Metro not found")
            }
        }
        .navigationTitle(metro?.stateCode ?? "Metro")
    }
}

struct DealAnalyzerView: View {
    @Environment(AppModel.self) private var appModel

    @State private var purchasePrice = 450_000.0
    @State private var downPaymentPct = 25.0
    @State private var monthlyRent = 3200.0
    @State private var monthlyExpenses = 800.0
    @State private var interestRate = 6.5
    @State private var result: DealAnalyzerResult?
    @State private var errorMessage: String?
    @State private var isRunning = false

    var body: some View {
        ZStack {
            SweepAtmosphere()
            ScrollView {
                VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                    SectionHeader(
                        title: "Deal analyzer",
                        subtitle: appModel.isPro ? "Interactive Pro model" : "Sign in with Pro to run live analysis"
                    )

                    field("Purchase price", value: $purchasePrice)
                    field("Down payment %", value: $downPaymentPct)
                    field("Monthly rent", value: $monthlyRent)
                    field("Monthly expenses", value: $monthlyExpenses)
                    field("Interest rate %", value: $interestRate)

                    GlassPillButton(title: isRunning ? "Running…" : "Analyze deal", systemImage: "play.fill", prominent: true) {
                        Task { await run() }
                    }
                    .disabled(isRunning)

                    if let errorMessage {
                        Text(errorMessage).foregroundStyle(SweepColor.down).font(.footnote)
                    }

                    if let result {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            MetricChip(label: "Cash flow / mo", value: Formatters.currency(result.monthlyCashFlow), tone: result.monthlyCashFlow >= 0 ? .up : .down)
                            MetricChip(label: "Cap rate", value: String(format: "%.2f%%", result.capRate))
                            MetricChip(label: "Cash on cash", value: String(format: "%.2f%%", result.cashOnCash))
                            MetricChip(label: "Deal score", value: String(format: "%.0f", result.dealScore))
                        }
                        Text("Rate source: \(result.mortgageRateSource)")
                            .font(.caption)
                            .foregroundStyle(SweepColor.fgSubtle)
                    }
                }
                .padding(SweepSpacing.md)
            }
        }
        .navigationTitle("Deal analyzer")
        .task {
            if let rate = try? await appModel.api.fetchMortgageRate() {
                interestRate = rate.rate
            }
        }
    }

    private func field(_ title: String, value: Binding<Double>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(SweepColor.fgSubtle)
            TextField(title, value: value, format: .number)
                .keyboardType(.decimalPad)
                .padding(12)
                .sweepGlass(shape: .rounded(SweepRadius.sm))
        }
    }

    private func run() async {
        guard appModel.isPro else {
            errorMessage = "Interactive deal analyzer requires Sweep Pro."
            appModel.selectedTab = .account
            return
        }
        isRunning = true
        errorMessage = nil
        defer { isRunning = false }
        do {
            result = try await appModel.api.analyzeDeal(
                DealAnalyzerInput(
                    purchasePrice: purchasePrice,
                    downPaymentPct: downPaymentPct,
                    interestRate: interestRate,
                    loanTermYears: 30,
                    monthlyRent: monthlyRent,
                    monthlyExpenses: monthlyExpenses
                )
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
