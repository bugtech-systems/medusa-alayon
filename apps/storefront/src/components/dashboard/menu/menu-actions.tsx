"use client";

import { HttpTypes, ProductCategoryDTO } from "@medusajs/types";
import { CreateCategoryDrawer } from "./create-category-drawer";
import { CreateProductDrawer } from "./create-product-drawer";
import { CompanyDTO } from "@/lib/types";

export function MenuActions({
  company,
  categories,
}: {
  company: CompanyDTO;
  categories: HttpTypes.StoreProductCategory[];
}) {
  return (
    <div className="flex gap-4">
      <CreateProductDrawer company={company} categories={categories} />
    </div>
  );
}
