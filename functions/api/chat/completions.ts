import type { PagesFunction } from '@cloudflare/workers-types'

type Env = {
  OPENAI_API_KEY: string
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

## Overview

### What is Tessera?

Tessera is a **decentralized private-equity platform** designed to make ownership in the world's most valuable private companies accessible to everyone.

Through on-chain tokenization, Tessera turns historically illiquid private shares into **verifiable, tradable, and composable assets**, giving retail and institutional investors alike the ability to participate in pre-IPO growth without barriers.

### Problem

Private equity is one of the world's best-performing asset classes, yet it remains fundamentally inaccessible:

- **Exclusivity**: Only accredited investors, those earning over $200K annually or with a net worth above $1M, can participate directly.
- **High minimums**: Existing platforms require investments of $100K or more.
- **Illiquidity**: Settlements can take weeks, and investors are often locked in for years.

This structure locks 99% of the global population out of a $7 trillion market that consistently outperforms public equities by more than 4% per year.

### Opportunities

Tessera sits at the intersection of two unstoppable trends: the tokenization of real-world assets (RWAs) and the democratization of private markets.

By bringing private equity on-chain, Tessera unlocks a new financial layer where:

- **Liquidity becomes continuous**: Private shares can trade 24/7 on decentralized exchanges, giving investors real-time price discovery instead of quarterly valuations.
- **Access becomes global**: Anyone can participate permissionlessly with a wallet and as little as one dollar.
- **Transparency becomes standard**: Every asset is auditable on-chain through Chainlink Proof of Reserves and verifiable custody.
- **Composability emerges**: Private-equity tokens can integrate into DeFi ecosystems utilizing vaults, lending markets, and yield strategies to create entirely new capital-formation dynamics.

### The Vision

Tessera envisions a future where **capital markets are open by design**.

Private markets built the modern economy, but their structure favored exclusivity, opacity, and delay. Now it's possible to build a transparent, liquid, and borderless system of ownership that anyone can participate in.

In this new model:
- Private assets are discoverable and tradable in real time
- Value creation is shared, not reserved
- Liquidity is truth, and transparency is infrastructure

Tessera will launch on Solana and expand into a multi-chain network of tokenized private markets, connecting investors, institutions, and founders through a single principle: **access without compromise**.

## How it Works

### Behind the Scene

Tessera's lifecycle from real-world equity to on-chain tokens can be summarized in **SIX steps**:

1. **Equity Acquisition**: Tessera acquires private shares from existing shareholders or authorized secondary markets.

2. **SPV Formation**: The acquired equity is placed into a legally structured SPV. The SPV holds the equity, manages exits, and defines payout mechanics.

3. **1:1 Tokenization**: Tessera mints on-chain tokens that represent proportional economic exposure to the SPV. The token supply matches the equity exposure held in the SPV.

4. **Proof of Reserves**: Chainlink Proof of Reserves verifies that the SPV's holdings match the circulating token supply. No unbacked tokens can exist.

5. **Trading on Solana DEXs**: Tokens can be traded permissionlessly on Solana-based decentralized exchanges, with instant settlement and 24/7 market access.

6. **Redemption**: When an IPO, acquisition, or secondary exit occurs, the SPV liquidates its equity into stablecoins and distributes proceeds to token holders pro-rata.

### Platform Features

On the platform, you'll trade these tokens in a way that feels familiar to anyone who has used other Solana tokens. Tessera platform offers 5 key features:

- **Terminal with PE company data**: Access in-depth analysis, charts, metrics, and key data for all private equity companies tradable on Tessera.
- **Personal Dashboard & Portfolio**: Track your current holdings as well as your full history of buy and sell activity.
- **Swap**: Instantly swap any Solana-based asset into Tessera tokens.
- **Referral System**: Create referral links, track your referral data, check your total referral earnings, and monitor the trading volume of all your referred users (referees).
- **Redemption (Post-IPO)**: After a company has gone public, redeem your Tessera tokens for USDC.

## Features

### Referral Systems

Tessera uses a **'3-level referral system'** for fee sharing whereby 35% of all Tessera revenue are distributed through our referral system.

Our system uses referral codes that people can share when signing up:
- If you invite a friend and they use your code, you get a share of the fee as a reward.
- If your friend invites someone else, you get a smaller share of that next reward, too.

Referral rewards are multi-tiered, which means:
- **Level 1** (your direct invite): you earn 30% of the referral reward.
- **Level 2** (your friend's invite): you earn 3%.
- **Level 3** (your friend's friend's invite): you earn 2%.

### Token System & Fees

**Base Fee Rate**: The standard fee rate is set at **0.20%** per transfer.

Fees are only charged when Transferred from you, not charged on the Receipt.

## Socials

### Official Links

- **Website**: https://www.tessera.fun/
- **X (Twitter)**: https://x.com/tessera_pe
- **Telegram**: https://t.me/tesseraPE`

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

5. **If a question is not covered in the knowledge base**, politely say you don't have that specific information and suggest:
   - Joining the Discord community
   - Contacting support via Telegram
   - Visiting the website: https://www.tessera.fun/

6. **Be personable and helpful**, not robotic. You're here to help users understand Tessera and solve their problems.`

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.OPENAI_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'OpenAI API key is not configured' }, { status: 500 })
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

  // Prepend system prompt
  const fullMessages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-10)]

  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      max_tokens: 1000,
      temperature: 0.7,
      stream,
    }),
  })

  if (!openAIResponse.ok) {
    const errorData = await openAIResponse.json()
    return Response.json(
      { error: (errorData as { error?: { message?: string } }).error?.message || 'Failed to get AI response' },
      { status: openAIResponse.status }
    )
  }

  if (stream) {
    // For streaming, pass through the response directly
    return new Response(openAIResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // For non-streaming, return the JSON response
  const data = await openAIResponse.json()
  return Response.json(data)
}
