import SwiftUI

struct StockRootView: View {
    @Environment(AppModel.self) private var appModel
    @State private var path = NavigationPath()
    @State private var query = ""

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                SweepAtmosphere()
                ScrollView {
                    VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                        SectionHeader(
                            title: "Stock terminal",
                            subtitle: "Live charts and research notes. Free demos included."
                        )
                        searchField
                        freeDemos
                    }
                    .padding(SweepSpacing.md)
                }
            }
            .navigationTitle("Stock")
            .navigationDestination(for: String.self) { ticker in
                StockDetailView(ticker: ticker)
            }
        }
    }

    private var searchField: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(SweepColor.fgSubtle)
            TextField("Ticker (e.g. AAPL)", text: $query)
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .onSubmit(openQuery)
            Button("Open", action: openQuery)
                .fontWeight(.semibold)
        }
        .padding(14)
        .sweepGlass(interactive: true, shape: .rounded(SweepRadius.md))
    }

    private var freeDemos: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Free demos")
                .font(.headline)
                .foregroundStyle(SweepColor.fg)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(Catalog.freeStockTickers, id: \.self) { ticker in
                    Button {
                        path.append(ticker)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(ticker)
                                .font(.headline.monospaced())
                                .foregroundStyle(SweepColor.fg)
                            Text("Research profile")
                                .font(.caption)
                                .foregroundStyle(SweepColor.fgSubtle)
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

    private func openQuery() {
        let ticker = query.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard !ticker.isEmpty else { return }
        path.append(ticker)
    }
}

struct StockDetailView: View {
    @Environment(AppModel.self) private var appModel
    let ticker: String

    @State private var session: StockSession?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var showChat = false

    var body: some View {
        ZStack {
            SweepAtmosphere()
            Group {
                if isLoading {
                    LoadingState(label: "Loading \(ticker)…")
                } else if let errorMessage {
                    ErrorState(message: errorMessage) { Task { await load() } }
                } else if let session {
                    content(session)
                }
            }
        }
        .navigationTitle(ticker)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showChat = true
                } label: {
                    Image(systemName: "bubble.left.and.text.bubble.right")
                }
            }
        }
        .sheet(isPresented: $showChat) {
            ContextChatSheet(
                title: "Ask about \(ticker)",
                mode: "stock",
                seedPrompt: "Summarize the investment case for \(ticker)."
            )
            .presentationDetents([.medium, .large])
        }
        .task { await load() }
    }

    @ViewBuilder
    private func content(_ session: StockSession) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(session.companyName)
                        .font(.title2.weight(.semibold))
                    Text(session.sector)
                        .font(.subheadline)
                        .foregroundStyle(SweepColor.fgMuted)
                    Text(Formatters.currency(session.lastPrice, code: session.currency))
                        .font(.largeTitle.weight(.bold).monospacedDigit())
                    if session.liveData == true {
                        Text("Live market data")
                            .font(.caption)
                            .foregroundStyle(SweepColor.cyan)
                    }
                }

                SimpleLineChart(points: session.priceHistory)
                    .padding(12)
                    .sweepGlass(shape: .rounded(SweepRadius.md))

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    MetricChip(label: "Market cap", value: session.fundamentals.marketCap)
                    MetricChip(label: "P/E", value: Formatters.ratio(session.fundamentals.peRatio))
                    MetricChip(label: "EPS", value: Formatters.ratio(session.fundamentals.eps))
                    MetricChip(label: "Beta", value: Formatters.ratio(session.fundamentals.beta))
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Analysis")
                    Text(session.analysis.executiveSummary)
                        .font(.body)
                        .foregroundStyle(SweepColor.fgMuted)
                    BulletList(items: session.analysis.keyHighlights)
                }
                .padding(14)
                .sweepGlass(shape: .rounded(SweepRadius.md))
            }
            .padding(SweepSpacing.md)
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            session = try await appModel.api.fetchStockSession(ticker: ticker)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
