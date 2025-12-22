● 🏗️ Complete Tessera Ecosystem Addresses

  Here's a comprehensive list of all the design tokens, program IDs, and contract addresses in the Tessera
  ecosystem:

  📡 Standard Solana Programs

  - Token Program (Legacy): TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
  - Token-2022 Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
  - System Program: 11111111111111111111111111111111
  - BPF Loader Upgradeable: BPFLoaderUpgradeab1e11111111111111111111111
  - Rent Program: SysvarRent111111111111111111111111111111111

  🚀 Tessera Core Programs

  - Tessera Token Program: TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf
  - Tessera Referral Program: 5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog
  - Tessera Auction Program: 4Edp1p2soByRisvWP7SUA6dmfeZLHqa3UCCsoPm1Ak5R

  🌐 DevNet Configuration

  - RPC Endpoint: https://api.devnet.solana.com
  - Current Test Mint: 2Z41NAkarnW3VKA5EYk3YM58CgXDvpdyw5isEDbNW8mR ⚠️ (Uses native Token-2022)
  - Authority: 9UHfCynABPyvSeqZfD3E6A3DPt1xfechkRa1xDm6ZRvY

  🔍 DevNet Program Derived Addresses (PDAs)

  Token Program PDAs:

  - Fee Manager Config: ByRWu8AHgGNLseku719hZMLBjkDb3ujTaG3D95gNuASX
  - Treasury Config: ZZ7UBMHaBXN2GmftzJLzLRjpEA5xMTsHs34yktX2Zyc
  - Authorized Programs: BKsWcNEnP97FNHHD3MbiJkmiwUFiz7ZiYvJJLyWFfb8p
  - Extra Account Metas: E2bEEew6FwmDT5zsDHyWb1MDpzjJpdcaaX9va4gTj1A9
  - Fee Authority: FM8dUE6xCgcxrhjxNf25esWxYaW8pfvZwd54JDHEcL6P

  Referral Program PDAs:

  - Referral Config: 4rxreRteoPee986GadAuLA3SAJubMjXcocgSwUhvohbR
  - Token Authority: Me6NhDPr7RJGPftV3V41zmhckDNxkDfcDr4o3pV5ZHy

  🌍 MainNet Configuration

  - RPC Endpoint: https://api.mainnet-beta.solana.com
  - Production Mint: TESgesqMiVxUG38tuJmLkDSQoebKmBn2FhZkYNBr8hu
  - Production Authority: 9UHfCynABPyvSeqZfD3E6A3DPt1xfechkRa1xDm6ZRvY

  🪙 Token Specifications

  DevNet Test Token (TTT02)

  - Name: Tessera Test Token (0.2%)
  - Symbol: TTT02
  - Decimals: 9
  - Transfer Fee: 0.2% (20 bps)
  - Maximum Fee: 0.001 tokens

  MainNet Production Token (TESS)

  - Name: Tessera Token
  - Symbol: TESS
  - Decimals: 9
  - Transfer Fee: 0.2% (20 bps)
  - Maximum Fee: 0.001 tokens

  🎁 Referral System Configuration

  - Default Fee Reduction: 20% (2000 bps)
  - Tier 1 Split: 30% (3000 bps)
  - Tier 2 Split: 3% (300 bps)
  - Tier 3 Split: 2% (200 bps)
  - Split Fee Enabled: true

  🔗 Key Explorer Links

  - Token Program: https://explorer.solana.com/address/TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf?cluster=devnet
  - Referral Program:
  https://explorer.solana.com/address/5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog?cluster=devnet
  - Auction Program:
  https://explorer.solana.com/address/4Edp1p2soByRisvWP7SUA6dmfeZLHqa3UCCsoPm1Ak5R?cluster=devnet
  - Test Mint: https://explorer.solana.com/address/2Z41NAkarnW3VKA5EYk3YM58CgXDvpdyw5isEDbNW8mR?cluster=devnet
  - Fee Manager Config:
  https://explorer.solana.com/address/ByRWu8AHgGNLseku719hZMLBjkDb3ujTaG3D95gNuASX?cluster=devnet

  🔧 PDA Derivation Patterns

  Token Program:
    - fee_manager_config: ["fee_manager_config", mint]
    - treasury_config: ["treasury_config", mint]
    - authorized_programs: ["authorized_programs", mint]
    - extra_account_metas: ["extra_account_metas", mint]
    - fee_authority: ["fee_authority", mint]
    - whitelist: ["whitelist", account]
    - sender_fee_config: ["sender_fee_config", mint, sender]

  Referral Program:
    - referral_config: ["referral_config"]
    - token_authority: ["token_authority", referral_config]
    - referral_code: ["referral_code", code]
    - user_registration: ["user_registration", user]
    - referral_link: ["referral_link", user, referrer]

  📁 Configuration Files

  - DevNet Config: scripts/utils/devnet-config.ts
  - MainNet Config: scripts/utils/mainnet-config.ts
  - Dynamic Config: scripts/utils/config.ts
  - Anchor Config: Anchor.toml

  The DevNet infrastructure is fully deployed and operational, with all programs and PDAs correctly configured. The
   only issue is that the current test mint uses the native Token-2022 program instead of the Tessera Token
  Program, which means the fee manager functionality won't be activated during transfers.