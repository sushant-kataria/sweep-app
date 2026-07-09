import Foundation

struct SubscriptionStatus: Codable, Equatable, Sendable {
    var signedIn: Bool
    var pro: Bool
    var email: String?
    var subscriptionStatus: String?
    var currentPeriodEnd: String?
    var isActivePro: Bool

    static let signedOut = SubscriptionStatus(
        signedIn: false,
        pro: false,
        email: nil,
        subscriptionStatus: nil,
        currentPeriodEnd: nil,
        isActivePro: false
    )
}

struct CompanySearchResult: Codable, Identifiable, Hashable, Sendable {
    var cik: String?
    var ticker: String
    var name: String
    var id: String { ticker }
}

struct CompanySearchResponse: Codable, Sendable {
    var results: [CompanySearchResult]
}

struct StockFundamentals: Codable, Sendable {
    var marketCap: String
    var peRatio: Double?
    var forwardPe: Double?
    var revenue: String
    var eps: Double?
    var dividendYield: Double?
    var beta: Double?
    var fiftyTwoWeekHigh: Double?
    var fiftyTwoWeekLow: Double?
    var avgVolume: String
}

struct StockAnalysis: Codable, Sendable {
    var executiveSummary: String
    var keyHighlights: [String]
    var valuationAssessment: String
    var momentumAssessment: String
    var strengths: [String]
    var riskFactors: [String]
    var watchItems: [String]
}

struct StockPeer: Codable, Identifiable, Sendable {
    var name: String
    var metrics: [String: FlexibleValue]
    var id: String { name }
}

struct PricePoint: Codable, Identifiable, Sendable {
    var label: String
    var value: Double
    var id: String { label }
}

struct StockSession: Codable, Sendable {
    var ticker: String
    var companyName: String
    var sector: String
    var lastPrice: Double
    var currency: String
    var priceHistory: [PricePoint]
    var fundamentals: StockFundamentals
    var peers: [StockPeer]
    var analysis: StockAnalysis
    var loadedAt: Double
    var liveData: Bool?
}

struct BalanceSheetLine: Codable, Identifiable, Sendable {
    var label: String
    var value: Double
    var id: String { label }
}

struct BalanceSheetSection: Codable, Sendable {
    var current: [BalanceSheetLine]
    var nonCurrent: [BalanceSheetLine]
}

struct BalanceSheetReport: Codable, Sendable {
    var type: String
    var ticker: String
    var companyName: String
    var period: String
    var currency: String
    var title: String
    var assets: BalanceSheetSection
    var liabilities: BalanceSheetSection
    var equity: [BalanceSheetLine]
    var source: String
    var dataSource: String?
    var sourceUrl: String?
    var sourceFileName: String?
}

struct FinanceMetrics: Codable, Sendable {
    var totalAssets: Double
    var totalLiabilities: Double
    var totalEquity: Double
    var currentAssets: Double
    var currentLiabilities: Double
    var nonCurrentAssets: Double?
    var nonCurrentLiabilities: Double?
    var cashAndEquivalents: Double?
    var totalDebt: Double?
    var netDebt: Double?
    var currentRatio: Double?
    var quickRatio: Double?
    var cashRatio: Double?
    var debtToEquity: Double?
    var debtToAssets: Double?
    var equityRatio: Double?
    var workingCapital: Double
    var balanceCheck: Double?
    var balanceCheckOk: Bool
}

struct FinanceAnalysis: Codable, Sendable {
    var executiveSummary: String
    var keyHighlights: [String]
    var liquidityAssessment: String
    var leverageAssessment: String
    var assetQualityNotes: String?
    var strengths: [String]
    var riskFactors: [String]
    var watchItems: [String]
    var analystVerdict: String
}

struct FinanceSession: Codable, Sendable {
    var report: BalanceSheetReport
    var metrics: FinanceMetrics
    var analysis: FinanceAnalysis
    var generatedAt: Double
    var parserVersion: Int?
}

struct CompanyReportResponse: Codable, Sendable {
    // Some routes return the session directly; others wrap it.
    var report: BalanceSheetReport?
    var metrics: FinanceMetrics?
    var analysis: FinanceAnalysis?
    var generatedAt: Double?

    func asSession() -> FinanceSession? {
        guard let report, let metrics, let analysis else { return nil }
        return FinanceSession(
            report: report,
            metrics: metrics,
            analysis: analysis,
            generatedAt: generatedAt ?? Date().timeIntervalSince1970 * 1000
        )
    }
}

struct MetroSummary: Codable, Identifiable, Hashable, Sendable {
    var slug: String
    var name: String
    var stateCode: String
    var zipCount: Int
    var medianSalePrice: Double?
    var medianRent: Double?
    var medianYield: Double?
    var medianDom: Double?
    var priceYoy: Double?
    var id: String { slug }
}

struct MarketsResponse: Codable, Sendable {
    var metros: [MetroSummary]
    var generatedAt: String?
    var source: String?
    var zipCount: Int?
    var metroCount: Int?
}

struct RealEstateScreenMeta: Identifiable, Hashable, Sendable {
    var id: String
    var title: String
    var description: String
    var formula: String
    var category: String
}

