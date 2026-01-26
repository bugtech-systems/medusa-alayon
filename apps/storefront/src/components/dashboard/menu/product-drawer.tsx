"use client";

import {
  createProduct,
  updateProduct,
} from "@/lib/actions";
import { CompanyDTO } from "@/lib/types";
import { Plus, Pencil } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import {
  Badge,
  Button,
  Drawer,
  Input,
  Label,
  Select,
  Text,
  Textarea,
} from "@medusajs/ui";
import {
  ReactNode,
  useState,
  useTransition,
} from "react";

/* ------------------------------------------------------------------ */
/* Drawer                                                             */
/* ------------------------------------------------------------------ */

type ProductDrawerProps = {
  company: CompanyDTO;
  categories: HttpTypes.StoreProductCategory[];
  mode: "create" | "edit";
  product?: HttpTypes.StoreProduct;
  children?: ReactNode;
};

export function ProductDrawer({
  company,
  categories = [],
  mode,
  product,
  children,
}: ProductDrawerProps) {
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false); // control drawer open state

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        {children ? (
          children
        ) : (
          <Button size="large">
            {isEdit ? <Pencil /> : <Plus />}
            {isEdit ? "Edit Menu Item" : "Create Menu Item"}
          </Button>
        )}
      </Drawer.Trigger>

      <Drawer.Content className="z-50">
        <Drawer.Header>
          <Drawer.Title>
            {isEdit ? "Edit Menu Item" : "Create Menu Item"}
          </Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="p-4 flex flex-col gap-2">
          <Text>
            {isEdit
              ? "Update the menu item details."
              : "Create a new item for your menu."}
          </Text>

          <ProductForm
            mode={mode}
            company={company}
            categories={categories}
            product={product}
            formId="product-form"
            onSuccess={() => setOpen(false)} // close drawer on success
          />
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>

          <Button type="submit" form="product-form">
            {isEdit ? "Update" : "Save"}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                               */
/* ------------------------------------------------------------------ */

type ProductFormProps = {
  company: CompanyDTO;
  categories: HttpTypes.StoreProductCategory[];
  mode: "create" | "edit";
  product?: HttpTypes.StoreProduct;
  formId: string;
  onSuccess?: () => void; // callback when submit succeeds
};

function ProductForm({
  company,
  categories,
  mode,
  product,
  formId,
  onSuccess,
}: ProductFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateProduct({}, formData)
        : await createProduct({}, formData);

      if (result && "message" in result) {
        setMessage(result.message);
      } else {
        setMessage(null);
        // Close drawer on successful create/update
        if (onSuccess) onSuccess();
      }
    });
  };

  const price =
    product?.variants?.[0]?.calculated_price?.calculated_amount != null
      ? String(product.variants[0].calculated_price.calculated_amount)
      : "";

  return (
    <form
      id={formId}
      action={action}
      className="flex flex-col gap-3"
    >
      <input
        type="hidden"
        name="company_id"
        value={company.id}
      />

      {isEdit && product && (
        <input
          type="hidden"
          name="product_id"
          value={product.id}
        />
      )}

      <Field
        name="title"
        label="Title"
        defaultValue={product?.title ?? ""}
      />

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select
          name="category_id"
          defaultValue={product?.categories?.[0]?.id}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select category" />
          </Select.Trigger>
          <Select.Content className="z-50">
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
        defaultValue={price}
      />

      <div>
        <Label htmlFor="image">Image</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
        />
      </div>

      {message && (
        <Badge className="justify-center">
          {message}
        </Badge>
      )}

      {/* Hidden submit for Drawer footer */}
      <Button
        type="submit"
        isLoading={isPending}
        className="hidden"
      />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Field Helper                                                        */
/* ------------------------------------------------------------------ */

type FieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
};

function Field({ name, label, defaultValue }: FieldProps) {
  return (
    <div className="w-full">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  );
}
