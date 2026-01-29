'use server'

import { UserDTO } from "@medusajs/types";
import { sdk } from "../config";
import { getAuthHeaders, getCacheOptions } from "./cookies";
import { DriverDTO, CompanyEmployeeDTO } from "@/lib/types";

export const retrieveUser = async () => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  const next = {
    ...(await getCacheOptions("customers")),
  }

  return await sdk.client
    .fetch<{
      user: CompanyEmployeeDTO | DriverDTO | null;
    }>(`/store/users/me`, {
      method: "GET",
      query: {
        fields: "*employee, *orders",
      },
      headers,
      next,
    })
    .catch(() => null)
    
  }

export async function createAiSession(customerId?: string, cartId?: string, language = "en") {

 const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  const next = {
    ...(await getCacheOptions("session")),
  }

  return await sdk.client
    .fetch<any>(`/store/users/session`, {
      method: "POST",
      query: {
        fields: "*",
      },
      body: {
        customer_id: customerId,
        cart_id: cartId,
        language,
      },
      headers,
      next,
    })
    .catch(() => null)
}