struct RealEstateScreenResultRow: Codable, Identifiable, Sendable {
    var zip: String
    var city: String?
    var metro: String
    var metroSlug: String
    var stateCode: String
    var medianSalePrice: Double?
    var estMonthlyRent: Double?
    var grossYield: Double?
    var medianDom: Double?
    var priceYoy: Double?
    var dealScore: Double?
    var signal: String?
    var id: String { zip }
}

struct RealEstateScreenColumn: Codable, Sendable {
    var id: String
    var label: String
    var align: String?
}

struct RealEstateScreenResults: Codable, Sendable {
    var screenId: String
    var title: String
    var description: String
    var formula: String
    var columns: [RealEstateScreenColumn]?
    var rows: [RealEstateScreenResultRow]
    var page: Int
    var limit: Int
    var total: Int
    var totalPages: Int
    var preview: Bool?
    var scanNote: String?
}

struct ScreenResultRow: Codable, Identifiable, Sendable {
    var ticker: String
    var companyName: String
    var price: Double?
    var pe: Double?
    var marketCap: Double?
    var volume: Double?
    var changePct: Double?
    var score: Double?
    var signal: String?
    var rsi: Double?
    var id: String { ticker }
}

struct ScreenResultsPayload: Codable, Sendable {
    var id: String
    var title: String
    var description: String
    var formula: String?
    var defaultQuery: String?
    var live: Bool?
    var total: Int
    var page: Int
    var limit: Int
    var totalPages: Int
    var query: String?
    var rows: [ScreenResultRow]
    var preview: Bool?
    var scanNote: String?
    var fallback: Bool?
}

struct DealAnalyzerInput: Codable, Sendable {
    var purchasePrice: Double
    var downPaymentPct: Double
    var interestRate: Double?
    var loanTermYears: Int?
    var monthlyRent: Double
    var monthlyExpenses: Double?
    var closingCostsPct: Double?
}

struct DealAnalyzerResult: Codable, Sendable {
    var purchasePrice: Double
    var downPayment: Double
    var loanAmount: Double
    var monthlyMortgage: Double
    var monthlyRent: Double
    var monthlyExpenses: Double
    var monthlyCashFlow: Double
    var annualCashFlow: Double
    var grossYield: Double
    var netYield: Double
    var capRate: Double
    var cashOnCash: Double
    var breakEvenRent: Double
    var dealScore: Double
    var mortgageRateSource: String
}

struct MortgageRateResponse: Codable, Sendable {
    var rate: Double
    var source: String?
}

struct CheckoutResponse: Codable, Sendable {
    var url: String
}

struct MobileTokenResponse: Codable, Sendable {
    var accessToken: String
    var tokenType: String?
    var expiresIn: Int?
}

/// JSON value that may be number or string (peer metrics).
enum FlexibleValue: Codable, Sendable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else {
            self = .null
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    var display: String {
        switch self {
        case .string(let value): value
        case .number(let value): value.formatted(.number.precision(.fractionLength(0...2)))
        case .bool(let value): value ? "Yes" : "No"
        case .null: "—"
        }
    }
}

enum Catalog {
    static let freeStockTickers = ["AAPL", "NVDA", "MSFT", "AMZN", "TSLA", "META", "GOOGL", "JPM"]
    static let freeFinanceTickers = [
        "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "BRK.B", "TSLA", "LLY", "AVGO",
        "JPM", "WMT", "V", "MA", "XOM", "UNH", "COST", "PG", "HD", "JNJ",
        "NFLX", "CRM", "AMD", "KO", "CVX",
    ]
    static let realEstateScreens: [RealEstateScreenMeta] = [
        .init(id: "high-yield", title: "High yield ZIPs", description: "ZIP codes with gross rental yield above their metro median.", formula: "Gross yield > metro median yield", category: "Income"),
        .init(id: "price-dip", title: "Price dip markets", description: "ZIPs where median sale price fell year-over-year — potential value entry.", formula: "Price YoY < 0%", category: "Value"),
        .init(id: "fast-movers", title: "Fast movers", description: "Low days-on-market ZIPs — homes selling quickly.", formula: "Median DOM < 30 days", category: "Momentum"),
        .init(id: "rising-inventory", title: "Rising inventory", description: "ZIPs with growing supply — more buyer leverage.", formula: "Inventory YoY > 10%", category: "Supply"),
        .init(id: "top-deals", title: "Top deal scores", description: "Highest composite deal scores across all tracked metros.", formula: "Deal score ≥ 60 (top tier)", category: "Composite"),
        .init(id: "affordable-entry", title: "Affordable entry", description: "Lower-priced ZIPs under $400K median — starter investor markets.", formula: "Median price < $400,000", category: "Value"),
    ]
    static let financeScreens: [(id: String, title: String, description: String)] = [
        ("magic-formula", "Magic Formula", "Joel Greenblatt-style value + quality screen"),
        ("garp-stocks", "GARP stocks", "Growth at a reasonable price"),
        ("rsi-oversold", "RSI oversold", "RSI mean-reversion candidates"),
        ("value-stocks", "Value stocks", "Undervalued names by classic metrics"),
        ("highest-dividend-yield", "Highest dividend yield", "Income-focused screen"),
        ("golden-crossover", "Golden crossover", "Trend confirmation screen"),
    ]
}
