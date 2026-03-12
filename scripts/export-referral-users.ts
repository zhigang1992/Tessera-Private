/**
 * Export deduplicated wallet addresses of all referral participants
 * from mainnet production GraphQL API.
 *
 * Outputs one address per line (union of code creators + registered users).
 *
 * Usage:
 *   npx tsx scripts/export-referral-users.ts
 *   npx tsx scripts/export-referral-users.ts > referral-export.csv
 */

const GRAPHQL_ENDPOINT = 'https://tracker-gql.tessera.fun/v1/graphql'

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors[0]?.message}`)
  }
  return result.data
}

async function fetchAllCodeCreatorAddresses(): Promise<string[]> {
  const addresses: string[] = []
  const batchSize = 1000
  let offset = 0

  while (true) {
    const query = `
      query ($limit: Int!, $offset: Int!) {
        view_latest_referral_system_referral_code_created_events(
          order_by: { block_time: desc }
          limit: $limit
          offset: $offset
        ) {
          owner
        }
      }
    `
    const data = await graphqlRequest<{
      view_latest_referral_system_referral_code_created_events: { owner: string }[]
    }>(query, { limit: batchSize, offset })

    const batch = data.view_latest_referral_system_referral_code_created_events
    for (const item of batch) addresses.push(item.owner)

    if (batch.length < batchSize) break
    offset += batchSize
  }

  return addresses
}

async function fetchAllRegisteredUserAddresses(): Promise<string[]> {
  const addresses: string[] = []
  const batchSize = 1000
  let offset = 0

  while (true) {
    const query = `
      query ($limit: Int!, $offset: Int!) {
        view_latest_user_registered_events(
          order_by: { block_time: desc }
          limit: $limit
          offset: $offset
        ) {
          user
        }
      }
    `
    const data = await graphqlRequest<{
      view_latest_user_registered_events: { user: string }[]
    }>(query, { limit: batchSize, offset })

    const batch = data.view_latest_user_registered_events
    for (const item of batch) addresses.push(item.user)

    if (batch.length < batchSize) break
    offset += batchSize
  }

  return addresses
}

async function main() {
  console.error('Fetching referral code creators...')
  const creatorAddresses = await fetchAllCodeCreatorAddresses()
  const uniqueCreators = new Set(creatorAddresses)
  console.error(`  Found ${creatorAddresses.length} codes from ${uniqueCreators.size} unique wallets`)

  console.error('Fetching registered users (bound to referral codes)...')
  const registeredAddresses = await fetchAllRegisteredUserAddresses()
  const uniqueRegistered = new Set(registeredAddresses)
  console.error(`  Found ${registeredAddresses.length} registrations from ${uniqueRegistered.size} unique wallets`)

  const allWallets = new Set([...uniqueCreators, ...uniqueRegistered])

  console.error('')
  console.error(`Summary:`)
  console.error(`  Code creator wallets: ${uniqueCreators.size}`)
  console.error(`  Registered user wallets: ${uniqueRegistered.size}`)
  console.error(`  Total unique wallets (deduplicated): ${allWallets.size}`)

  // Output one address per line
  console.log('address')
  for (const address of allWallets) {
    console.log(address)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
