# Referral Page Redesign - Implementation Work Log

## Overview
Redesigning the referral page based on the new Figma design. The new design is much more simplified compared to the current implementation, focusing only on:
1. Binding to a referral code
2. Creating/generating your own referral code
3. Basic display of referral information

## Figma Design Analysis

### Design Structure
From Figma file `Tessera_ReferralCode_limitwidth` (node: 505-1734):

**Layout Components:**
1. **Header Section**
   - Tessera Logo (192x40px)
   - Connected wallet display (showing address like "0x44098d5...82941cc8" with "Disconnect" option)

2. **Hero/Tagline Section**
   - Headline: "The first non-KYC private equity token, right at your fingertips."
   - Subtext: "Join our social channels for the latest updates."
   - Social media icons

3. **Main Content - Two Cards:**

   **Card 1: Bind Referral Code**
   - Section title: "Bind referral code"
   - Input field with placeholder: "Enter a code"
   - Button: "Bind Code" (primary color, large size)
   - Help text: "The account linked to this referral code will earn rewards proportionate to your trading volume."

   **Card 2: Create Referral Code**
   - Section title: "Create my referral code"
   - Label: "Your referral code"
   - Empty state box with button: "Create new code to earn Rewards" (with add icon)
   - The empty state is a gray box (200px height) with the button centered

4. **Footer**
   - "© 2025 Tessera PE. All rights reserved."

### Design Specs
- Layout width: 600px (limited width as mentioned in design name)
- Gap between sections: 24-40px
- Card padding: 24px
- Border radius: 8px
- Input size: Large (lg)
- Primary button color: Black (in light mode)
- Border color: #E4E4E7

---

## Current Implementation Analysis

### Existing Features (to be simplified/removed)
- ✅ Authentication with wallet signing (KEEP - required for both bind and create)
- ✅ Create referral code functionality (KEEP - but simplify UI)
- ✅ Bind to referral code functionality (KEEP - but simplify UI)
- ❌ Multi-level tree visualization (REMOVE)
- ❌ Detailed metrics cards (rebates, points, trading volume) (REMOVE)
- ❌ Trader/Affiliate tabs (REMOVE - single unified view)
- ❌ Email verification section (REMOVE or move elsewhere)
- ❌ Leaderboard link (REMOVE or move elsewhere)
- ❌ Referral codes table (SIMPLIFY - just show the created code)
- ❌ Discount distribution history (REMOVE)

### Existing Code Structure (to reuse)
- ✅ `use-referral-auth.ts` - Authentication hook (REUSE AS-IS)
- ✅ `use-referral-queries.ts` - API queries and mutations (REUSE: useCreateReferralCode, useBindReferralCode)
- ✅ `api-client.ts` - API client (REUSE AS-IS)
- ✅ UI components from shadcn (Button, Input, Card) (REUSE)

### Backend API Endpoints (already implemented)
- ✅ POST `/api/auth/nonce` - Get nonce for signing
- ✅ POST `/api/auth/verify` - Verify signature and get session token
- ✅ POST `/api/referral/code` - Create referral code (requires auth)
- ✅ POST `/api/referral/trader/bind` - Bind to referral code (requires auth)
- ✅ GET `/api/referral/trader` - Get trader data (to check if already bound)
- ✅ GET `/api/referral/affiliate` - Get affiliate data (to check existing codes)

---

## Questions & Clarifications

### 1. **Page Route & Navigation**
- **Q:** Should this replace the existing `/referral` route or be a new route like `/referral-new`?
- **A:** let's do /referral-new

### 2. **Header Component**
- **Q:** The Figma shows a custom header with logo and wallet. Should we:
  a) Keep the existing `AppHeader` component (with navigation links)
  b) Create a new simplified header just for this page (matching Figma exactly)
  c) Make this page have a different layout without the app navigation?
- **A:** c

### 3. **Social Links Section**
- **Q:** The Figma shows social media icons (Twitter/X, Discord, Telegram). Do you have:
  - The specific URLs for each social platform?
  - Should we add these to the design or skip for now?
- **A:** Let's implement the UI but for the links let's point to like google.com or something.

### 4. **Referral Code Display**
- **Q:** After creating a code, should we:
  a) Show only the most recently created code?
  b) Allow multiple codes and show all of them?
  c) Show the first/primary code only?
- The current backend supports multiple codes per wallet. What's the expected behavior?
- **A:** b

### 5. **Binding Restrictions**
- **Q:** Can a user:
  - Bind to a referral code if they already have one? (Can they change it?)
  - Create a referral code if they're already bound to someone else's code?
  - The current implementation allows editing. Should the new design prevent changing once bound?
- **A:** Let's prevent editing once it's binded, but they can create as many referral codes as they want. It does not have anything to do with whether or not they are binded with someone.

### 6. **Code Slug Generation**
- **Q:** For creating codes:
  - Should users be able to choose custom code slugs, or always auto-generate?
  - The current implementation has a dialog with options. New design shows just a button.
  - Should the "active layer" option (L1/L2/L3) be kept or removed?
