"use client";

import { setRestaurantStatus } from "@/lib/actions";
import { CompanyDTO } from "@/lib/types";
import { Switch } from "@medusajs/ui";
import { useState } from "react";

export default function RestaurantStatus({
  company,
}: {
  company: CompanyDTO;
}) {
  const [isOpen, setIsOpen] = useState(company.is_open);

  const handleStatusChange = async () => {
    setIsOpen(!isOpen);
    await setRestaurantStatus(company.id, !isOpen);
  };

  return (
    <div className="flex items-center gap-x-2">
      <Switch
        id="manage-inventory"
        onCheckedChange={handleStatusChange}
        checked={isOpen}
      />
    </div>
  );
}
