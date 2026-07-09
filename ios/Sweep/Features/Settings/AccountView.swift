import SwiftUI

struct AccountView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.openURL) private var openURL
    @State private var errorMessage: String?
    @State private var isWorking = false

    var body: some View {
        NavigationStack {
            ZStack {
                SweepAtmosphere()
                ScrollView {
                    VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                        SectionHeader(
                            title: "Account",
                            subtitle: appModel.isSignedIn
                                ? (appModel.subscription.email ?? "Signed in")
                                : "Sign in to unlock Pro features"
                        )

                        statusCard

                        if !appModel.isSignedIn {
                            GlassPillButton(title: appModel.auth.isAuthenticating ? "Opening…" : "Sign in with Sweep", systemImage: "person.crop.circle.badge.checkmark", prominent: true) {
                                Task { await signIn() }
                            }
                            .disabled(appModel.auth.isAuthenticating)
                        } else {
                            if !appModel.isPro {
                                GlassPillButton(title: "Upgrade to Pro · \(AppConfig.proPriceLabel)", systemImage: "sparkles", prominent: true) {
                                    Task { await upgrade() }
                                }
                            }
                            GlassPillButton(title: "Refresh status", systemImage: "arrow.clockwise") {
                                Task { await appModel.refreshSubscription() }
                            }
                            GlassPillButton(title: "Sign out", systemImage: "rectangle.portrait.and.arrow.right") {
                                appModel.auth.signOut()
                                appModel.subscription = .signedOut
                            }
                        }

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.footnote)
                                .foregroundStyle(SweepColor.down)
                        }

                        features
                        footer
                    }
                    .padding(SweepSpacing.md)
                }
            }
            .navigationTitle("Account")
        }
    }

    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: appModel.isPro ? "checkmark.seal.fill" : "person.crop.circle")
                    .foregroundStyle(appModel.isPro ? SweepColor.up : SweepColor.accent)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(appModel.isPro ? "Sweep Pro" : (appModel.isSignedIn ? "Free plan" : "Guest"))
                        .font(.headline)
                    Text(appModel.isSignedIn ? "Synced with sweep-app.vercel.app" : "Browse free demos without an account")
                        .font(.caption)
                        .foregroundStyle(SweepColor.fgMuted)
                }
            }
            if appModel.isRefreshingSubscription || isWorking {
                ProgressView()
            }
        }
        .padding(16)
        .sweepGlass(shape: .rounded(SweepRadius.md))
    }

    private var features: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Included")
                .font(.headline)
            featureRow("Stock terminal & live charts", free: true)
            featureRow("Finance Top 25 demos", free: true)
            featureRow("Real estate metros & screen previews", free: true)
            featureRow("AI chat Q&A", free: false)
            featureRow("Full investor screens", free: false)
            featureRow("Interactive deal analyzer", free: false)
        }
        .padding(14)
        .sweepGlass(shape: .rounded(SweepRadius.md))
    }

    private func featureRow(_ title: String, free: Bool) -> some View {
        HStack {
            Image(systemName: free || appModel.isPro ? "checkmark.circle.fill" : "lock.fill")
                .foregroundStyle(free || appModel.isPro ? SweepColor.up : SweepColor.fgSubtle)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(SweepColor.fgMuted)
            Spacer()
            Text(free ? "Free" : "Pro")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(SweepColor.fgSubtle)
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("API")
                .font(.caption.weight(.semibold))
                .foregroundStyle(SweepColor.fgSubtle)
            Text(appModel.apiBaseURL.absoluteString)
                .font(.caption.monospaced())
                .foregroundStyle(SweepColor.fgMuted)
            Text("Built with iOS 26 Liquid Glass")
                .font(.caption2)
                .foregroundStyle(SweepColor.fgSubtle)
        }
    }

    private func signIn() async {
        errorMessage = nil
        isWorking = true
        defer { isWorking = false }
        do {
            _ = try await appModel.auth.signIn(baseURL: appModel.apiBaseURL)
            await appModel.refreshSubscription()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func upgrade() async {
        errorMessage = nil
        isWorking = true
        defer { isWorking = false }
        do {
            let url = try await appModel.api.createCheckout()
            openURL(url)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ContextChatSheet: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss

    let title: String
    let mode: String
    var seedPrompt: String = ""

    @State private var draft = ""
    @State private var reply: String?
    @State private var errorMessage: String?
    @State private var isSending = false

    var body: some View {
        NavigationStack {
            ZStack {
                SweepAtmosphere()
                VStack(spacing: 16) {
                    if !appModel.isPro {
                        ProGateBanner {
                            dismiss()
                            appModel.selectedTab = .account
                        }
                        .padding(.horizontal)
                    }

                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            if let reply {
                                Text(reply)
                                    .padding(14)
                                    .sweepGlass(shape: .rounded(SweepRadius.md))
                            } else {
                                Text("Ask a follow-up about this workspace. Requires Sweep Pro.")
                                    .foregroundStyle(SweepColor.fgMuted)
                                    .padding(.horizontal)
                            }
                            if let errorMessage {
                                Text(errorMessage).foregroundStyle(SweepColor.down).font(.footnote)
                            }
                        }
                        .padding()
                    }

                    HStack {
                        TextField("Ask anything…", text: $draft, axis: .vertical)
                            .lineLimit(1...4)
                            .padding(12)
                            .sweepGlass(interactive: true, shape: .rounded(SweepRadius.pill))
                        Button {
                            Task { await send() }
                        } label: {
                            Image(systemName: "arrow.up")
                                .frame(width: 42, height: 42)
                        }
                        .disabled(isSending || draft.isEmpty)
                        .modifier(SheetSendStyle())
                    }
                    .padding()
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .onAppear {
                if draft.isEmpty { draft = seedPrompt }
            }
        }
    }

    private func send() async {
        guard appModel.isPro else {
            errorMessage = "Sweep Pro required"
            return
        }
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        isSending = true
        errorMessage = nil
        defer { isSending = false }
        do {
            reply = try await appModel.api.chat(
                messages: [["role": "user", "content": text]],
                mode: mode
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct SheetSendStyle: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.buttonStyle(.glassProminent)
        } else {
            content.buttonStyle(.borderedProminent)
        }
    }
}
