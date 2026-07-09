import SwiftUI

struct HomeView: View {
    @Environment(AppModel.self) private var appModel
    @State private var draft = ""
    @State private var mode: ChatMode = .chat
    @State private var messages: [ChatBubble] = []
    @State private var isSending = false
    @State private var errorMessage: String?
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                SweepAtmosphere()
                ScrollView {
                    VStack(alignment: .leading, spacing: SweepSpacing.lg) {
                        hero
                        if !appModel.isPro {
                            ProGateBanner {
                                appModel.selectedTab = .account
                            }
                        }
                        if messages.isEmpty {
                            suggestions
                        } else {
                            transcript
                        }
                        if let errorMessage {
                            Text(errorMessage)
                                .font(.footnote)
                                .foregroundStyle(SweepColor.down)
                        }
                    }
                    .padding(.horizontal, SweepSpacing.md)
                    .padding(.top, SweepSpacing.sm)
                    .padding(.bottom, 120)
                }
                .scrollDismissesKeyboard(.interactively)

                VStack {
                    Spacer()
                    composer
                        .padding(.horizontal, SweepSpacing.md)
                        .padding(.bottom, SweepSpacing.sm)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("Sweep")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(SweepColor.fg)
                }
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sweep")
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(SweepColor.fg)
            Text(AppConfig.tagline)
                .font(.title3)
                .foregroundStyle(SweepColor.fgMuted)
            Text("Ask about stocks, filings, and real estate markets — with Liquid Glass chrome on iOS 26.")
                .font(.subheadline)
                .foregroundStyle(SweepColor.fgSubtle)
        }
        .padding(.top, 8)
    }

    private var suggestions: some View {
        sweepGlassContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Try asking", subtitle: "Free demos live in Stock, Finance, and Real Estate tabs.")
                FlowSuggestions(items: mode.suggestions) { text in
                    draft = text
                    Task { await send() }
                }
            }
        }
    }

    private var transcript: some View {
        LazyVStack(alignment: .leading, spacing: 12) {
            ForEach(messages) { message in
                HStack {
                    if message.role == .user { Spacer(minLength: 40) }
                    Text(message.text)
                        .font(.body)
                        .foregroundStyle(SweepColor.fg)
                        .padding(14)
                        .sweepGlass(
                            shape: .rounded(SweepRadius.md)
                        )
                    if message.role == .assistant { Spacer(minLength: 40) }
                }
            }
            if isSending {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.leading, 8)
            }
        }
    }

    private var composer: some View {
        VStack(spacing: 10) {
            modePicker
            HStack(spacing: 10) {
                TextField(mode.placeholder, text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .focused($focused)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .sweepGlass(interactive: true, shape: .rounded(SweepRadius.pill))

                Button {
                    Task { await send() }
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.headline.weight(.bold))
                        .frame(width: 44, height: 44)
                }
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
                .modifier(SendButtonGlass())
            }
        }
        .padding(10)
        .sweepGlass(shape: .rounded(SweepRadius.lg))
    }

    private var modePicker: some View {
        HStack(spacing: 8) {
            ForEach(ChatMode.allCases) { item in
                Button {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                        mode = item
                    }
                } label: {
                    Label(item.title, systemImage: item.systemImage)
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
                .foregroundStyle(mode == item ? SweepColor.fg : SweepColor.fgSubtle)
                .sweepGlass(interactive: mode == item, shape: .capsule)
            }
            Spacer(minLength: 0)
        }
    }

    private func send() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        guard appModel.isPro else {
            errorMessage = "AI chat requires Sweep Pro. Upgrade in Account."
            appModel.selectedTab = .account
            return
        }
        errorMessage = nil
        draft = ""
        messages.append(ChatBubble(role: .user, text: text))
        isSending = true
        defer { isSending = false }
        do {
            let history = messages.map { ["role": $0.role.rawValue, "content": $0.text] }
            let reply = try await appModel.api.chat(messages: history, mode: mode.rawValue)
            messages.append(ChatBubble(role: .assistant, text: reply))
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct SendButtonGlass: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.buttonStyle(.glassProminent)
        } else {
            content
                .buttonStyle(.plain)
                .foregroundStyle(.black)
                .background(Circle().fill(SweepColor.fg))
        }
    }
}

private struct FlowSuggestions: View {
    let items: [String]
    var onTap: (String) -> Void

    var body: some View {
        VStack(spacing: 10) {
            ForEach(items, id: \.self) { item in
                Button {
                    onTap(item)
                } label: {
                    HStack {
                        Text(item)
                            .foregroundStyle(SweepColor.fg)
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .foregroundStyle(SweepColor.fgSubtle)
                    }
                    .padding(14)
                    .sweepGlass(interactive: true, shape: .rounded(SweepRadius.sm))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct ChatBubble: Identifiable {
    enum Role: String { case user, assistant }
    let id = UUID()
    let role: Role
    let text: String
}

private enum ChatMode: String, CaseIterable, Identifiable {
    case chat, search, code
    var id: String { rawValue }
    var title: String {
        switch self {
        case .chat: "Chat"
        case .search: "Search"
        case .code: "Code"
        }
    }
    var systemImage: String {
        switch self {
        case .chat: "bubble.left"
        case .search: "magnifyingglass"
        case .code: "chevron.left.forwardslash.chevron.right"
        }
    }
    var placeholder: String {
        switch self {
        case .chat: "Ask anything…"
        case .search: "Search for information…"
        case .code: "Ask a coding question…"
        }
    }
    var suggestions: [String] {
        switch self {
        case .chat:
            ["Apple stock chart", "Walmart balance sheet", "Homes for sale in LA below $900k"]
        case .search:
            ["Latest developments in fusion energy", "India vs China GDP comparison"]
        case .code:
            ["Explain SwiftUI glassEffect", "Write a URLSession retry helper"]
        }
    }
}

#Preview {
    HomeView()
        .environment(AppModel())
}