- **A:** Let's do always auto-generate it for now. The active layer should be removed. Let's remove active layer for the existing implementation as well.

### 7. **Empty State vs Existing Code**
- **Q:** In the "Create my referral code" section:
  - If user already has a code, should we show it with a copy button?
  - Should we allow creating multiple codes or just one?
  - The Figma only shows the empty state. Need to design the "code exists" state.
- **A:** 
  - allow mutiple code
  - https://www.figma.com/design/pWq1G4HEKWLp8j5X7jlLHA/Tessera-Labs?node-id=493-2118&t=A715BmmkdXAnwABM-4 here is the link to the none empty state
  - the copy button is in this design.

### 8. **Error Handling & Loading States**
- **Q:** The Figma doesn't show error states or loading spinners. Should we:
  - Follow the current pattern (toast notifications for errors)
  - Add inline error messages below inputs?
  - Show loading states on buttons?
- **A:** For now, let's keep following the current pattern.

### 9. **Success Feedback**
- **Q:** After successful bind or create:
  - Show a toast notification?
  - Update the UI inline?
  - Show any animation or confirmation?
- **A:** Let's do a toast notification but also make sure to update the UI if there's changes in the data.

### 10. **Styling/Theme**
- **Q:** The app has dark/light mode support. Should this page:
  - Support both modes (matching the existing theme system)?
  - Force light mode only (as shown in Figma)?
- **A:** Let's do the dark mode to the best of our ability using available design.

### 11. **Code Validation**
- **Q:** For the "Bind referral code" input:
  - Any client-side validation (length, format, characters)?
  - Current implementation converts to uppercase. Keep this?
  - Show validation errors inline or only after submit?
- **A:** Yes, that's do the sensible client-side validation and also keep the behavior of converting into

### 12. **Background Decoration**
- **Q:** The Figma shows a decorative image/gradient on the right side. Should we:
  - Implement this background element?
  - Skip it for MVP?
  - Do you have the asset files?
- **A:** src/assets/heroShot.jpg

---

## Proposed Implementation Plan

### Phase 1: Component Setup & Layout
**Files to create:**
- `src/features/referral/referral-feature-simple.tsx` - New main component
- `src/features/referral/ui/simple-referral-header.tsx` (if custom header needed)
- `src/features/referral/ui/bind-code-card.tsx` - Bind referral code section
- `src/features/referral/ui/create-code-card.tsx` - Create code section

**Tasks:**
1. Create new page layout matching Figma structure
2. Implement responsive container (600px max width)
3. Add proper spacing and gaps (24-40px)

### Phase 2: Bind Referral Code Feature
**Component: `bind-code-card.tsx`**

**Features:**
1. Input field for referral code
   - Placeholder: "Enter a code"
   - Size: Large
   - Converts to uppercase on input
2. "Bind Code" button
   - Primary color
   - Large size
   - Disabled when empty or loading
3. Help text below
4. Integration with `useBindReferralCode` hook
5. Show current bound code if exists (read-only display)

**State Management:**
- Form state for input value
- Loading state during API call
- Error state for validation
- Success state for feedback

### Phase 3: Create Referral Code Feature
**Component: `create-code-card.tsx`**

