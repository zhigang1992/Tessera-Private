const API_BASE = import.meta.env.VITE_API_BASE || ''

export type ChatHistory = Array<{ role: 'user' | 'assistant'; content: string }>

export async function sendToOpenAI(message: string, history: ChatHistory = []): Promise<string> {
  // Build messages array (system prompt is added server-side)
  const messages = [
    ...history.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user' as const, content: message },
  ]

  const response = await fetch(`${API_BASE}/api/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get AI response')
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
  // Build messages array (system prompt is added server-side)
  const messages = [
    ...history.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user' as const, content: message },
  ]

  const response = await fetch(`${API_BASE}/api/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get AI response')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = '' // Buffer for incomplete lines across chunks

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // Append new data to buffer
    buffer += decoder.decode(value, { stream: true })

    // Split by newlines, keeping the last incomplete line in buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Last element might be incomplete

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

  // Process any remaining data in buffer
  if (buffer.startsWith('data: ')) {
    const data = buffer.slice(6)
    if (data !== '[DONE]') {
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) {
          fullContent += content
          onChunk(content)
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return fullContent
}
