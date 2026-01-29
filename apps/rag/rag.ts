import { embed, generate } from "./ollama"
import { searchSimilar } from "./vectorSearch"
import { supabase } from "./supabase"

export async function ask(question: string) {
  // 1. Embed question
  const queryEmbedding = await embed(question)

  // 2. Retrieve context
  const docs = await searchSimilar(queryEmbedding, 10)
console.log(queryEmbedding, docs, 'WWALAAAA')
  const context = docs
    .map((d: any) => `- ${d.content}`)
    .join("\n")

  // 3. Build prompt
  const prompt = `
You are a helpful assistant.
Use the context below to answer the question.
If the answer is not in the context, say you don't know.

Context:
${context}

Question:
${question}

Answer:
`

console.log(prompt, 'PROMPTTT')

  // 4. Generate answer
  return generate(prompt)
}


export function chunkText(text: string, maxLength = 500) {
  const sentences = text.split(". ")
  const chunks: string[] = []

  let current = ""

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current)
      current = sentence
    } else {
      current += ". " + sentence
    }
  }

  if (current) chunks.push(current)

  return chunks
}

export function normalize(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
}


export async function ingest(
  text: string,
  metadata: Record<string, any>
) {
  const chunks = chunkText(normalize(text), 500)

  for (const chunk of chunks) {
    const embedding = await embed(chunk)

    await supabase.from("documents").insert({
      content: chunk,
      embedding,
      metadata,
    })
  }
}



