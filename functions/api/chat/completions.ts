import type { PagesFunction } from '@cloudflare/workers-types'

type Env = {
  CLOUDFLARE_AI_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
}

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type RequestBody = {
  messages: ChatMessage[]
  stream?: boolean
}

const TESSERA_KNOWLEDGE_BASE = `# Tessera Documentation

# What is Tessera?
Tessera is a decentralized private-equity platform designed to make ownership in
the worldʼs most valuable private companies accessible to everyone.
Through on-chain tokenization, Tessera turns historically illiquid private shares into 
verifiable, tradable, and composable assets, giving retail and institutional investors
alike the ability to participate in pre-IPO growth without barriers.

## Problem 
- Private equity is one of the worldʼs best-performing asset classes, yet it remains fundamentally inaccessible.
- Exclusivity: Only accredited investors, those earning over $200K annually or
with a net worth above $1M, can participate directly.
- High minimums: Existing platforms require investments of $100K or more.
- Illiquidity: Settlements can take weeks, and investors are often locked in for years.

This structure locks 99% of the global population out of a $7 trillion market that
consistently outperforms public equities by more than 4% per year.

## Opportunities
Tessera sits at the intersection of two unstoppable trends: the tokenization of real-
world assets (RWAs) and the democratization of private markets.

By bringing private equity on-chain, Tessera unlocks a new financial layer where:
- Liquidity becomes continuous. Private shares can trade 24/7 on decentralized exchanges, giving investors real-time price discovery instead of quarterly valuations.
- Access becomes global. Anyone can participate permissionlessly with a wallet and as little as one dollar.
- Transparency becomes standard. Every asset is auditable on-chain through Chainlink Proof of Reserves and verifiable custody.
- Composability emerges. Private-equity tokens can integrate into DeFi ecosystems utilizing vaults, lending markets, and yield strategies to create entirely new capital-formation dynamics.

For investors, Tessera provides exposure to high-growth, high-impact companies
before they go public. For founders, it provides new ways to raise capital and
engage with global communities of aligned supporters.Problem


## The Vision
Tessera envisions a future where capital markets are open by design.

Private markets built the modern economy, but their structure favored exclusivity, opacity, and delay. Now it's possible to build a transparent, liquid, and borderless system of ownership that anyone can participate in.

In this new model:
- Private assets are discoverable and tradable in real time.
- Value creation is shared, not reserved.
- Liquidity is truth, and transparency is infrastructure.

Tessera launches on Solana and expands into a multi-chain network of tokenized private markets, connecting investors, institutions, and founders through a single principle: access without compromise.

Private markets built the modern economy. Tessera is building the open one.The Vision


## Comparison with Existing Solution
| Factors              | Tessera                                              | Others                                      |
|----------------------|------------------------------------------------------|---------------------------------------------|
| Trading Access       | Immediate, Global                                    | 12-month lock-up                            |
| User Onboarding      | Wallet Sign up (No KYC Required)                     | KYC-required + Full compliance verification |
| DeFi Integration     | Native Compatibility                                 | Regulatory barriers block protocols         |
| Geographic Reach     | Global                                               | Restricted by local regulations             |
| Regulatory Burden    | Lesser Compliance Overhead (See *Access & Eligibility* for more details) | Securities regulation apply                |
| Market Size          | +650M Wallet Users                                   | Accessible to 50M accredited investors globally |



# How it Works?

## Upfront and Underlying of Tessera

Behind the scene, Tesseraʼs lifecycle from real-world equity to on-chain tokens can
be summarized in SIX steps.
1. Equity Acquisition: Tessera acquires private shares from existing shareholders
or authorized secondary markets.

2. SPV Formation: The acquired equity is placed into a legally structured SPV. The SPV holds the equity, manages exits, and defines payout mechanics.
3. 1:1 Tokenization: Tessera mints on-chain tokens that represent proportional economic exposure to the SPV. The token supply matches the equity exposure held in the SPV.
4. Proof of Reserves: Chainlink Proof of Reserves verifies that the SPVʼs holdings match the circulating token supply. No unbacked tokens can exist.
5. Trading on Solana DEXs: Tokens can be traded permissionlessly on Solana-based decentralized exchanges, with instant settlement and 24/7 market access.
6. Redemption: When an IPO, acquisition, or secondary exit occurs, the SPV liquidates its equity into stablecoins and distributes proceeds to token holders pro-rata.

On the platform, youʼll trade these tokens in a way that feels familiar to anyone who has used other Solana tokens. Tessera platform offers 5 key features:
- Terminal with PE company data: Access in-depth analysis, charts, metrics, and key data for all private equity companies tradable on Tessera.How Tessera tokens work behind the scene
- Personal Dashboard & Portfolio: Track your current holdings as well as your full history of buy and sell activity.
- Trade: Instantly trade any Solana-based asset into Tessera tokens.
- Referral System: Create referral links, track your referral data, check your total referral earnings, and monitor the trading volume of all your referred users(referees).
- Redemption (Post-IPO): After a company has gone public, redeem your Tessera tokens for USDC.

For more information on how Tessera works, please visit "Additional FAQ" sections to read more. 


## Referral Systems

Tessera uses a '3-level referral system' for fee sharing whereby 35% of all Tessera revenue are distributed through our referral system. 
Our system uses referral codes that people can share when signing up:
- If you invite a friend and they use your code, you get a share of the fee as a reward.
- If your friend invites someone else, you get a smaller share of that next reward, too.

Referral rewards are multi-tiered, which means:
- Level 1 (your direct invite): You earn 30% of the referral reward.
- Level 2 (your friendʼs invite): you earn 3%.
- Level 3 (your friendʼs friendʼs invite): you earn 2%.
For every volume traded by your referrals, you will essentially earn a percentage of it,
which builds up over time as your 1st, 2nd, and 3rd degree referees trade Tessera
tokens.


## Referral Dashboard
In the Referral dashboard, you can check how much reward you have already earned via your referee(s). 
This page also includes the complete breakdown of the level of referral-generated
volumes based on your referral tiers, giving you an idea of how your referees are
performing. 
You can earn up to L3, the 3rd degree referral from your generated ref code. 
If you need to generate a new code, you may do so by clicking '+Create New
Code'. There is no limit to how many codes you can generate. 

## Referral Trader Data
Within the Referral Trader's data page, you can view your referral performance in-
depth based on your referee's trading history.
Please note that due to privacy protection, the complete address of your referee
will not be clickable or fully displayed. 
All of your aggregated referees' earned trading points will also be shown on this
page. 


## Creating & Sharing Referral
To participate in the Tessera referral program:
- Connect your Solana wallets
- Verify your wallet by signing an authentication (no fee required)
- Click on '+Create a New Code.' 
- Once your code has been generated, you can share it to start building your address's history
You will be able to create a custom code to begin referring others to join Tessera through your invite. 

Rules for Referral code creation:
- You can use any text or symbols
- Limited to only 6-12 characters

To understand how the referral works, please read 'How Referral Works'.

## Referral Customization

To enable URL-based sharing, you need to click on the "Share" button on the landing page.
To change the template image, simply click "<" or ">" to scroll through the selection of available images.
The image is built within the URL, so each time you share your URL, the image that you have chosen will be shown on the link preview, including the QR code of your ref code.

## How Referral Works
A referral code is a unique 6-12-character identifier by default that you create and
share with others. You may also customize the referral code. When someone registers with your code, they become part of your referral chain.

Example codes:
•ALICE2024
•CRYPTO123
•SOLANA99

## How the Referral Chain Works

Every user can have up to 3 levels of referrers for each code they generated.
When someone registers with your code:

1. They become your Level 1 referee (direct)
2. Their Level 1 becomes your Level 2 (2nd tier)
3. Their Level 2 becomes your Level 3 (3rd tier)

### Real-World Example
Let's follow Alice, Bob, Carol, and Dave:

#### Step 1: Alice Creates a Code
- Alice creates code: ALICE123
- Alice's chain: [empty]

#### Step 2: Bob Registers with Alice's Code
Bob registers with: ALICE123
Alice's chain:
├─ Level 1: Bob (30% of Bob's fees)
├─ Level 2: [empty]
└─ Level 3: [empty]

When Bob pays 10 tokens in fees:
- Alice earns: 3 tokens (30%)
- Protocol gets: 7 tokens (70%)


####Step 3: Carol Registers with Bob's Code
Carol registers with: BOB456
Alice's chain:
├─ Level 1: Bob (30% of Bob's fees)
├─ Level 2: Carol (3% of Carol's fees)
└─ Level 3: [empty]
Bob's chain:
├─ Level 1: Carol (30% of Carol's fees)
├─ Level 2: [empty]
└─ Level 3: [empty]

When Carol pays 10 tokens in fees:
- Bob earns: 3 tokens (30%)
- Alice earns: 0.3 tokens (3%)
- Protocol gets: 6.7 tokens (67%)

#### Step 4: Dave Registers with Carol's Code
Alice's chain:
├─ Level 1: Bob (30% of Bob's fees)
├─ Level 2: Carol (3% of Carol's fees)
└─ Level 3: Dave (2% of Dave's fees)
Bob's chain:
├─ Level 1: Carol (30% of Carol's fees)
├─ Level 2: Dave (3% of Dave's fees)
└─ Level 3: [empty]
Carol's chain:
├─ Level 1: Dave (30% of Dave's fees)
├─ Level 2: [empty]
└─ Level 3: [empty]


When Dave pays 10 tokens in fees:
- Carol earns: 3 tokens (30%)
- Bob earns: 0.3 tokens (3%)Dave registers with: CAROL789
- Alice earns: 0.2 tokens (2%)
- Protocol gets: 6.5 tokens (65%)

## Visual Representation

                  Alice (ALICE123)
                      │
                      │ Level 1
                      ▼
                    Bob (BOB456)
                      │
                      │ Level 1
                      ▼
                   Carol (CAROL789)
                      │
                      │ Level 1
                      ▼
                    Dave

When Dave makes a transfer:
- Carol: Direct referrer (Tier 1) →  30%
- Bob: Grandparent (Tier 2) →  3%
- Alice: Great-grandparent (Tier 3) →  2%

Rewards are distributed automatically when your referrals make transfers:
- No manual claiming
- No gas fees for you
- Instant settlement
- Transparent and fully on-chain  


# Referral Leaderboard
To check how you are performing against other Tessera users, you can navigate to
the 'Leaderboard' page. 
## Trading Leaderboard
The Trading Leaderboard showcases your ranking amongst other traders who have
traded Tessera tokens. 
This page also displays your total trading volume and earned points. 

## Referral Leaderboard 
As you build your referral, you will start ranking amongst other referrers in the Referral Leaderboard.
Trading volume generated by your referrals also earns you 'Trading Points'.


# Token System & Fees

## Overview
Tessera Tokens are enhanced tokens that automatically collect fees on every
transfer. 
These fees can be distributed to multiple recipients, creating sustainable revenue
streams for projects, creators, and communities.
Unlike regular tokens, Tessera Tokens use Solana's Token-2022 standard with built-in transfer fees, which includes:
- Automated Fees
- Transparent fee structure
- Fees are programmable with different rates for different users
- Built on Solana's native token program, providing maximum securityOverview2026/1/21 14:35 Docs


## Transfer
Fees are only charged when Transferred from you, not charged on the Receipt.

### Base Fee Rate
The standard fee rate is set at 0.20% per transfer.

### Maximum Fee Cap
A maximum fee amount that limits how much can be charged per transfer.

Example: Maximum 1,000 tokens per transfer
This ensures larger transfers does not result in excessive fees paid.

- Scenario A: Transfer 100,000 $T
  Without cap: 200 $T fee (0.2%)
  With 1,000 cap: 200 $T fee ✓

- Scenario B: Transfer 50,000 $T  
  Without cap: 100 $T fee (0.2%)
  With 1,000 cap: 100 $T fee ✓Base Fee Rate

# Fee Scenarios

### Scenario 1: Small Transfer
Amount: 100 $T
Fee Rate: 0.2%
Fee: 0.2 $T
Recipient: 99.8 $T


### Scenario 2: Large Transfer (Under Cap)
Amount: 50,000 $T
Fee Rate: 0.2%
Maximum Fee: 1,000 $T
Calculated Fee: 100 $T
Actual Fee: 100 $T (under cap)
Recipient: 49,900 $T

### Scenario 3: Large Transfer (At Cap)
Amount: 500,000 $T
Fee Rate: 0.2%
Maximum Fee: 1,000 $T
Calculated Fee: 1,000 $T
Actual Fee: 1,000 $T (capped)
Recipient: 499,000 $T

### Scenario 4: Ultra Large Transfer (At Cap)
Amount: 1,000,000 $T
Fee Rate: 0.2%
Maximum Fee: 1,000 $T
Calculated Fee: 2,000 $T
Actual Fee: 1,000 $T (capped)
Recipient: 999,000 $T

### Scenario 5: Whitelisted User (Large)
Amount: 10,000 $T
Base Fee Rate: 0.2%
Whitelist Reduction: 20%
Effective Fee Rate: 0.16%
Fee: 16 $T
Recipient: 9,984 $T

### Scenario 5: Whitelisted User (Large)
Amount: 1,000,000 $T
Base Fee Rate: 0.2%
Maximum Fee: 1,000 $T
Calculated Fee: 2,000 $T
Whitelist Reduction: 20%
Effective Fee Rate: 0.16%
Calculated Fee (Discount): 1,600 $T
Actual Fee: 800 $T (capped)
Fee: 800 $T
Recipient: 999,200 $T

# Additional FAQs:
- Question1: Do I pay fees when receiving tokens?
- Answer: No, only the sender pays transfer fees.

- Question2: Can fees change?
- Answer: Yes, the project can update fee rates, but all changes are transparent and visible on-chain.

- Question3: How can I check the fee before transferring?
- Answer: Most Solana wallets show the fee breakdown before you confirm

- Question4: What if I don't have enough tokens for the fee?
- Answer: The transaction will fail. Make sure you have enough tokens to cover both the amount you want to send and the fee.

- Question5: Are fees the same for everyone?
- Answer: The base fee is the same, but whitelisted users and referral participants may get reduced rates.

- Question6: Where does the fee go?
- Answer: When you transfer Tessera Tokens, the fees are split to: Your referrer, Tessera's Treasury. This creates a sustainable ecosystem where fees support development, rewards, community, and referrers.


# Auction

Tessera is committed to providing a fair and accessible launch mechanism for new
tokenized private equity assets. 

To achieve this, Tessera utilizes Meteoraʼs Alpha Vault, specifically operating in the
Pro-Rata mode, to conduct its token auctions. 

This strategy is designed to democratize access, mitigate the impact of front-
running bots, and ensure a level playing field for all community members.


## The Tessera Fair Launch Principle

The core of Tessera's auction philosophy is the **Pro-Rata distribution model**. 

This means that a participant's final token allocation is directly proportional to their
contribution to the total capital deposited in the vault. 

This eliminates the need for speed, rewarding commitment over rapid execution,
and is a fundamental component of our anti-sniper strategy.

## Key Advantages of Tessera's Auction Model
| Feature               | Description                                                                 | Benefit to User                                                     |
|-----------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------------|
| Pro-Rata Allocation   | Allocation is based on the percentage of total funds contributed, not speed. | Eliminates "gas wars" and front-running by bots.                     |
| Uniform Pricing       | All participants receive tokens at the same average entry price.            | Ensures fairness and prevents early buyers from gaining an unfair price advantage. |
| Bot Mitigation        | The Alpha Vault mechanism is whitelisted to purchase tokens before the public pool opens. | Safeguards the launch from malicious sniper bot activity.            |
| Community Alignment   | Configurable lock-up and vesting schedules encourage long-term holding.      | Promotes a stable token ecosystem supported by genuine project supporters. |

## The Tessera Auction Lifecycle

Tessera's token auction process is structured into three clear and transparent
phases, managed by the Alpha Vault smart contract. 
You can monitor the progress of any live auction, such as the tSpaceX Liquidity
Auction, directly on the Tessera platform interface.

### Phase 1: Deposit Period (Pro-Rata Contribution)
This is the window during which users can commit their capital (SOL or USDC) to
the auction.
- Mechanism: The Alpha Vault accepts deposits from whitelisted or permissionless addresses, depending on the specific launch configuration.
- UI Reference: The Auction Status panel displays the countdown until the auction ends, marking the close of the Deposit Period. The Auction Progress graph visually tracks the Total Raised amount against the target raised.
- Your Position: In the Deposit USDC panel, you can enter your contribution and click Confirm Deposit. The My Position card will immediately update to show your Deposited amount.

### Phase 2: Token Acquisition (Uniform Price Execution)
Immediately following the Deposit Period, the Alpha Vault executes the token
purchase.
- Timing: The Auction Status panel provides a separate countdown for when the Pool starts trading, which occurs shortly after the Deposit Period ends. The Alpha Vault uses this brief window to execute the purchase before the public market opens.
- Oversubscription Handling: The Pro-Rata model is designed to handle oversubscription, as indicated by the [X]x Oversubscribed label. If the total funds raised exceed the maximum buy cap, your contribution is scaled down proportionally.

- UI Reference: The My Position card provides real-time estimates:
◦Est. Alloc: Your estimated token allocation based on the current total raised.
◦Est. Refund: The estimated amount of your deposited capital that will be refunded if the auction remains oversubscribed.


### Phase 3: Token Claiming and Vesting
Once the tokens are secured by the Alpha Vault, they are prepared for distribution
to participants.

- Tessera's Configuration:Tessera may implement a Lock-up (a period before claiming begins) and a Vesting Schedule (a gradual release of tokens) to promote market stability and long-term investment.
- Claiming: After the lock-up period, participants can claim their allocated tokens via the Vesting tab on the Tessera platform interface, according to the pre-defined schedule.Phase 2: Token Acquisition (Uniform Price Execution)


## How to Participate in a Tessera Auction
1. Navigate to the Auction Tab: Select the Auction tab from the left-hand navigation bar.
2. Review Auction Status: Check the Auction Status panel for the remaining time in the Deposit Period and the current Total Raised amount.
3. Deposit Funds: In the Deposit USDC panel, enter the amount you wish to contribute and click Confirm Deposit.
4. Monitor Your Position: Use the My Position card to track your deposited amount and monitor the Est. Alloc and Est. Refund as the auction progresses.
5. Claim Tokens: Once the Claiming Period begins, navigate to the Vesting tab to claim your vested tokens.

Tessera is committed to leveraging best-in-class DeFi infrastructure like Meteora's Alpha Vault to ensure our token launches are secure, fair, and accessible to our global community.

## Alpha Vault State Lifecycle

### State Overview
1. PREPARING (0) – Initial state before deposits open.
2. DEPOSITING (1) – Users can deposit funds into the vault.
3. PURCHASING (2) – Vault capital is deployed to buy from the DLMM pool during the private window.
4. LOCKING (3) – Purchase is complete and the vault is waiting for vesting to start; deposits remain closed.
5. VESTING (4) – Allocated tokens follow the vesting schedule.
6. ENDED (5) – Vesting is complete; no further claims accrue.

### Configuration Points
- 'depositingPoint' – Opens the deposit window by transitioning PREPARING → DEPOSITING.
- 'startVestingPoint' – Marks the beginning of vesting (LOCKING → VESTING).
- 'endVestingPoint' – Declares vesting complete (VESTING → ENDED).
- 'activationPoint' – Comes from the DLMM pool; public trading begins here.
- 'preActivationDuration' – Hard-coded to 1 hour on both devnet and mainnet; allows the vault to purchase before public trading. This parameter is not configurable within the Meteora SDK or Tessera configuration files.

### FAQs
1. **What triggers DEPOSITING → PURCHASING?** There is no extra config flag for this transition. The vault automatically moves into PURCHASING so it can deploy capital during the pre-activation window before the pool activates.
2. **Does the vault wait for activationPoint before buying?** No. The vault reads both 'activationPoint' and 'preActivationDuration' directly from the pool account and starts purchasing during the one-hour pre-activation window so that allocations are finalized before public trading begins.
3. **How are fillVault purchases executed?** Tessera's managed cranker service calls 'fillVault()' automatically once the deposit phase ends. Manual intervention is only needed as a fallback if the cranker fails.
4. **What happens if the cranker misses 'fillVault()'?** The vault will not be stuck in DEPOSITING. Team members can manually call 'fillVault()' to complete the purchase even if the automated cranker missed the window.
5. **Can users keep depositing while PURCHASING is in progress?** No. Deposits close when the vault leaves DEPOSITING; the purchasing window is exclusively for executing the buy, so the UI should indicate deposits are locked.
6. **What does the full lifecycle timeline look like?**
   - Deposits open at 'depositingPoint' and remain open until 'activationPoint - preActivationDuration'.
   - The vault purchases from 'activationPoint - preActivationDuration' up to 'activationPoint', ahead of the pool opening.
   - Public trading begins at 'activationPoint'.
   - Vesting begins at 'startVestingPoint' and ends at 'endVestingPoint'.

This lifecycle summary should be used for Alpha Vault support responses and to keep UI copy aligned with the actual contract behavior.

# Buy/Sell
Similar to 'Transfer', there would be a base fee rate of 0.2% per sell initiated.

## Fee Scenarios
Assuming 1 USDC is equal to 1 Tessera token or vice versa for this 'Buy/Sell' example
below. We will use $T ticker to represent Tessera tokens.

### Scenario 1: Small Buy/Sell (From USDC -> Tessera tokens)
36Amount: 100 USDC
Fee Rate: 0.0%
Actual Fee: 0 $T
Recipient: 100 $T

### Scenario 2: Small Buy/Sell (From Tessera tokens to USDC)
Amount: 100 $T
Fee Rate: 0.2%
Actual Fee: 0.2 $T
Recipient: 98 USDC

### Scenario 3: Ultra Large Buy/Sell (At Cap)
Amount: 1,000,000 $T (~1,000,000 USDC)
Fee Rate: 0.2%
Maximum Fee: 1,000 $T
Calculated Fee: 2,000 $T
Actual Fee: 1,000 $T (capped); ~10 SOL
Recipient: 998,000 USDC

### Scenario 4: Whitelisted User Buy/Sell (From Tessera Tokens to USDC)
Amount: 100 $T (~100 USDC)
Base Fee Rate: 0.2%
Whitelist Reduction: 20%
Effective Fee Rate: 0.16%
Calculated Fee: 16 $T
Recipient: 99.84 USDC

### Scenario 5: Whitelisted User (Large Buy/Sell)
Amount: 1,000,000 $T
Base Fee Rate: 0.2%
Maximum Fee: 1,000 $T
Calculated Fee: 2,000 $T
Whitelist Reduction: 20%
Effective Fee Rate: 0.16%
Calculated Fee (Discount): 1,600 $T
Actual Fee: 800 $T (capped) (~8 SOL)
Recipient: 998,000 USDC

# Additional FAQs:
- Question1: When trading, do I pay fees if I buy or sell?
- Answer: You only pay fees if you are swapping Tessera tokens to other assets. If you are buying from USDC to any Tessera PE tokens, there won't be any fees applied.

- Question2: How can I check the rate before the trade? 
- Answer: You only pay fees if you are swapping Tessera tokens to other assets. If you are buying from USDC to any Tessera PE tokens, there won't be any fees applied.

- Question3:What if I don't have enough tokens for the fee?

- Answer3: The transaction will fail. Make sure you have enough tokens to cover both the amount you want to send and the fee.

## Market Data
Within 'Market Data', you can quickly glance at the:
- Total Market Cap
- T-Token Supply (E.g: T-SpaceX Supply)
- T-Token Price (E.g: T-SpaceX Price)
- Supported chains
- On-chain Address of the T-Token
- Category of the T-Token
- Underlying Asset Name
- Underlying Asset Company
- Shares per Tokens (1 T-Token = X number of Equity)
You can change the T-Token to another T-Token to check its individual market data.
From the screenshot above, it's showing SpaceX, which you can change to other
PE assets, e.g., Kalshi, to show its market data.

# Tessera Dashboard

## Asset Transparency
To ensure maximum transparency and backing of the tokens with the actual underlying equities, we will upload the custodian attestations here. 
This is also followed by the oracle, which verifies off-chain data proving the backing of the asset.
All auditors involved in signing off on the attestations of the proof of reserve, which will be shown on this page.


# My Dashboard

You can navigate to the 'My Dashboard' section to check your existing portfolio and Tessera points.

## Dashboard
"My Dashboard" displays all on-chain interactions that occurred on your address. Please note that only Tessera assets will be included; non-Tessera token interactions will not be shown here. 

# Trade

Tessera tokens are SOL based tokens, which can be traded on other platforms like Solflare, Jupiter or others granted if you have the token address (Which can be found on the 'Market Data' page)
Any transactions that involves Tessera tokens will be shown here even though the trades are opened elsewhere. 

There would be several supported DeFi operation types for 'Trade':
- Buy
- Sell

For more complete information on every single operations, visit your 'Portfolio' page.
Clicking on the specific row opens the Solscan history which you can check the transaction on-chain.

Tessera does not provide any buy or sell functionality other than Redemption. The
website only offers a shortcut link to secondary markets that we have identified. 
Transaction fees may apply when tokens are transferred.2026/1/21 14:35 Docs

# Redemption

## Redemption overview
When a Tessera-linked underlying company experiences a Liquidity Event, Tessera enables eligible token holders to redeem their tokens for proceeds derived from that event. 

Redemption bridges real-world liquidity outcomes with on-chain settlement, subject to clearly defined terms and time windows.

A company that has completed an IPO or undergone another qualifying Liquidity Event no longer retains private equity status with respect to that event. However, Tessera tokens may continue to trade on secondary markets unless and until redemption occurs, subject to the Terms and Conditions.

## What Triggers Redemption
Redemption is only available during a formally announced Redemption Period, which begins after all of the following conditions are met:
1. A Liquidity Event has occurred, defined as either:
- An IPO, where the underlying company goes public on a recognized stock exchange
- A Change of Control, where more than 50% of voting control is acquired, or the company is sold or merged.
2. Tessera has received the proceeds from that Liquidity Event.
3. Tessera has announced the official Redemption Start Date.
No redemption is possible before these conditions are satisfied.

## Redemption Mechanics
Redemption connects off-chain liquidity events to on-chain payouts through the following process:
1. Following a Liquidity Event, the relevant SPV exits all or part of its equity position in the underlying company, in accordance with the applicable structure.
2. Proceeds from the exit are converted into stablecoins.
3. The stablecoin proceeds are allocated to token holders pro rata, based on their share of the total token supply for the relevant SPV.
- For example, holding 1% of the token supply entitles you to 1% of the distributable proceeds from that SPV.
4. Token holders may redeem by burning their eligible Tessera tokens during the Redemption Period in exchange for their allocated proceeds.
5. Depending on the specific structure, tokens may be fully extinguished upon redemption or may continue to represent residual rights if the SPV retains other positions.

## Redemption Period and Deadlines
The Redemption Period lasts for a fixed number of days, as specified in the applicable Loan Series Supplement, starting from the Redemption Start Date.

### Critical Notice
If you do not redeem your tokens within the Redemption Period:
Any unclaimed redemption amounts cease to be claimable Tessera reserves the right to forfeit unclaimed proceeds. You may permanently lose your funds

## Trading Before and After Redemption
- Tessera’s Terms and Conditions do not prohibit secondary market trading of tokens prior to redemption.
- You may sell your tokens before redemption if you can find a willing buyer.
- Transaction and transfer fees may apply when tokens are transferred.
- Trading availability does not guarantee liquidity.

## FAQs
- Question1: Can I redeem my tokens immediately after an IPO?
- Answer1: No. Redemption only becomes available after a Liquidity Event has occurred, Tessera has received the proceeds, and the Redemption Start Date has been formally announced.

- Question2: How long do I have to redeem my tokens?
- Answer2: Only for the duration of the Redemption Period, which is defined in the relevant Loan Series Supplement.

- Question3: What happens if the company never goes public?
- Answer3: Redemption will not occur unless a qualifying Liquidity Event takes place. Tokens may continue to trade on secondary markets, subject to availability and market demand.

- Question4: Can I sell my tokens instead of redeeming them?
- Answer4: Yes, provided you can find a buyer. Secondary market trading is permitted, but not guaranteed.

- Question5: Can I convert redeemed proceeds into stock-backed tokens?
- Answer5: If Tessera offers stock-backed token options, users who have redeemed into stablecoins may choose to opt into those products at their own discretion, subject to availability and terms.

- Question6: Are there tax implications during redemption?
- Answer6: Redemption may constitute a taxable event depending on your jurisdiction, residency, and tax status. Proceeds may be subject to withholding taxes where applicable. You are solely responsible for determining and complying with your tax obligations. Tessera strongly recommends consulting a qualified tax advisor.

# Supported Wallets & Chains

The wallet that we are supporting includes:
- Phantom
- Brave Wallet
- Metamask
- Solflare
Tessera currently is only available on Solana.


# Additional FAQs

## Basic Mechanics of Tessera

### Executive Summary
Tessera enables you to lend stablecoins (USDC/USDT) to Tessera Issuer Inc in exchange for Tessera Stablecoin Loan Tokens. 
Your loan funds are deployed into private market opportunities (like SpaceX, OpenAI shares). 
You can redeem your tokens for principal + interest only after a "Liquidity Event" (IPO or acquisition) occurs for the underlying asset.

** CRITICAL POINTS**:
- No guaranteed redemption timeline: You can only redeem when the underlying company has an IPO or is acquired
- Limited redemption window: After liquidity event, you have a specific period to claim funds or lose them
- No ownership rights: You're a lender to Tessera, not an investor in the underlying assets
- Geographic restrictions: Not available to US persons or residents of excluded jurisdictions

- Question 1: How does Tessera work?
- Answer1: You lend stablecoins to Tessera Issuer Inc through smart contracts. In return, you receive Tessera Stablecoin Loan Tokens representing your loan position. Tessera deploys your funds to gain exposure to private market opportunities. When those opportunities have a liquidity event (IPO/acquisition), you can redeem your tokens for principal plus interest.

- Question 2: What tokens can I lend?
- Answer2: USDC, USDT, and other stablecoins that Tessera may accept from time to time.

- Question 3: What are "Product Tokens" / "Tessera Stablecoin Loan Tokens"?
- Answer3: These are the digital tokens you receive when you lend stablecoins. They represent your loan position and can be redeemed for your principal + interest during the Redemption Period.

- Question 4: What are "Loan Series"?
- Answer 4: Each Loan Series corresponds to a specific underlying investment opportunity (e.g., Series 1 might be for SpaceX exposure, Series 2 for OpenAI). Terms may vary by series.

## Redemption & Liquidity

- Question 1: When can I get my money back?
- Answer 1:Only during the "Redemption Period," which begins after:
1. A Liquidity Event occurs (IPO or Change of Control of the underlying company)
2. Tessera receives the proceeds from that Liquidity Event
3. Tessera announces the Redemption Start Date

- Question 2: What is a "Liquidity Event"?
- Answer2: Either:
1. IPO - The underlying company goes public on a recognized stock exchange
2. Change of Control - Someone acquires >50% voting control, or the company is sold/merged

- Question 3: How long do I have to redeem?
- Answer 3: The Redemption Period lasts for a specified number of days after the Redemption Start Date (to be defined in each Loan Series Supplement).


- Question 4: What happens if I don't redeem during the Redemption Period?2026/1/21 14:35 Docs
- Answer 4: CRITICAL: After the Redemption Period expires, unclaimed redemption amounts cease to be claimable. Tessera retains the right to forfeit unclaimed amounts. You lose your funds.

- Question5: Can I sell my tokens before redemption?2026/1/21 14:35 Docs
- Answer 5: The T&Cs don't prohibit secondary market trading, but you would need to find a willing buyer. Transaction fees apply when tokens are transferred.

## Returns & Fees
- Question 1: How much interest do I earn?
- Answer 1: Interest rate is calculated as a percentage of the Liquidity Event Proceeds. Specific rates will be detailed in each Loan Series Supplement.

- Question 2: What denomination will I receive for redemption?
- Answer2: Redemption will be in one of the acceptable stablecoins at the time of redemption, determined by Tessera at its discretion (not necessarily the same stablecoin you originally deposited).

- Question 3: What fees do I pay?
- Answer3:  Transaction Fees on each transaction (lending and redemption). Transfer Fees when sending tokens to another address (charged as % of amount transferred). Network Fees (blockchain gas fees) for all transactions


## Access & Eligibility
### Question 1: Who cannot use Tessera?
You CANNOT use Tessera if you are:
- A U.S. person (citizen, resident, or entity organized in the US)
- Located in or resident of: China, North Korea, Russia, Iran, Belarus, and other excluded jurisdictions
- On UN sanctions lists
- In a jurisdiction where Tessera would require licensing

### Question 2: How do I access Tessera?
- Answer 2: Two ways:
1. Website Access - Through the Tessera website at www.tessera.pe
2. Direct Access - Via command line, smart contract explorers, or other technical methods


### 3: What wallet do I need?
- Answer3: Any "Tessera-compatible wallet" that can connect to the Tessera smart contracts (specific wallet requirements to be detailed in documentation).

# Risks & Legal
### 1: What are the main risks?
- Liquidity risk - No redemption until a Liquidity Event occurs (could be years or never)
- Forfeiture risk - Missing the Redemption Period means losing your funds
- Smart contract risk - Bugs, exploits, or malfunctions could result in loss
- No FDIC/insurance - Your loan is unsecured
- Regulatory risk - Uncertain legal/regulatory status of crypto lending
- Market risk - Value of tokens on secondary markets may fluctuate
- Counterparty risk - You're lending to Tessera Issuer Inc (Panama company)
### 2: Am I an investor in the underlying companies (SpaceX, OpenAI, etc.)?
- No. You have NO ownership, voting rights, dividend rights, or any economic interest in the underlying companies. You are purely a lender to Tessera Issuer Inc.
### 3: What if the underlying investment fails or loses value?
- You could lose some or all of your principal. Tessera makes no guarantees about returns or even principal repayment.
### 4: What if there's a hack or smart contract exploit?
- Tessera and its affiliates are not liable for losses from hacks, exploits, bugs, or smart contract failures. You bear all such risks.
### 5: What about my private keys?
- You are 100% responsible for securing your wallet private keys. Anyone who obtains your keys can access your funds. Tessera is not responsible for losses from compromised keys.

# Tax & Compliance
### 1: Do I need to pay taxes?
- Yes. You are solely responsible for determining tax implications and reporting requirements in your jurisdiction.

###2: Is this a security?
- No. This is a loan product - you're lending stablecoins to Tessera Issuer Inc and receiving tokens representing your loan position. You have no ownership, voting rights, or economic interest in the underlying assets. However, regulatory treatment of digital asset lending remains uncertain, so consult your legal advisors.

# Important Disclaimers
### 1: Is this financial advice?
- No. Nothing in the T&Cs or platform constitutes investment, financial, legal, or tax advice. Consult your own advisors.
### 2: Are there any guarantees?
- No. The platform is provided "AS-IS" with no warranties. No guarantee of:
- Redemption timing or amount
- Platform availability or uptime
- Security from bugs or exploits
- Any specific returns

# Where to Find More Information
- Full documentation: https://www.tessera.pe
- Loan Series specific terms: Check individual Supplements
- Smart contract details: Available through blockchain explorers
- Based on: Draft Terms & Conditions dated September 5, 2025
- This summary is subject to change without notice
- Always refer to the official, most current Terms & Conditions
- ⚠ Final Warning: This is a high-risk product with no guaranteed liquidity, no regulatory oversight, and potential total loss of capital. 
- Only participate with funds you can afford to lose completely. This summary is not legal or financial advice.

# Document Information
Official Links
Website: https://www.tessera.fun/
𝕏: https://x.com/tessera_pe
Telegram: https://t.me/tesseraPE
Terms & Conditions: https://www.tessera.pe/terms

---

**End of Document**`

