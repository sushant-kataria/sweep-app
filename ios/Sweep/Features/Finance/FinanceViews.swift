import SwiftUI

struct FinanceRootView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                SweepAtmosphere()
                ScrollView {
                    VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                        SectionHeader(
                            title: "Finance workspace",
                            subtitle: "SEC balance sheets for Top 25 demos — Pro for live EDGAR."
                        )
                        demos
                        screens
                    }
                    .padding(SweepSpacing.md)
                }
            }
            .navigationTitle("Finance")
            .navigationDestination(for: FinanceRoute.self) { route in
                switch route {
                case .report(let ticker):
                    FinanceReportView(ticker: ticker)
                case .screen(let id, let title):
                    FinanceScreenResultsView(screenId: id, title: title)
                }
            }
        }
    }

    private var demos: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Demo filers")
                .font(.headline)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(Catalog.freeFinanceTickers.prefix(12), id: \.self) { ticker in
                    Button {
                        path.append(FinanceRoute.report(ticker))
                    } label: {
                        Text(ticker)
                            .font(.subheadline.weight(.semibold).monospaced())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .sweepGlass(interactive: true, shape: .rounded(SweepRadius.sm))
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(SweepColor.fg)
                }
            }
        }
    }

    private var screens: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Stock screens", subtitle: "Free preview shows 5 rows.")
            ForEach(Catalog.financeScreens, id: \.id) { screen in
                Button {
                    path.append(FinanceRoute.screen(screen.id, screen.title))
                } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(screen.title)
                            .font(.headline)
                            .foregroundStyle(SweepColor.fg)
                        Text(screen.description)
                            .font(.caption)
                            .foregroundStyle(SweepColor.fgMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .sweepGlass(interactive: true, shape: .rounded(SweepRadius.sm))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private enum FinanceRoute: Hashable {
    case report(String)
    case screen(String, String)
}

struct FinanceReportView: View {
    @Environment(AppModel.self) private var appModel
    let ticker: String

    @State private var session: FinanceSession?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var showChat = false

    var body: some View {
        ZStack {
            SweepAtmosphere()
            Group {
                if isLoading {
                    LoadingState(label: "Loading report…")
                } else if let errorMessage {
                    ErrorState(message: errorMessage) { Task { await load() } }
                } else if let session {
                    content(session)
                }
            }
        }
        .navigationTitle(ticker)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showChat = true } label: {
                    Image(systemName: "bubble.left.and.text.bubble.right")
                }
            }
        }
        .sheet(isPresented: $showChat) {
            ContextChatSheet(
                title: "Ask about \(ticker)",
                mode: "finance",
                seedPrompt: "What stands out on the \(ticker) balance sheet?"
            )
            .presentationDetents([.medium, .large])
        }
        .task { await load() }
    }

    private func content(_ session: FinanceSession) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(session.report.companyName)
                        .font(.title2.weight(.semibold))
                    Text("\(session.report.period) · \(session.report.source)")
                        .font(.subheadline)
                        .foregroundStyle(SweepColor.fgMuted)
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    MetricChip(label: "Total assets", value: Formatters.compactCurrency(session.metrics.totalAssets))
                    MetricChip(label: "Total equity", value: Formatters.compactCurrency(session.metrics.totalEquity))
                    MetricChip(label: "Current ratio", value: Formatters.ratio(session.metrics.currentRatio))
                    MetricChip(label: "Debt / equity", value: Formatters.ratio(session.metrics.debtToEquity))
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Analyst view")
                    Text(session.analysis.executiveSummary)
                        .foregroundStyle(SweepColor.fgMuted)
                    Text(session.analysis.analystVerdict)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(SweepColor.cyan)
                    BulletList(items: session.analysis.keyHighlights)
                }
                .padding(14)
                .sweepGlass(shape: .rounded(SweepRadius.md))

                balanceSection("Assets", section: session.report.assets)
                balanceSection("Liabilities", section: session.report.liabilities)
            }
            .padding(SweepSpacing.md)
        }
    }

    private func balanceSection(_ title: String, section: BalanceSheetSection) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            ForEach(section.current + section.nonCurrent) { line in
                HStack {
                    Text(line.label)
                        .foregroundStyle(SweepColor.fgMuted)
                    Spacer()
                    Text(Formatters.compactCurrency(line.value))
                        .monospacedDigit()
                }
                .font(.subheadline)
            }
        }
        .padding(14)
        .sweepGlass(shape: .rounded(SweepRadius.md))
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            session = try await appModel.api.fetchFinanceReport(ticker: ticker)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct FinanceScreenResultsView: View {
    @Environment(AppModel.self) private var appModel
    let screenId: String
    let title: String

    @State private var payload: ScreenResultsPayload?
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
                } else if let payload {
                    List {
                        if payload.preview == true {
                            Section {
                                Text("Free preview — \(payload.rows.count) of \(payload.total) rows. Upgrade for full results.")
                                    .font(.footnote)
                                    .foregroundStyle(SweepColor.fgMuted)
                            }
                        }
                        Section(payload.title) {
                            ForEach(payload.rows) { row in
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(row.ticker).font(.headline.monospaced())
                                        Spacer()
                                        if let price = row.price {
                                            Text(Formatters.currency(price))
                                                .monospacedDigit()
                                        }
                                    }
                                    Text(row.companyName)
                                        .font(.caption)
                                        .foregroundStyle(SweepColor.fgMuted)
                                    HStack {
                                        if let pe = row.pe {
                                            Text("P/E \(Formatters.ratio(pe))")
                                        }
                                        if let change = row.changePct {
                                            Text(Formatters.percent(change))
                                                .foregroundStyle(change >= 0 ? SweepColor.up : SweepColor.down)
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
        .navigationTitle(title)
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            payload = try await appModel.api.fetchFinanceScreen(id: screenId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