**Features:**
1. Section title: "Create my referral code"
2. Empty state:
   - Large gray box (200px height, #f5f5f5 background)
   - Centered button with add icon
   - Text: "Create new code to earn Rewards"
3. Filled state (if code exists):
   - Display: "Your referral code"
   - Show code in large font with copy button
   - Optional: Show referral link/URL with copy
4. Integration with `useCreateReferralCode` hook

**State Management:**
- Check if user has existing code
- Loading state during creation
- Success/error feedback

### Phase 4: Authentication Flow
**Reuse existing `use-referral-auth` hook**

**Flow:**
1. Check wallet connection
2. If not connected → Show "Connect wallet" message
3. If connected but not authenticated → Show "Sign message" prompt
4. If authenticated → Show main content (bind + create sections)

**UI States:**
- Not connected: Simple message + visual prompt
- Not authenticated: "Sign message" button with explanation
- Authenticated: Full page content

### Phase 5: Styling & Polish
**Tasks:**
1. Match Figma design specs:
   - Colors: borders (#E4E4E7), backgrounds, text colors
   - Typography: font sizes (large: 18px, medium: 16px, small: 14px)
   - Border radius: 8px
   - Shadows: subtle card shadows
2. Implement dark mode variants (if supported)
3. Add hover states for interactive elements
4. Ensure responsive design (mobile view)
5. Add loading spinners/skeletons where needed

### Phase 6: Integration & Testing
**Tasks:**
1. Wire up to routing (replace or add new route)
2. Test authentication flow
3. Test bind code functionality
4. Test create code functionality
5. Test error scenarios:
   - Invalid code
   - Already bound
   - API errors
   - Network failures
6. Test with real backend API
7. Verify wallet signing works correctly

### Phase 7: Optional Enhancements
**Based on answers to questions above:**
1. Social links section (if URLs provided)
2. Background decoration (if assets provided)
3. Copy referral link feature
4. Share functionality (social share buttons)
5. Show basic stats (e.g., "X people used your code")
6. Referral link with custom domain

---

## Technical Implementation Details

### Component Architecture
```
referral-feature-simple.tsx (main)
├── AuthenticationGuard (wallet + signature check)
├── HeroSection (headline + social links)
├── BindCodeCard
│   ├── Input (code entry)
│   ├── Button (bind action)
│   └── HelpText
└── CreateCodeCard
    ├── EmptyState (create button)
    └── FilledState (show code + copy)
```

### API Integration Points
1. **Authentication:**
   - `useReferralAuth()` → handles wallet signing
   - Required before any API calls

2. **Bind Code:**
   - `useBindReferralCode()` mutation
   - Input: referralCode (string)
   - Response: success + binding details

3. **Create Code:**
   - `useCreateReferralCode()` mutation
   - Input: { codeSlug?: string, activeLayer?: number }
   - Response: { code: ReferralCode }

4. **Check Existing State:**
   - `useTraderData()` → check if bound to a code
   - `useAffiliateData()` → check existing created codes

### Signing Flow
Already implemented in `use-referral-auth.ts`:
1. Get nonce from backend
2. Create message with nonce
3. Sign with wallet (using window.solana.signMessage)
4. Send signature to backend for verification
5. Receive and store session token
6. Include token in all subsequent API requests

---

## File Structure
```
src/features/referral/
├── referral-feature-simple.tsx        # New main page component
├── hooks/
│   ├── use-referral-auth.ts          # EXISTING - no changes needed
│   └── use-referral-queries.ts       # EXISTING - reuse hooks
├── lib/
│   └── api-client.ts                 # EXISTING - no changes needed
└── ui/
    ├── bind-code-card.tsx            # NEW - bind section
    ├── create-code-card.tsx          # NEW - create section
    ├── simple-referral-header.tsx    # NEW - optional custom header
    ├── affiliate-view.tsx            # EXISTING - keep for reference/backup
    └── trader-view.tsx               # EXISTING - keep for reference/backup
```

---

## Dependencies
All required dependencies are already in package.json:
- ✅ React & React Router
- ✅ @wallet-ui/react (for wallet connection)
- ✅ @tanstack/react-query (for API state)
- ✅ shadcn/ui components (Button, Input, Card)
- ✅ lucide-react (for icons)
- ✅ sonner (for toasts)
- ✅ tailwindcss (for styling)

No new dependencies needed!

---

## Timeline Estimate
**Assuming answers to questions are provided:**
- Phase 1 (Setup): 1-2 hours
- Phase 2 (Bind Code): 2-3 hours
- Phase 3 (Create Code): 2-3 hours
- Phase 4 (Auth Flow): 1 hour
- Phase 5 (Styling): 2-3 hours
- Phase 6 (Testing): 2-3 hours
- Phase 7 (Optional): 2-4 hours

**Total: 12-19 hours** (depending on scope and complexity)

---

## Notes & Considerations

### Simplification Benefits
- ✅ Much cleaner UI/UX
- ✅ Faster load time (fewer API calls)
- ✅ Easier to understand for users
- ✅ Less maintenance overhead
- ✅ Mobile-friendly design

### Potential Issues
- ⚠️ Loss of detailed metrics visibility (rebates, points, tree)
  - Solution: Could add a "View Details" link to old page if needed
- ⚠️ Single referral code limitation?
  - Need clarification on multi-code support
- ⚠️ No way to see who used your code
  - Could add a simple counter or list later

### Future Enhancements (Post-MVP)
1. Analytics dashboard (separate page)
2. Referral link with custom domain
3. Social sharing (Twitter, Telegram, etc.)
4. QR code generation for mobile sharing
5. Referral history/timeline
6. Rewards claim interface
7. Email notifications for new referrals

---

## Status
- **Status:** ⏳ Awaiting answers to questions
- **Next Step:** Once questions are answered, begin Phase 1 implementation
- **Last Updated:** 2025-10-12

---

## Decision Log
_This section will be updated as questions are answered and decisions are made._

| # | Question | Decision | Date |
|---|----------|----------|------|
| 1 | Page route? | _TBD_ | - |
| 2 | Header component? | _TBD_ | - |
| 3 | Social links? | _TBD_ | - |
| 4 | Code display strategy? | _TBD_ | - |
| 5 | Binding restrictions? | _TBD_ | - |
| 6 | Code slug generation? | _TBD_ | - |
| 7 | Empty vs existing state? | _TBD_ | - |
| 8 | Error handling? | _TBD_ | - |
| 9 | Success feedback? | _TBD_ | - |
| 10 | Theme support? | _TBD_ | - |
| 11 | Code validation? | _TBD_ | - |
| 12 | Background decoration? | _TBD_ | - |

---

_Please review this work log and provide answers to the questions above. Once we have clarity on the requirements, I'll proceed with the implementation._
