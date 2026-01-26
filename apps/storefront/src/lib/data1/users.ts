'use server'

import { sdk } from "../config";
import { getAuthHeaders, getCacheHeaders } from "./cookies";
import { DriverDTO, CompanyEmployeeDTO } from "@/lib/types";
import { removeAuthToken } from "../data/cookies";

export async function retrieveUser() {
  try {
    const { user } = await sdk.client.fetch<{
      user: CompanyEmployeeDTO | DriverDTO | null;
    }>("/store/users/me", {
      headers: {
        ...(await getAuthHeaders()),
        ...(await getCacheHeaders("users")),
      },
    });


    return user;
  } catch (error) {
    console.error(error, 'ERRORRR INIIII');
    
    return null;
  }
}
