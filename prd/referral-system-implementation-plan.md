# Referral System Implementation Plan

## Scope (Oct 19 Release)
- Deliver core referral experience before trading goes live on Oct 19.
- Support wallet-based account registration, custom referral code creation, referral binding, referral relationship viewing, and leaderboard browsing.
- Limit scope to read/write operations required for the Referral and Leaderboard sections defined in the PRD segment "⚙️ 10月19号之前要上的版本".

## Goals
- Allow any connected wallet to register and mint or select an active referral code.
- Enable traders to bind themselves to a referrer by entering a code and to change that binding with immediate effect.
- Show traders their trading metrics, fee discounts, and referral bindings in a dedicated tab.
- Show affiliates (referrers) their performance metrics, tree summary, and sharing tools in a second tab.
- Expose a public leaderboard ranked by referral points.
- Verify wallet ownership by signing messages when performing sensitive actions (registration, code changes, email association).
- Verify referral email addresses via Cloudflare Email Workers before marking them active.

## Non-Goals
- No on-chain transactions for this release; all actions stay off-chain.
- No automated payouts; rebate disbursement is tracked but not processed here.
- No deep analytics (e.g., daily breakdowns); focus on aggregate totals required for UI.

## Frontend Implementation

### Application Structure
- **Routes**
  - `/referral` → Hosts the Referral page with Trader and Affiliate tabs.
  - `/referral/leaderboard` → Dedicated Leaderboard page. Consider nested routing under `/referral` if navigation should preserve layout.
- **State Management**
  - Use React Query to fetch referral data and cache per wallet address.
  - Jotai atoms for cross-component state (e.g., current tab, active wallet metadata).
- **Styling**
  - Reuse Tailwind + wallet UI component library; create scoped utility classes for referral-specific elements.

### Referral Page
- **Shared Layout Components**
  - `ReferralPageLayout` (top-level layout with tab navigation, wallet connect CTA, loading states).
  - `MetricsCard` reusable component for key metrics (trading volume, fee rebate, etc.).
- **Trader Tab**
  - Fetch: `GET /api/referral/trader` with wallet auth header and signed message (see Wallet Integration).
  - Display cards for:
    - Trading Volume (numeric total with formatting).
    - Active Referral Code (current binding; show edit control to change; integrates with referrer lookup endpoint).
    - Fee Rebate amount (monthly accrual, fetch from backend; highlight payout schedule).
    - Trading Points (total accumulated points).
    - Fee Discount (current percentage).
  - **Actions**
    - Change referral binding (modal with input, confirm via signed message, call `POST /api/referral/trader/bind`).
    - View binding history (optional stretch; otherwise show last updated timestamp).
- **Affiliate Tab**
  - Fetch: `GET /api/referral/affiliate` including referral metrics and tree summary.
  - UI Blocks:
    - Summary strip (Rebates, Referral Points, Email status, Last payout date).
    - Email association form (connect email > `POST /api/referral/email/request`). Validate via signed message, then trigger Cloudflare Email Worker to send magic-link verification. Show pending/verified state in UI.
    - Tree visualization: simplified stacked bar/accordion summarizing L1-L3 counts and points. For Oct 19 release, implement responsive table with level, trader count, total points.
  - **Code Sharing Section**
    - Show referral code, copy-to-clipboard button, share on X (prefill tweet text with referral link built off configured base URL).
    - Stats: L1 trader count, active layer coverage, total rebates.
    - "Generate/Customize Code" modal for first-time setup or editing slug; interacts with `POST /api/referral/code`.

### Leaderboard Page
- Fetch `GET /api/referral/leaderboard?limit=100` to render initial list; support pagination/infinite scroll if counts grow.
- Components: `LeaderboardTable` (rank, referrer name/alias, points, rebates), `LeaderboardFilters` (timeframe filter reserved for future, disabled or default to "All time").
- Sorting: default by referral points descending; allow secondary sort by rebates.

### Wallet Integration Hooks
- Wrap referral pages with guard that prompts wallet connection if not already connected.
- Provide `useWalletSignature` hook to request message signatures for privileged actions (see below).
- Maintain `walletSession` atom storing address, last signature timestamp, session nonce issued by backend.

## Wallet Integration & Security
- **Session Establishment**
  - On page load with connected wallet, fetch a nonce from `GET /api/auth/nonce`.
  - Ask user to sign `Sign in to Tessera Referral Program
    Nonce: <nonce>
    Timestamp: <iso>`.
  - POST signature to `/api/auth/verify` to receive short-lived JWT (10–15 minutes) or session token stored in memory/sessionStorage.
  - API contracts:
    - `GET /api/auth/nonce?wallet=<address>` → Responds with `{ nonce, walletAddress, issuedAt, expiresAt, ttlSeconds, message }`; cache-control `no-store`.
    - `POST /api/auth/verify` → Payload `{ walletAddress, nonce, signature, timestamp, signatureEncoding }`; verifies Ed25519 signature and returns `{ token, tokenType: 'session', walletAddress, issuedAt, expiresAt, ttlSeconds }`.
    - Downstream APIs accept `Authorization: Bearer <token>` header and validate against `SESSION_KV`.
