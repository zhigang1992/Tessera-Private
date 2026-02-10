# Tessera GraphQL Schema - Referral System Tables

**Updated:** 2026-02-10  
**Endpoint (Dev):** `https://tracker-gql-dev.tessera.fun/v1/graphql`

## ⚠️ IMPORTANT: Use Views Instead of Event Tables

The latest schema update includes **deduplicated views** for referral codes and user registrations. These views represent the **current state** and should be used instead of the event tables which can contain duplicates.

## Latest State Views (RECOMMENDED)

### `view_latest_referral_system_referral_code_created_events`

**Purpose:** Deduplicated view of referral codes (current state)  
**Use instead of:** `facts_referral_system_referral_code_created_events`

**Fields:**
- `code: String!` - The referral code string
- `owner: String!` - Wallet address of code owner
- `signature: String!` - Transaction signature
- `event_index: Int!` - Event index in transaction
- `block_time: bigint!` - Block timestamp
- `block_number: bigint!` - Block number
- `created_at: timestamptz!` - Database timestamp

**Example Query:**
```graphql
query GetReferralCodesByOwner($owner: String!) {
  view_latest_referral_system_referral_code_created_events(
    where: { owner: { _eq: $owner } }
    order_by: { block_time: desc }
  ) {
    code
    owner
    block_time
  }
}
```

### `view_latest_user_registered_events`

**Purpose:** Deduplicated view of user registrations (current bindings)  
**Use instead of:** `facts_referral_system_user_registered_events`

**Fields:**
- `user: String!` - Wallet address of registered user
- `referral_code: String!` - The referral code they used
- `referral_code_key: String!` - PDA of the referral code account
- `tier1_referrer: String!` - Direct referrer wallet
- `tier2_referrer: String!` - Grandparent referrer wallet
- `tier3_referrer: String!` - Great-grandparent referrer wallet
- `is_new_registration: Boolean!` - Whether this was a new registration
- `signature: String!` - Transaction signature
- `event_index: Int!` - Event index in transaction
- `block_time: bigint!` - Block timestamp
- `block_number: bigint!` - Block number
- `created_at: timestamptz!` - Database timestamp

**Example Query:**
```graphql
query GetUserRegistration($user: String!) {
  view_latest_user_registered_events(
    where: { user: { _eq: $user } }
    limit: 1
  ) {
    user
    referral_code
    tier1_referrer
    tier2_referrer
    tier3_referrer
  }
}
```

## Event Tables (⚠️ Contains Duplicates - Avoid)

### `facts_referral_system_referral_code_created_events`
⚠️ **WARNING:** Contains duplicate events from re-registrations. Use `view_latest_referral_system_referral_code_created_events` instead.

### `facts_referral_system_user_registered_events`
⚠️ **WARNING:** Contains duplicate events from re-registrations. Use `view_latest_user_registered_events` instead.

## Aggregated Marts (Pre-computed Statistics)

These are safe to use as they aggregate data correctly:

- `public_marts_referral_count_by_code_account` - Referral counts per code/account
- `public_marts_referral_count_by_tier_account` - Referral counts by tier
- `public_marts_attributed_trading_volume_by_code_account` - Trading volume per code
- `public_marts_reward_usd_by_code_account` - Rewards per code
- `public_marts_reward_detail_by_code_referral` - Detailed rewards breakdown
- `view_owner_referral_stats` - Owner referral statistics

## Migration Guide

### Before (Old - Has Duplicates):
```typescript
// ❌ OLD: Using event table directly
export async function fetchReferralCodesByOwner(ownerAddress: string) {
  const query = `
    query GetReferralCodes($owner: String!) {
      facts_referral_system_referral_code_created_events(
        where: { owner: { _eq: $owner } }
      ) {
        code
        owner
      }
    }
  `
  // ...
}
```

### After (New - Deduplicated):
```typescript
// ✅ NEW: Using deduplicated view
export async function fetchReferralCodesByOwner(ownerAddress: string) {
  const query = `
    query GetReferralCodes($owner: String!) {
      view_latest_referral_system_referral_code_created_events(
        where: { owner: { _eq: $owner } }
      ) {
        code
        owner
      }
    }
  `
  // ...
}
```

### Before (Old - Has Duplicates):
```typescript
// ❌ OLD: Using event table directly
export async function fetchUserRegistration(userAddress: string) {
  const query = `
    query GetUserRegistration($user: String!) {
      facts_referral_system_user_registered_events(
        where: { user: { _eq: $user } }
        order_by: { block_time: desc }
        limit: 1
      ) {
        user
        referral_code
      }
    }
  `
  // ...
}
```

### After (New - Deduplicated):
```typescript
// ✅ NEW: Using deduplicated view
export async function fetchUserRegistration(userAddress: string) {
  const query = `
    query GetUserRegistration($user: String!) {
      view_latest_user_registered_events(
        where: { user: { _eq: $user } }
        limit: 1
      ) {
        user
        referral_code
      }
    }
  `
  // ...
}
```

## Implementation Checklist

- [ ] Update `fetchReferralCodesByOwner` to use `view_latest_referral_system_referral_code_created_events`
- [ ] Update `fetchUserRegistration` to use `view_latest_user_registered_events`
- [ ] Update `fetchTradersForCode` to use `view_latest_user_registered_events`
- [ ] Update `fetchTier2ReferralsForWallet` to use `view_latest_user_registered_events`
- [ ] Update `fetchTier3ReferralsForWallet` to use `view_latest_user_registered_events`
- [ ] Keep aggregated marts (`public_marts_*`) as-is - they handle deduplication correctly
- [ ] Test all queries to ensure data integrity

## Notes

- The views are materialized/refreshed automatically by the database
- Views include the same fields as the event tables plus database metadata
- Event tables should only be used for historical analysis or event streams
- For current state queries, **always use the views**
