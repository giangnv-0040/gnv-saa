# Screen: Login

## Screen Info

| Property           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Figma Frame ID** | 662:14387                                                          |
| **Figma Link**     | https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz |
| **Screen Group**   | Authentication                                                     |
| **Status**         | discovered                                                         |
| **Discovered At**  | 2026-05-11                                                         |
| **Last Updated**   | 2026-05-11                                                         |

---

## Description

Entry-point authentication screen for the SAA 2025 (Sun\* Awards) web application. It welcomes unauthenticated users, lets them switch the interface language, and authenticates them via a single Google OAuth sign-in button. Upon successful sign-in the user is forwarded to the application home (`/`).

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen                              | Trigger              | Condition                   |
| ------------------------------------------ | -------------------- | --------------------------- |
| (App launch / unauthenticated route guard) | Auto redirect        | No valid session token      |
| Dropdown-profile (`z4sCl3_Qtk`)            | Logout action        | User clicks "Logout"        |
| Dropdown-profile Admin (`54rekaCHG1`)      | Logout action        | Admin clicks "Logout"       |
| Error page - 403 (`T3e_iS9PCL`)            | Re-authenticate link | User needs to sign in again |

### Outgoing Navigations (To)

| Target Screen                     | Trigger Element                   | Node ID             | Confidence | Notes                                                       |
| --------------------------------- | --------------------------------- | ------------------- | ---------- | ----------------------------------------------------------- |
| Homepage SAA (`i87tDx10uM`)       | Button "LOGIN With Google"        | 662:14426           | high       | OAuth success redirects authenticated user to `/` (home)    |
| Dropdown-ngôn ngữ (`hUyaaugye2`)  | Language switcher button (header) | I662:14391;186:1696 | high       | Opens language dropdown overlay (vi/en/ja)                  |
| (Google OAuth consent — external) | Button "LOGIN With Google"        | 662:14426           | high       | External redirect to `accounts.google.com` before returning |

### Navigation Rules

- **Back behavior**: No back navigation (entry screen). Browser back from authenticated pages may also land here if session is cleared.
- **Deep link support**: Yes — `/login`
- **Auth required**: No — this is the unauthenticated entry point. Authenticated users hitting `/login` should be redirected to `/`.

---

## Component Schema

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (mms_A_Header)                                  │
│  [LOGO]                                  [Language ▾]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  Key Visual / Cover                     │
│           (mms_B.1_Key Visual - hero image)             │
│                                                         │
│        Bắt đầu hành trình của bạn cùng SAA 2025.        │
│              Đăng nhập để khám phá!                     │
│                                                         │
│         ┌─────────────────────────────────┐             │
│         │  LOGIN With Google     [G icon] │             │
│         └─────────────────────────────────┘             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   FOOTER:  Bản quyền thuộc về Sun* © 2025              │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
LoginScreen
├── KeyVisualBackground (Atom: image)         # mms_C_Keyvisual
├── Header (Organism)                         # mms_A_Header
│   ├── Logo (Atom)                           # mms_A.1_Logo / LOGO
│   └── LanguageSwitcher (Molecule)           # mms_A.2_Language → Dropdown-ngôn ngữ
├── Cover (Atom: rectangle overlay)
├── HeroSection (Organism)                    # mms_B_Bìa
│   ├── BrandKeyVisual (Atom: image)          # mms_B.1_Key Visual
│   └── CallToActionGroup (Molecule)          # Frame 550
│       ├── WelcomeText (Atom: text)          # mms_B.2_content
│       └── GoogleLoginButton (Molecule)      # mms_B.3_Login → Button-IC About
│           ├── ButtonLabel (Atom: "LOGIN With Google")
│           └── GoogleIcon (Atom)             # MM_MEDIA_Google
└── Footer (Organism)                         # mms_D_Footer
    └── CopyrightText (Atom)
