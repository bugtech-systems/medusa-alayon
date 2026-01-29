// type of the product input for workflow
export interface ModuleProductInput {
  product_id: string
}

// type of AI memory item returned
export interface AiMemoryItem {
  id: string
  scope: string
  scope_id: string
  content: string
  embedding: number[]
  language?: string
}


export interface ModuleIndexProductInput {
  product_id: string
  language?: string
}

export interface ModuleAiMemory {
  id: string
  scope: string
  scope_id: string
  content: string
  embedding: number[]
  language?: string
}
