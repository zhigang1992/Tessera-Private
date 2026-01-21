# Tessera Devnet Deployment

## Token Addresses

- **TESS Token (Token-2022)**: `767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj`
- **USDC Token (Test)**: `5xFsnWSvZDTatxY9EyGwXbkjYXU75tN5dhMzneA9hPSB`

## Meteora DLMM Pool

- **Pool Address**: `5V6TXJkrQcvmTwcqgt3bozntK3MdjGuEcUzS8XgyBJP5`
- **Pool UI**: https://devnet.app.meteora.ag/dlmm/5V6TXJkrQcvmTwcqgt3bozntK3MdjGuEcUzS8XgyBJP5
- **Liquidity**: ~110k TESS + ~110k USDC
- **Price**: 1 TESS = 1 USDC (1:1 ratio)
- **Bin Step**: 10 basis points

## Deployed Contracts

- **Tessera Token Program**: Token-2022 with transfer fee extension
- **Referral System**: Deployed on devnet

## Deployer Account

- **Address**: `9UHfCynABPyvSeqZfD3E6A3DPt1xfechkRa1xDm6ZRvY`
- **Keypair Location**: `contract/.keypairs/deployer-keypair.json`

## RPC Endpoint

- **Devnet**: `https://api.devnet.solana.com`

## Minting Tokens

To mint TESS or USDC to a wallet:

```bash
# Mint TESS (Token-2022)
cd contract
spl-token mint 767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj <AMOUNT> <WALLET_ADDRESS> --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# Mint USDC
spl-token mint 5xFsnWSvZDTatxY9EyGwXbkjYXU75tN5dhMzneA9hPSB <AMOUNT> <WALLET_ADDRESS>
```

Note: The recipient wallet needs an Associated Token Account (ATA) for the token. Create one if needed:

```bash
# Create TESS ATA (Token-2022)
spl-token create-account 767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj --owner <WALLET_ADDRESS> --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# Create USDC ATA
spl-token create-account 5xFsnWSvZDTatxY9EyGwXbkjYXU75tN5dhMzneA9hPSB --owner <WALLET_ADDRESS>
```

## Hasura GraphQL

- **Endpoint**: https://tracker-gql-dev.tessera.fun/console
- **Admin Key**: xRkifHbnNykgVkQ6r7Ns
