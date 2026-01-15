import DemoModal from "@/components/common/demo-modal";
import RestaurantCategory from "@/components/store/restaurant/restaurant-category";
import { listRestaurants } from "@/lib/data1/restaurants";
import { Heading } from "@medusajs/ui";

export default async function Home() {
  const restaurants = await listRestaurants();

  if (!restaurants) {
    return <Heading level="h1">No store open near you</Heading>;
  }

  return (
    <div className="flex flex-col gap-8">
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && <DemoModal />}
      <RestaurantCategory restaurants={restaurants} />
    </div>
  );
}
