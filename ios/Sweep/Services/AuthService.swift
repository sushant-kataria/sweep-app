import AuthenticationServices
import Foundation
import Observation
import UIKit

@Observable
@MainActor
final class AuthService: NSObject {
    var isAuthenticating = false
    var lastError: String?

    private var session: ASWebAuthenticationSession?

    func signIn(baseURL: URL) async throws -> String {
        isAuthenticating = true
        lastError = nil
        defer { isAuthenticating = false }

        let returnPath = "/mobile/auth-complete"
        var components = URLComponents(url: baseURL.appending(path: "login"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "returnPathname", value: returnPath)]
        guard let loginURL = components.url else {
            throw SweepAPIError.invalidURL
        }

        let callbackURL: URL = try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: loginURL,
                callbackURLScheme: AppConfig.callbackScheme
            ) { url, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let url else {
                    continuation.resume(throwing: SweepAPIError.message("Sign-in cancelled"))
                    return
                }
                continuation.resume(returning: url)
            }
            session.prefersEphemeralWebBrowserSession = false
            session.presentationContextProvider = self
            self.session = session
            if !session.start() {
                continuation.resume(throwing: SweepAPIError.message("Could not start sign-in session"))
            }
        }

        let componentsOut = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)
        if let error = componentsOut?.queryItems?.first(where: { $0.name == "error" })?.value {
            throw SweepAPIError.message(error)
        }
        guard let token = componentsOut?.queryItems?.first(where: { $0.name == "token" })?.value,
              !token.isEmpty else {
            throw SweepAPIError.message("Missing access token from auth callback")
        }
        TokenStore.save(token)
        return token
    }

    func signOut() {
        TokenStore.delete()
    }
}

extension AuthService: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        #if os(iOS)
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow) ?? scenes.first?.windows.first {
            return window
        }
        return ASPresentationAnchor()
        #else
        return ASPresentationAnchor()
        #endif
    }
}
