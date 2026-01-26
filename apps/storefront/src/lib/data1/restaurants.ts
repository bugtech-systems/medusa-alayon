import { sdk } from "../config";
import { CompanyDTO } from "@/lib/types";
import { getCacheHeaders } from "./cookies";

export async function retrieveRestaurant(
  restaurantId: string
): Promise<CompanyDTO> {
  const { restaurant }: { restaurant: CompanyDTO } = await sdk.client.fetch(
    `/store/restaurants/${restaurantId}`,
    {
      method: "GET",
      headers: {
        ...getCacheHeaders("restaurants"),
      },
    }
  );

  return restaurant;
}

export async function listRestaurants(
  filter?: Record<string, string>
): Promise<CompanyDTO[]> {
  const query = new URLSearchParams(filter).toString();

  const { restaurants }: { restaurants: RestaurantDTO[] } =
    await sdk.client.fetch(`/store/restaurants?${query}`, {
      method: "GET",
      headers: {
        ...getCacheHeaders("restaurants"),
      },
    });

  return restaurants;
}

export async function retrieveRestaurantByHandle(
  handle: string
): Promise<CompanyDTO> {
  const { restaurants }: { restaurants: CompanyDTO[] } =
    await sdk.client.fetch(`/store/restaurants?handle=${handle}`, {
      method: "GET",
      headers: {
        ...getCacheHeaders("restaurants"),
      },
    });

  return restaurants[0];
}
