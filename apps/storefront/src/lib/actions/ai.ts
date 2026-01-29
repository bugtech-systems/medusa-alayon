'use server'

import { revalidateTag } from "next/cache"
import {  getAuthHeaders } from "../data/cookies";
import { sdk } from "../config";

export interface AiChatResponse {
  session_id: string
  user_message: string
  assistant_response: string
}

/**
 * Sends a message to the AI chatbot backend and returns the assistant's response.
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
  language: string = "English"
): Promise<AiChatResponse | { message: string }> {
  try {
  
  
    let res = await sdk.client.fetch<any>("/store/ai/chat", {
        method: "POST",
        body: { session_id: sessionId, message, language },
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
      });


console.log(res, 'RESSSS')

    // Optional: Revalidate AI cache tag
    revalidateTag(await getCacheTag(`ai-chat-${sessionId}`))

    return res
  } catch (error) {
    console.error("[sendChatMessage]", error)
    return { message: "Error sending chat message" }
  }
}

/**
 * Creates a new AI chat session for a user/cart.
 */
export async function createChatSession(): Promise<{ session_id: string } | { message: string }> {
  try {
    const res = await fetch(
      `/store/ai/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
      }
    )

    if (!res.ok) {
      throw new Error("Failed to create AI session")
    }

    const data = await res.json()
    revalidateTag(await getCacheTag(`ai-chat-${data.session_id}`))

    return data
  } catch (error) {
    console.error("[createChatSession]", error)
    return { message: "Error creating AI session" }
  }
}

/**
 * Optional helper to generate cache tag string
 */
async function getCacheTag(sessionId: string) {
  return `ai-chat-${sessionId}`
}
