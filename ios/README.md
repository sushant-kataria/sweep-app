# Sweep iOS

Native SwiftUI companion for [Sweep](https://sweep-app.vercel.app) — AI for Finance, Data & Real Estate — built with **iOS 26 Liquid Glass**.

## Requirements

- macOS with **Xcode 26** (or later)
- iOS **26.0** deployment target (Liquid Glass APIs)
- Network access to your Sweep deployment (default: `https://sweep-app.vercel.app`)

## Open in Xcode

```bash
cd ios
open Sweep.xcodeproj
```

Select an iPhone simulator or device running iOS 26+, then **Run** (⌘R).

If you prefer XcodeGen:

```bash
brew install xcodegen
cd ios && xcodegen generate && open Sweep.xcodeproj
```

## What’s included

| Tab | Screens |
|-----|---------|
| **Home** | Brand landing, AI chat composer (Pro), mode pills |
| **Stock** | Free demo tickers, live session, price chart, fundamentals, Q&A sheet |
| **Finance** | Top-25 demo reports, metrics, analysis, stock screens catalog |
| **Real Estate** | Metro explorer, investor screens, deal analyzer |
| **Account** | WorkOS sign-in, subscription status, Pro upgrade |

## Liquid Glass

The app uses Apple’s iOS 26 APIs:

- `.glassEffect(.regular.interactive(), in:)` on custom chrome
- `GlassEffectContainer` for grouped morphing controls
- `.buttonStyle(.glass)` / `.glassProminent` on CTAs
- System `TabView` / `NavigationStack` / sheets pick up Liquid Glass automatically

On older SDKs (compile-time), `SweepGlass` falls back to `.ultraThinMaterial`.

## API base URL

Edit `Sweep/Services/AppConfig.swift` or set the scheme environment variable:

```
SWEEP_API_BASE_URL=https://your-deployment.vercel.app
```

## Auth

Sign-in uses `ASWebAuthenticationSession` against WorkOS AuthKit:

1. App opens `/login?returnPathname=/mobile/auth-complete`
2. After cookie session is set, `/mobile/auth-complete` mints a bearer token via `POST /api/mobile/token`
3. Browser redirects to `sweep://auth?token=…`
4. App stores the token in Keychain and sends `Authorization: Bearer …` on API calls

Set `SWEEP_MOBILE_TOKEN_SECRET` (or reuse `WORKOS_COOKIE_PASSWORD`) in the Next.js deployment so token minting works.

## Project layout

```
ios/
├── README.md
├── project.yml          # XcodeGen spec
├── Sweep.xcodeproj/
└── Sweep/
    ├── App/
    ├── Design/          # tokens + Liquid Glass helpers
    ├── Components/
    ├── Models/
    ├── Services/
    ├── Features/
    └── Resources/
```