- **Sensitive Operations** (registration, code creation, binding changes, email update)
  - Require a fresh nonce (if last signature >5 minutes old) to guard against replay.
  - For each action, sign a typed message with intent string and payload (e.g., `Bind referral code ABCD to trader <wallet> at time <timestamp>`). Submit to API alongside request body.
- **Wallet Libraries**
  - Use wallet UI kit integration already present (React + gill). Ensure hook exposes `signMessage` capability across supported wallets.
- **Error Handling**
  - Provide user-friendly modals for signature rejection, backend validation failures, or rate limits.

## Backend Implementation

### Platform Choice (Cloudflare Stack Evaluation)
- **Workers**: Suitable for lightweight API with low-latency global routing. Leverage Workers Typescript runtime.
- **D1 (SQLite)**: Provides relational schema, transactions, indexes. Best choice for referral tree and leaderboard queries given modest scale pre-trading.
- **KV**: Use for caching leaderboard snapshots and storing nonce/session data with TTL.
- **Email Workers (Email Routing)**: Send verification and notification emails without leaving the Cloudflare platform; integrate directly with referral email flows.
- **Durable Objects**: Optional for locking when updating referral tree (e.g., to avoid race when multiple wallets bind simultaneously). If traffic volume is low, we can rely on D1 transactions first and revisit DO later.

### Cloudflare Email Worker Setup
- Configure Email Routing DNS (SPF, DKIM, DMARC) for the referral domain (e.g., `referrals@tessera.xyz`) and route to the Workers script.
- Worker handles `email` events: validate signed payload (HMAC using shared secret), compose localized magic-link email, and call `message.send()`.
- Generate verification links like `https://app.tessera.xyz/referral/email/verify?token=<signed>`; persist tokens in D1 with `expires_at` and single-use flag.
- Log send outcomes to Workers Analytics Engine / Logpush for deliverability monitoring; surface failures to Sentry.
- Return success/error to calling API so frontend can show “Email sent” vs retry guidance.

### Data Model (D1)
- `users` (wallet_address PK, display_name nullable, email, email_verified, email_verification_token, created_at, updated_at).
- `referral_codes` (id, wallet_address FK, code_slug UNIQUE, status [active|inactive], active_layer, created_at, updated_at).
- `trader_bindings` (wallet_address PK, referrer_code FK, bound_at, bound_by_wallet signature hash, last_modified).
- `referral_tree_edges` (id, ancestor_address, descendant_address, level INT (1-3), created_at). Maintained on binding changes to support fast tree aggregation.
- `metrics_trader` (wallet_address PK, trading_volume, fee_rebate_total, trading_points, fee_discount_pct, snapshot_at).
- `metrics_referrer` (wallet_address PK, rebates_total, referral_points, l1_trader_count, l2_trader_count, l3_trader_count, snapshot_at).
- `leaderboard_snapshots` (id, snapshot_at, data JSON, expires_at) for caching heavy joins if necessary.
- `auth_nonces` (nonce, wallet_address, expires_at, used BOOLEAN).

### API Endpoints
- `GET /api/auth/nonce` → Issue nonce, store in KV with TTL 5 min.
- `POST /api/auth/verify` → Validate signature, issue JWT (signed with Worker secret) or session token stored in KV.
- `GET /api/referral/trader` → Return trader metrics, active referral code, fee info.
- `POST /api/referral/trader/bind` → Validate referral code exists/active, update `trader_bindings`, rebuild relevant `referral_tree_edges`, recalc aggregate counters asynchronously.
- `GET /api/referral/affiliate` → Return affiliate metrics, email, referral codes, tree summary grouped by level.
- `POST /api/referral/code` → Create or update custom code slug; enforce format/uniqueness.
- `POST /api/referral/email/request` → Store email for wallet, generate verification token, enqueue Email Worker send.
- `POST /api/referral/email/verify` → Accept token from magic link, mark email_verified true.
- `GET /api/referral/leaderboard` → Serve sorted list by referral points; optionally include pagination cursor.
- Internal hooks (Worker Cron or background job) to recalculate metrics nightly or on-demand, pulling trading volume & rebates from upstream trading service once available.

### Referral Tree Maintenance
- On binding change:
  - Start transaction.
  - Update `trader_bindings` for trader.
  - Remove existing `referral_tree_edges` rows for trader.
  - Insert new edges for levels 1–3 by walking parent bindings recursively (SQL CTE or worker logic).
  - Commit transaction to ensure atomic updates.