const SYSTEM_PROMPT = `You are Tessera AI, a friendly and knowledgeable assistant for the Tessera platform - a decentralized private-equity platform that makes ownership in private companies accessible to everyone through tokenization on Solana.

Use the following knowledge base as your reference:

---
${TESSERA_KNOWLEDGE_BASE}
---

**Important Guidelines:**

1. **Do NOT copy text directly from the knowledge base.** Instead, understand the information and explain it in your own words in a natural, conversational way.

2. **Be concise but helpful.** Provide clear, easy-to-understand answers. Use bullet points or numbered lists when explaining multiple steps or features.

3. **Use markdown formatting** for better readability:
   - Use **bold** for emphasis
   - Use bullet points for lists
   - Use numbered lists for step-by-step instructions
   - Use code blocks for technical terms when appropriate

4. **Respond in the same language as the user's question.** If the user asks in Chinese, respond in Chinese. If in English, respond in English.

5. **If a question is NOT covered in the ${TESSERA_KNOWLEDGE_BASE}**, politely say you don't have that specific information and suggest:
   - Joining the Telegram community
   - Contacting support via Telegram
   - Visiting the website: https://www.tessera.pe/

6. **Be personable and helpful**, not robotic. You're here to help users understand Tessera and solve their problems.`

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiToken = env.CLOUDFLARE_AI_TOKEN
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || 'b2f75eee8466291920000d9b28137185'

  if (!apiToken) {
    return Response.json({ error: 'Cloudflare AI token is not configured' }, { status: 500 })
  }

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { messages, stream = false } = body

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: 'Messages array is required' }, { status: 400 })
  }

  // Prepend system prompt - frontend sends user/assistant messages, we add system
  const fullMessages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-10)]

  // Use Cloudflare AI REST API /run endpoint
  // Note: gpt-oss-120b doesn't support streaming well, always use non-streaming
  const cfAIResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/openai/gpt-oss-120b`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: fullMessages,
        max_tokens: 1000,
        stream: false, // gpt-oss-120b doesn't support SSE streaming
      }),
    }
  )

  if (!cfAIResponse.ok) {
    const errorData = await cfAIResponse.json()
    return Response.json(
      {
        error:
          (errorData as { errors?: Array<{ message?: string }> }).errors?.[0]?.message || 'Failed to get AI response',
      },
      { status: cfAIResponse.status }
    )
  }

  // Transform Responses API format to OpenAI format
  type ResponsesAPIOutput = {
    result?: {
      output?: Array<{
        type: string
        content?: Array<{
          type: string
          text?: string
        }>
      }>
      response?: string
    }
    success?: boolean
  }

  const data = (await cfAIResponse.json()) as ResponsesAPIOutput

  // Extract content from Responses API format
  let content = ''
  if (data.result?.output) {
    // Find the message output (not reasoning)
    const messageOutput = data.result.output.find((o) => o.type === 'message')
    const textContent = messageOutput?.content?.find((c) => c.type === 'output_text')
    content = textContent?.text || ''
  } else if (data.result?.response) {
    content = data.result.response
  }

  // If streaming was requested, simulate streaming by chunking the response
  if (stream && content) {
    const encoder = new TextEncoder()

    // Split content into words for more natural streaming
    const words = content.split(/(\s+)/)
    let wordIndex = 0

    const transformStream = new ReadableStream({
      async start(controller) {
        // Stream words in small batches for natural feel
        while (wordIndex < words.length) {
          // Send 1-3 words at a time
          const batchSize = Math.min(Math.floor(Math.random() * 3) + 1, words.length - wordIndex)
          const batch = words.slice(wordIndex, wordIndex + batchSize).join('')
          wordIndex += batchSize

          if (batch) {
            const chunk = {
              choices: [{ delta: { content: batch } }],
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          }

          // Small delay between chunks for natural streaming feel
          await new Promise((resolve) => setTimeout(resolve, 20))
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(transformStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // Non-streaming response
  return Response.json({
    choices: [
      {
        message: {
          role: 'assistant',
          content,
        },
      },
    ],
  })
}
