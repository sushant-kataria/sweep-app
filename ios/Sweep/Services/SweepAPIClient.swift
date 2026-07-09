import Foundation

enum SweepAPIError: LocalizedError {
    case invalidURL
    case http(Int, String)
    case decoding(Error)
    case message(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid API URL"
        case .http(let code, let body):
            if code == 401 { return "Sign in required" }
            if code == 402 { return body.isEmpty ? "Sweep Pro required" : body }
            return body.isEmpty ? "Request failed (\(code))" : body
        case .decoding(let error): "Could not read server response: \(error.localizedDescription)"
        case .message(let text): text
        }
    }
}

actor SweepAPIClient {
    let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
    }

    private func makeURL(path: String, query: [URLQueryItem] = []) throws -> URL {
        guard var components = URLComponents(url: baseURL.appending(path: path), resolvingAgainstBaseURL: false) else {
            throw SweepAPIError.invalidURL
        }
        if !query.isEmpty {
            components.queryItems = query
        }
        guard let url = components.url else { throw SweepAPIError.invalidURL }
        return url
    }

    private func authorizedRequest(url: URL, method: String = "GET", body: Data? = nil) -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if let token = TokenStore.load() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func send<T: Decodable>(_ request: URLRequest, as type: T.Type) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw SweepAPIError.message("Invalid response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? decoder.decode(APIErrorBody.self, from: data))?.error
                ?? String(data: data, encoding: .utf8)
                ?? ""
            throw SweepAPIError.http(http.statusCode, message)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw SweepAPIError.decoding(error)
        }
    }

    func fetchSubscription() async throws -> SubscriptionStatus {
        let url = try makeURL(path: "api/me/subscription")
        return try await send(authorizedRequest(url: url), as: SubscriptionStatus.self)
    }

    func searchCompanies(query: String, limit: Int = 12) async throws -> [CompanySearchResult] {
        let url = try makeURL(
            path: "api/companies/search",
            query: [
                URLQueryItem(name: "q", value: query),
                URLQueryItem(name: "limit", value: String(limit)),
            ]
        )
        return try await send(authorizedRequest(url: url), as: CompanySearchResponse.self).results
    }

    func fetchStockSession(ticker: String) async throws -> StockSession {
        let url = try makeURL(path: "api/stock/\(ticker.uppercased())/session")
        return try await send(authorizedRequest(url: url), as: StockSession.self)
    }

    func fetchFinanceReport(ticker: String) async throws -> FinanceSession {
        let url = try makeURL(path: "api/companies/\(ticker.uppercased())/report")
        return try await send(authorizedRequest(url: url), as: FinanceSession.self)
    }

    func fetchMarkets() async throws -> [MetroSummary] {
        let url = try makeURL(path: "api/real-estate/markets")
        return try await send(authorizedRequest(url: url), as: MarketsResponse.self).metros
    }

    func fetchRealEstateScreen(id: String, page: Int = 1, limit: Int = 25) async throws -> RealEstateScreenResults {
        let url = try makeURL(
            path: "api/real-estate/screens/\(id)",
            query: [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "limit", value: String(limit)),
            ]
        )
        return try await send(authorizedRequest(url: url), as: RealEstateScreenResults.self)
    }

    func fetchFinanceScreen(id: String, page: Int = 1, limit: Int = 25) async throws -> ScreenResultsPayload {
        let url = try makeURL(
            path: "api/finance/screens/\(id)",
            query: [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "limit", value: String(limit)),
            ]
        )
        return try await send(authorizedRequest(url: url), as: ScreenResultsPayload.self)
    }

    func fetchMortgageRate() async throws -> MortgageRateResponse {
        let url = try makeURL(path: "api/real-estate/mortgage-rate")
        return try await send(authorizedRequest(url: url), as: MortgageRateResponse.self)
    }

    func analyzeDeal(_ input: DealAnalyzerInput) async throws -> DealAnalyzerResult {
        let url = try makeURL(path: "api/real-estate/deal-analyzer")
        let body = try JSONEncoder().encode(input)
        return try await send(authorizedRequest(url: url, method: "POST", body: body), as: DealAnalyzerResult.self)
    }

    func createCheckout(returnPath: String = "/pricing") async throws -> URL {
        let url = try makeURL(
            path: "api/stripe/checkout",
            query: [URLQueryItem(name: "returnPath", value: returnPath)]
        )
        let response = try await send(authorizedRequest(url: url, method: "POST"), as: CheckoutResponse.self)
        guard let checkout = URL(string: response.url) else { throw SweepAPIError.invalidURL }
        return checkout
    }

    /// Streams AI chat. Returns concatenated assistant text for MVP.
    func chat(messages: [[String: String]], mode: String) async throws -> String {
        let url = try makeURL(path: "api/chat")
        let payload: [String: Any] = [
            "messages": messages,
            "mode": mode,
        ]
        let body = try JSONSerialization.data(withJSONObject: payload)
        let request = authorizedRequest(url: url, method: "POST", body: body)
        let (bytes, response) = try await session.bytes(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw SweepAPIError.message("Invalid response")
        }
        guard (200..<300).contains(http.statusCode) else {
            var data = Data()
            for try await byte in bytes {
                data.append(byte)
            }
            let message = (try? decoder.decode(APIErrorBody.self, from: data))?.error
                ?? String(data: data, encoding: .utf8)
                ?? ""
            throw SweepAPIError.http(http.statusCode, message)
        }

        var assembled = ""
        for try await line in bytes.lines {
            // AI SDK UI message stream — collect text deltas when present.
            if line.hasPrefix("0:"), let range = line.range(of: "0:") {
                let payload = String(line[range.upperBound...]).trimmingCharacters(in: .whitespaces)
                if let data = payload.data(using: .utf8),
                   let text = try? JSONDecoder().decode(String.self, from: data) {
                    assembled += text
                }
            } else if line.contains("\"type\":\"text-delta\"") || line.contains("\"delta\"") {
                if let data = line.data(using: .utf8),
                   let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    if let delta = obj["delta"] as? String {
                        assembled += delta
                    } else if let text = obj["textDelta"] as? String {
                        assembled += text
                    }
                }
            } else if !line.isEmpty, !line.hasPrefix("data:"), !line.hasPrefix(":") {
                // Fallback: accumulate plain text chunks
                if assembled.isEmpty { assembled = line } else { assembled += "\n" + line }
            }
        }
        if assembled.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "No response received. Make sure you are signed in with Sweep Pro."
        }
        return assembled
    }
}

private struct APIErrorBody: Codable {
    var error: String?
}
