import { supabase } from "./supabase"

export async function searchSimilar(
  embedding: number[],
  limit = 10
) {
  const { data, error } = await supabase.rpc(
    "match_documents",
    {
      query_embedding: embedding,
      match_count: limit,
    }
  )

  if (error) throw error
  return data
}

export async function searchData(
  embedding: number[],
  limit = 10
) {
  const { data, error } = await supabase.rpc(
    "match_documents",
    {
      query_embedding: embedding,
      match_count: limit,
    }
  )

  if (error) throw error
  return data
}
