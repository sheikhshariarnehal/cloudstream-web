# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Hls.js + TailwindCSS / Vanilla CSS
- **Backend**: Kotlin Ktor Headless Server & HLS Stream Proxy
- **Plugin Runtime**: DEX-to-JVM translation (`software.coley.dextranslator`) reusing the desktop plugin loader architecture

## Users

Streamers and media enthusiasts watching movies, TV series, and anime in web browsers across desktop, tablets, and mobile devices who want CloudStream's rich multi-provider ecosystem without requiring an Android device.

## Product Purpose

A high-performance, ad-free web edition of CloudStream offering full feature parity with the Android and Windows desktop applications: media catalog browsing, multi-provider parallel search, comprehensive media and episode views, cinema video player with adaptive HLS streaming, quality switching, audio/subtitle track selection, AniSkip intro skipping, watch history persistence, and dynamic repository plugin management.

## Positioning

An open, extensible web streaming client powered by a headless Kotlin Ktor engine that directly translates and executes native CloudStream `.cs3` plugins via DEX-to-JVM bytecode transformation, paired with an intelligent HLS proxy that transparently overcomes browser CORS and forbidden header limitations.

## Operating Context

A self-hosted or local instance (packaged as a Docker container or local background process) running on the user's system and accessed via modern web browsers (Chrome, Edge, Firefox, Safari). Communicates with CloudStream provider repositories (such as Nehal's Server) and upstream media hosts.

## Capabilities and Constraints

### Capabilities
- **Direct `.cs3` Plugin Execution**: Employs DEX-to-JVM bytecode transpilation (`software.coley.dextranslator`) to load standard `.cs3` packages directly into memory, inheriting complete compatibility with existing CloudStream provider repositories without rewriting scrapers in JavaScript.
- **Progressive Multi-Provider Search**: Uses Kotlin coroutines to query providers in parallel and streams results to the client progressively via Server-Sent Events (SSE).
- **Rich Media Catalog**: Dynamic shelf browsing (`getMainPage`), detailed media metadata, and season/episode navigation (`load`).
- **Stream Extraction & Proxying**: Resolves links (`loadLinks`) and rewrites HLS `.m3u8` playlists and `.ts` chunk segments on the fly, injecting required upstream headers (`Referer`, `User-Agent`) and attaching CORS headers (`Access-Control-Allow-Origin: *`).
- **Cinema Video Player**: Adaptive bitrate streaming (ABR) with `hls.js`, manual resolution selector, dual-audio selector, and custom subtitle engine supporting VTT/SRT styling and timing adjustments.
- **AniSkip Integration**: Queries AniSkip API for anime titles and provides interactive "Skip Opening" and "Skip Ending" buttons.
- **Local-First Client Storage**: Saves watch progress, resume points, bookmarks, and user preferences directly in browser IndexedDB.
- **Custom Repository Manager**: Full support for adding, refreshing, and managing custom `repo.json` provider repositories.

### Constraints
- **Browser Security Restrictions**: Browsers strictly enforce CORS and block client-side JavaScript from injecting protected request headers (`Referer`, `User-Agent`); all external scraping, extractor decryption, and media chunk streaming must route through the Ktor backend proxy.
- **Codec & Container Compatibility**: Browser playback depends on client HTML5 video capabilities (H.264/AAC over HLS/MP4 are supported natively; unsupported video formats require backend transcoding/remuxing or fallback handling).

## Brand Commitments

CloudStream visual language: Sleek dark cinema aesthetic (`#080B11` deep space canvas, `#111625` card surface, `#182033` popovers), high contrast text, clean typography (Inter / Outfit), fluid micro-animations, and responsive Netflix-style horizontal shelves.

## Evidence on Hand

- Android CloudStream codebase: [`cloudstream`](file:///d:/Poject/CloudStream/cloudstream)
- Windows Desktop application with DEX-to-JVM plugin loader: [`Windows desktop app`](file:///d:/Poject/CloudStream/Windows%20desktop%20app/src/jvmMain/kotlin/com/lagradost/cloudstream/desktop/plugins/DesktopPluginLoader.kt)
- User Repository: [`nehal-CloudStream/repo.json`](file:///d:/Poject/CloudStream/nehal-CloudStream/repo.json) featuring Netmirror, VegaMovies, Aniwatch, and BDIX FTPs.
- Architectural Blueprint: [`cloudstream-web/implementation_plan.md`](file:///d:/Poject/CloudStream/cloudstream-web/implementation_plan.md)

## Product Principles

1. **Zero-Friction Playback**: Every video stream must play reliably through automated HLS playlist rewriting and header proxying with zero CORS failures or 403 Forbidden errors.
2. **Native Ecosystem Compatibility**: Maintain 100% interoperability with existing CloudStream `.cs3` plugins and `repo.json` feeds using headless JVM translation rather than maintaining fragile JavaScript scraper ports.
3. **Responsive Cinema UX**: Deliver an immersive, high-framerate streaming interface that feels native on both large desktop displays (with keyboard shortcuts) and mobile/tablet touch screens.
4. **Local-First Privacy & Autonomy**: Keep user state (watch history, resume timestamps, bookmarks, plugin settings) in local IndexedDB storage on the client.

## Accessibility & Inclusion

- Complete keyboard navigation (`Space`/`K` for play/pause, `←`/`→` for seeking, `↑`/`↓` for volume, `F` for fullscreen, `M` for mute, `C` for subtitles).
- High-contrast text meeting WCAG AA standards against deep dark surfaces.
- Fully customizable subtitle rendering (font size, color, background contrast box, timing sync offset).
- Accessible focus rings and ARIA attributes for keyboard and TV remote navigation.