- Maintain derived counts in `metrics_referrer` either via immediate update in transaction or background job reading from edges.

### Metrics & Leaderboard Strategy
- For Oct 19 release, allow eventual consistency (e.g., leaderboard updates every 5 minutes) to reduce load.
- Use KV cache for leaderboard responses; warm cache on mutate or on cron schedule.
- Provide `snapshot_at` to front-end for display.

### Security & Validation
- Enforce rate limits per wallet/IP via Worker `ratelimit` (Cloudflare Turnstile optional for email form to prevent abuse).
- Cloudflare Email Worker uses signed tokens (HMAC) in verification links to prevent tampering; tokens expire (e.g., 24h) and are single-use.
- Verify referral codes on creation (length 4–10 alphanumeric) and binding (code must be active, not belonging to trader themselves unless self-binding allowed).
- Log audit trail for key actions (binding changes, code creation) to Cloudflare Logpush/Sentry for support.

## Implementation Steps (Oct 19 Target)
1. **Backend Foundation**: Set up Worker project, configure D1 schema migration scripts, implement auth nonce + verify endpoints.
2. **Data Model & CRUD**: Build referral code CRUD and trader binding endpoints with signature checks.
3. **Metrics APIs**: Stub metrics endpoints with static values, integrate real data once trading data source is hooked.
4. **Frontend Skeleton**: Create `/referral` route, tab layout, placeholder components, integrate wallet connect guard.
5. **Trader Tab Functionality**: Hook up data fetching, binding modal, real-time state updates after mutation.
6. **Affiliate Tab Functionality**: Implement summary cards, referral code management, level table, email form with magic-link confirmation state.
7. **Leaderboard Page**: Fetch leaderboard API, render table, add copy/share controls per row if needed.
8. **Wallet Signature UX**: Implement signing prompts, error handling, and session refresh flows across actions.
9. **Email Worker Integration**: Deploy Email Worker script, connect routing, validate magic-link flow end-to-end.
10. **QA & Analytics**: Add telemetry (e.g., Sentry events, amplitude) and write integration tests for Worker APIs (including email verification path).
11. **UAT & Launch Prep**: Populate staging data, run end-to-end flows, document admin operations for customer support.

## Frontend Task Breakdown
- Wallet auth flow: nonce retrieval, signature prompts, JWT/session persistence, auto-refresh timer.
- Referral route shell: page-level layout, tab navigation component, guard for wallet connection, loading placeholders.
- Trader tab: metrics cards, active referral code display/edit modal, binding mutation hook, toast notifications.
- Affiliate tab: summary cards, referral code management modal, referral tree table, email capture + verification states.
- Email UX: form validation, resend cooldown timer, success/error modals aligned with Cloudflare Email Worker responses.
- Leaderboard page: data table with ranking badges, pagination or infinite scroll, share link copy button.
- Shared utilities: React Query hooks (`useTraderReferral`, `useAffiliateReferral`, `useLeaderboard`), analytics event emitters, error boundary.

## Backend Task Breakdown
- Worker bootstrap: router, middleware (logging, auth, validation), environment configuration for D1/KV bindings.
- Auth service: nonce issuance, signature verification, JWT/session issuance, rate limiting, audit logs.
- Referral code service: CRUD endpoints, slug uniqueness enforcement, activation toggles, analytics events.
- Trader binding service: mutation endpoint, referral tree recompute transaction, metrics invalidation, audit logging.
- Metrics aggregation jobs: scheduled Worker cron to ingest trading volume + rebates, update trader/referrer metrics tables.
- Leaderboard service: query composition, KV caching, pagination cursors, snapshot storage cadence.
- Email Worker service: verification token generation, D1 persistence, Email Worker dispatch handler, verification endpoint, bounce handling.

## Local Cloudflare Setup Notes
- Run `bun install` to ensure `wrangler` and Cloudflare type packages are available.
- Use `wrangler d1 migrations apply tessera-referral-db` to apply SQL in `migrations/` against the local D1 binding (`wrangler.toml` already defines it as `DB`).
- Execute Pages Functions locally with `bun run cf:dev`, which reads the D1 binding from `wrangler.toml` and applies in-memory storage unless a local database file is configured.
- For schema evolution, add new `migrations/000X_description.sql` files and re-run `wrangler d1 migrations apply`.
## Risks & Follow-Ups
- Trading data availability may lag; prepare to surface "Data syncing" state instead of zeros.
- Email Worker deliverability or rate limits may require tuning (e.g., SPF/DKIM setup); monitor bounce/error logs after launch.
- Leaderboard scaling: if D1 queries become heavy, consider materialized JSON snapshots or migrating to Workers KV/Vectorize caching later.
