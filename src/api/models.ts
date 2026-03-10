import api from './index'

export interface Model {
  id: string
  object: string
  created: number
  owned_by: string
}

export interface ModelsResponse {
  object: string
  data: Model[]
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export const listModels = () =>
  api.get<ModelsResponse>('/v1/models')

// Non-streaming chat
export const chatCompletions = (req: ChatRequest) =>
  api.post('/v1/chat/completions', { ...req, stream: false })

// Streaming chat — returns raw fetch for SSE
export const chatCompletionsStream = async (
  req: ChatRequest,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) => {
  const token = localStorage.getItem('jwt_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...req, stream: true }),
    })

    if (!res.ok || !res.body) {
      onError(new Error(`HTTP ${res.status}`))
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    const read = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { onDone(); break }
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') { onDone(); return }
          try {
            const json = JSON.parse(data)
            const text = json.choices?.[0]?.delta?.content ?? ''
            if (text) onChunk(text)
          } catch { /* skip */ }
        }
      }
    }
    await read()
  } catch (err) {
    onError(err as Error)
  }
}
