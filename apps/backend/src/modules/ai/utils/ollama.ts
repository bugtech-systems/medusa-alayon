import axios from "axios"

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434"

export async function generateEmbedding(input: string): Promise<number[]> {
  const { data } = await axios.post(
    `${OLLAMA_BASE_URL}/api/embed`,
    {
      model: "nomic-embed-text",
      input,
    }
  )

  return data.embeddings
}

/**
 * Streaming chat response from Ollama
 * Calls onToken(token) for every streamed chunk
 */
export async function streamChatCompletion({
  messages,
  model = "llama3.2:1b",
  onToken,
}: {
  messages: { role: string; content: string }[]
  model?: string
  onToken: (token: string) => void
}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  })

  if (!response.body) {
    throw new Error("No stream returned from Ollama")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split("\n").filter(Boolean)

    for (const line of lines) {
      const json = JSON.parse(line)
      if (json.message?.content) {
        onToken(json.message.content)
      }
    }
  }
}


export async function chatCompletion({
  messages,
  model = "llama3.2:1b"
}: {
  messages: { role: string; content: string }[]
  model?: string
}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  return response.json()
}
