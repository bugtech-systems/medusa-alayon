"use client";

import { createProduct } from "@/lib/actions";
import { CompanyDTO } from "@/lib/types";
import { HttpTypes } from "@medusajs/types";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@medusajs/ui";
import { useState, useTransition } from "react";

export function CreateProductForm({
  company,
  categories,
}: {
  company: CompanyDTO;
  categories: HttpTypes.StoreProductCategory[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProduct({}, formData);
      setMessage(result?.message ?? null);
    });
  };

  return (
    <form className="flex flex-col gap-3" action={action}>
      <input
        type="hidden"
        name="company_id"
        value={company.id}
      />

      <Field name="title" label="Title" placeholder="Product title" />

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Product description"
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select name="category_id">
          <Select.Trigger>
            <Select.Value placeholder="Select a category" />
          </Select.Trigger>
          <Select.Content className="z-[50]">
            {categories.map((category) => (
              <Select.Item key={category.id} value={category.id}>
                {category.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <Field
        name="price"
        label="Price"
        placeholder="0.00"
      />

      <div>
        <Label htmlFor="image">Upload image</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="p-2 h-fit"
        />
      </div>

      <Button
        type="submit"
        isLoading={isPending}
          disabled={isPending}
        className="self-end mt-4"
      >
        Create Product
      </Button>

      {message && (
        <Badge className="justify-center text-center">
          {message}
        </Badge>
      )}
    </form>
  );
}

/* ---------------- Small Helper ---------------- */

function Field({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="w-full">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} />
    </div>
  );
}
