import { sdk } from "../config";

import { DriverDTO } from "@/lib/types";
// import { getAuthHeaders,  getCacheOptions } from "./cookies";
import { getCacheHeaders, getAuthHeaders } from "../data1/cookies";

export async function retrieveDriver(driverId: string): Promise<DriverDTO> {
  const {
    driver,
  }: {
    driver: DriverDTO;
  } = await sdk.client.fetch(`/store/drivers/${driverId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCacheHeaders("drivers"),
    },
  });

  return driver;
}
