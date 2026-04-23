// Shared constants and helpers for the Tessera "social card" flow.
//
// This module is imported by BOTH the frontend share button
// (src/pages/eligibility-page/utils/share.ts) and the backend eligibility
// verifier (functions/api/eligibility/social-post.ts) so the text we post
// and the phrase we search for stay in sync.

export const SOCIAL_CARD_TOKEN_IDS = ['T-Kalshi'] as const
export type SocialCardTokenId = (typeof SOCIAL_CARD_TOKEN_IDS)[number]

export function isSocialCardTokenId(value: string | null | undefined): value is SocialCardTokenId {
  return value != null && (SOCIAL_CARD_TOKEN_IDS as readonly string[]).includes(value)
}

// The Tessera Twitter handle mentioned in every social-card share. The
// eligibility verifier searches the user's timeline for this mention, so
// DO NOT remove it from the share text without also updating the query.
export const TESSERA_TWITTER_MENTION = '@Tessera_PE'

export function buildSocialCardShareText(tokenName: string): string {
  return `I'm in on ${tokenName} via ${TESSERA_TWITTER_MENTION} — private equity for everyone, on-chain, no KYC.`
}

// Loose phrase the eligibility verifier looks for on the user's timeline.
// We match on the @Tessera_PE mention only — Twitter's t.co wrapping makes
// URL-based matching unreliable, and matching on just the mention means
// user edits to the rest of the text still qualify.
export const SOCIAL_CARD_SEARCH_QUERY = TESSERA_TWITTER_MENTION