```

### Main Components

| Component         | Type     | Node ID             | Description                                                                    | Reusable             |
| ----------------- | -------- | ------------------- | ------------------------------------------------------------------------------ | -------------------- |
| Header            | Organism | 662:14391           | Top bar with logo + language switcher (shared instance, componentId 186:1602)  | Yes                  |
| LanguageSwitcher  | Molecule | I662:14391;186:1696 | Language dropdown trigger (componentId 186:1692)                               | Yes                  |
| HeroSection       | Organism | 662:14393           | Hero block containing brand visual + CTA                                       | No (screen-specific) |
| WelcomeText       | Atom     | 662:14753           | Two-line Vietnamese welcome copy                                               | No                   |
| GoogleLoginButton | Molecule | 662:14426           | Primary OAuth CTA — yellow pill button with Google icon (componentId 186:1567) | Yes                  |
| Footer            | Organism | 662:14447           | Copyright footer (shared instance, componentId 342:1427)                       | Yes                  |

---

## Form Fields (If Applicable)

This screen has **no form fields**. Authentication is delegated to Google OAuth — credentials are never entered directly into the SAA application.

---

## API Mapping

### On Screen Load

| API                            | Method | Purpose                                              | Response Usage                                    |
| ------------------------------ | ------ | ---------------------------------------------------- | ------------------------------------------------- |
| `/api/auth/session` (Supabase) | GET    | Detect existing session and auto-redirect if present | If valid → redirect to `/`; else stay on `/login` |

### On User Action

| Action                    | API                                        | Method                    | Request Body                              | Response                                                     |
| ------------------------- | ------------------------------------------ | ------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Click "LOGIN With Google" | `/api/auth/signin/google` (Supabase OAuth) | POST (initiates redirect) | `{ provider: "google", redirectTo: "/" }` | 302 redirect to Google consent                               |
| Google OAuth callback     | `/api/auth/callback`                       | GET                       | `?code=...&state=...`                     | Exchanges code for session, sets auth cookie, then 302 → `/` |
| Change language           | `/api/i18n/locale` (or client-side cookie) | PUT (optional)            | `{ locale: "vi" \| "en" \| "ja" }`        | Persists user locale preference                              |

### Error Handling

| Error Code                  | Message                                           | UI Action                                  |
| --------------------------- | ------------------------------------------------- | ------------------------------------------ |
| 400 / OAuth `access_denied` | "Đăng nhập đã bị huỷ"                             | Show inline toast; remain on `/login`      |
| 401 / invalid session       | "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" | Clear session cookie, stay on screen       |
| 403 / domain not allowed    | "Email này không được phép truy cập SAA"          | Show error toast (Sun\* email-domain gate) |
| 500 / OAuth provider error  | "Không thể kết nối tới Google. Vui lòng thử lại." | Re-enable button, show retry toast         |
| Network failure             | "Lỗi mạng. Kiểm tra kết nối của bạn."             | Re-enable button                           |

---

## State Management

### Local State

| State                  | Type                 | Initial | Purpose                                                    |
| ---------------------- | -------------------- | ------- | ---------------------------------------------------------- |
| isAuthenticating       | boolean              | false   | Disable button + show spinner while redirecting to Google  |
| selectedLocale         | "vi" \| "en" \| "ja" | "vi"    | Currently displayed language (driven by i18n)              |
| isLanguageDropdownOpen | boolean              | false   | Controls visibility of language dropdown overlay           |
| oauthError             | string \| null       | null    | Error message from OAuth callback (read from query string) |

### Global State (If Applicable)

| State   | Store                | Read/Write            | Purpose                                            |
| ------- | -------------------- | --------------------- | -------------------------------------------------- |
| session | Supabase auth client | Write (post-callback) | Stores user session + JWT after successful OAuth   |
| user    | authStore (Zustand)  | Write (post-callback) | Cached current user profile for downstream screens |
| locale  | i18nStore            | Read/Write            | App-wide language preference                       |

---

## UI States

### Loading State

- Show spinner inside the Google login button; replace label text with a loader.
- Disable button to prevent double-click during redirect.
- Optionally show full-page skeleton while `/api/auth/session` is being checked on mount.

### Error State

- Toast notification near the top of the screen for OAuth/network failures.
- If redirected back from Google with `?error=...`, parse and display localized message.
- Button remains enabled (allow retry) after error display.

### Success State

- Brief loading state, then automatic redirect to Homepage SAA (`/`).
- No success toast on this screen — destination screen handles the welcome.

### Empty State

- Not applicable.

---

## Accessibility

| Requirement         | Implementation                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Focus management    | Auto-focus the Google login button on mount                                                                         |
| Keyboard navigation | Tab order: Logo → Language switcher → Login button → Footer                                                         |
| Screen reader       | `aria-label="Sign in with Google"` on the OAuth button; language switcher exposes current locale via `aria-current` |
| Error announcement  | OAuth errors rendered in a live region (`role="status"` or `role="alert"`)                                          |
| Color contrast      | Yellow button (#FFEA9E) with dark text (#00101A) — verify WCAG AA against background                                |
| Reduced motion      | Respect `prefers-reduced-motion` for any hero animations                                                            |

---

## Responsive Behavior

| Breakpoint          | Layout Changes                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Mobile (<768px)     | Stack key visual above CTA; button full-width with horizontal margin; reduce welcome text size |
| Tablet (768-1024px) | Centered content with max-width; key visual scales proportionally                              |
| Desktop (>1024px)   | Original Figma layout — key visual + CTA side-by-side over hero background                     |

---

## Analytics Events (Optional)

| Event          | Trigger                     | Properties                           |
| -------------- | --------------------------- | ------------------------------------ |
| screen_view    | On mount                    | `{ screen: "login" }`                |
| login_attempt  | Click Google button         | `{ method: "google" }`               |
| login_success  | OAuth callback success      | `{ user_id, provider: "google" }`    |
| login_error    | OAuth callback failure      | `{ error_code, provider: "google" }` |
| locale_changed | Language dropdown selection | `{ from, to }`                       |

---

## Design Tokens

| Token                | Value                                    | Usage                                   |
| -------------------- | ---------------------------------------- | --------------------------------------- |
| --color-cta          | rgba(255, 234, 158, 1)                   | Google login button background          |
| --color-text-primary | rgba(0, 16, 26, 1)                       | Button label & welcome text             |
| --radius-button      | 8px                                      | Button corners                          |
| --button-padding     | 16px 24px                                | Button inner spacing                    |
| --font-display       | Montserrat 700 / 22px / 28px line-height | Button label typography                 |
| --gap-login-cta      | 40px                                     | Gap between text block and login button |

---

## Implementation Notes

### Dependencies

- Auth: Supabase Auth (Google OAuth provider)
- HTTP client: Supabase JS SDK + native `fetch`
- i18n: next-intl (or equivalent) for the language switcher
- Routing: Next.js App Router (`app/login/page.tsx`, `app/auth/callback/route.ts`)

### Special Considerations

- Sun\* email-domain gating MUST be enforced server-side in the OAuth callback (Principle IV — OWASP). Do not rely on the client.
- The OAuth callback route MUST set the Supabase session cookie with `httpOnly`, `secure`, `sameSite=lax`.
- Pre-render `/login` as a Server Component; only the button + language switcher need client interactivity.
- The language switcher is a shared component instance — reuse the global LanguageSwitcher built from `Dropdown-ngôn ngữ` (`hUyaaugye2`).
- Cache the hero key-visual asset aggressively; it is the largest payload on this screen.

---

## Analysis Metadata

| Property            | Value                                      |
| ------------------- | ------------------------------------------ |
| Analyzed By         | Screen Flow Discovery (momorph.screenflow) |
| Analysis Date       | 2026-05-11                                 |
| Needs Deep Analysis | No (single CTA, no form)                   |
| Confidence Score    | High                                       |

### Next Steps

- [ ] Get detailed design items via `list_design_items` to extract exact colors, spacing tokens, and image asset URLs.
- [ ] Extract styles via `list_frame_styles` for design-token alignment with constitution.
- [ ] Confirm Sun\* email-domain allowlist policy with backend/auth team.
- [ ] Generate OpenAPI entries for `/api/auth/callback` and `/api/auth/session` in `momorph.apispecs`.
- [ ] Add Playwright E2E happy-path: unauthenticated visit → click button → mock Google → land on `/`.
