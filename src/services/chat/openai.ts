import { TESSERA_KNOWLEDGE_BASE } from './knowledge-base'

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

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

export type ChatHistory = Array<{ role: 'user' | 'assistant'; content: string }>

export async function sendToOpenAI(
  message: string,
  history: ChatHistory = []
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new Error('OpenAI API key is not configured')
  }

  const messages: OpenAIMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

  // Add conversation history (keep last 10 messages for context)
  for (const msg of history.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content })
  }

  // Add the current user message
  messages.push({ role: 'user', content: message })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || 'Failed to get AI response')
  }

  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content

  if (!aiResponse) {
    throw new Error('No response from AI')
  }

  return aiResponse
}

// Streaming version
export async function streamFromOpenAI(
  message: string,
  history: ChatHistory = [],
  onChunk: (chunk: string) => void
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new Error('OpenAI API key is not configured')
  }

  const messages: OpenAIMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

  // Add conversation history (keep last 10 messages for context)
  for (const msg of history.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content })
  }

  // Add the current user message
  messages.push({ role: 'user', content: message })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || 'Failed to get AI response')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullContent += content
            onChunk(content)
          }
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }

  return fullContent
}
