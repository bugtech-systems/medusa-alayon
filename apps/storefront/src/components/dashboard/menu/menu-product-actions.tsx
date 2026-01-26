"use client";

import { deleteProduct } from "@/lib/actions";
import { CompanyDTO } from "@/lib/types";
import {
  EllipsisHorizontal,
  PencilSquare,
  Trash,
} from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import {
  DropdownMenu,
  IconButton,
} from "@medusajs/ui";
import { useState } from "react";
import { ProductDrawer } from "./product-drawer";

export function MenuProductActions({
  product,
  company,
  categories,
}: {
  product: any;
  company: CompanyDTO;
  categories?: any;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(product.id, company.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="small">
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {/* -------- Edit -------- */}
        <DropdownMenu.Item asChild className="gap-x-2">
          <ProductDrawer
            mode="edit"
            product={product}
            company={company}
            categories={categories}
          >
            <span className="flex items-center gap-x-2">
              <PencilSquare className="text-ui-fg-subtle" />
              Edit
            </span>
          </ProductDrawer>
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        {/* -------- Delete -------- */}
        <DropdownMenu.Item
          className="gap-x-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash
            className={
              isDeleting
                ? "animate-spin"
                : "text-ui-fg-subtle"
            }
          />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
