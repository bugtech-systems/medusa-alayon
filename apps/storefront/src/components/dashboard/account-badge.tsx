import {
  DeliveryDTO,
  DeliveryStatus,
  DriverDTO,
  CompanyDTO,
} from "@/lib/types";
import { Badge, Text } from "@medusajs/ui";
import Image from "next/image";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9001";

async function getDeliveries(query: string) {
  const { deliveries } = await fetch(
    `${BACKEND_URL}/deliveries?${query}&delivery_status=${DeliveryStatus.DELIVERED}`,
    {
      next: {
        tags: ["deliveries"],
      },
    }
  ).then((res) => res.json());
  return deliveries;
}

export default async function AccountBadge({
  data,
  type,
}: {
  data: DriverDTO | CompanyDTO;
  type: "driver" | "company";
}) {
  let name = "";

  if (type === "driver") {
    const driver = data as DriverDTO;
    name = driver.first_name + " " + driver.last_name;
  }

  if (type === "company") {
    const restaurant = data as CompanyDTO;
    name = restaurant.name;
  }

  return (
    <div className="flex flex-col justify-between">
      <div className="flex gap-4 items-center">
        <div className="flex flex-col h-fit gap-2 md:text-right justify-between">
          <Text className="font-semibold">{name}</Text>
          <Text>{data.email}</Text>
          <Text>{data.phone}</Text>
        </div>
        <Image
          src={
            "https://robohash.org/" +
            data.id +
            "?size=200x200&set=set1&bgset=bg1"
          }
          alt={name}
          className="h-28 w-28 rounded-full border-2 border-ui-border-base"
          width={200}
          height={200}
        />
      </div>
    </div>
  );
}
