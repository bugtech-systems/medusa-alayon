"use client";

import { CompanyDTO } from "@/lib/types";
import { updateCompany } from "@/lib/actions";
import { Pencil } from "@medusajs/icons";
import {
  Badge,
  Button,
  Drawer,
  Input,
  Label,
  Select,
} from "@medusajs/ui";
import { ReactNode, useState, useTransition } from "react";

/* ------------------------------------------------------------------ */
/* Drawer                                                             */
/* ------------------------------------------------------------------ */

type EditCompanyDrawerProps = {
  company: CompanyDTO;
  children?: ReactNode;
};

export function EditCompanyDrawer({
  company,
  children,
}: EditCompanyDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        {children ?? (
          <Button size="large">
            <Pencil /> Edit Company
          </Button>
        )}
      </Drawer.Trigger>

      {/* Full-height drawer */}
      <Drawer.Content className="z-50 flex flex-col h-[90vh]">
        <Drawer.Header>
          <Drawer.Title>Edit Company</Drawer.Title>
        </Drawer.Header>

        {/* Scrollable body */}
        <Drawer.Body className="flex-1 overflow-y-auto p-4">
          <CompanyForm
            company={company}
            formId="edit-company-form"
            onSuccess={() => setOpen(false)}
          />
        </Drawer.Body>

        {/* Fixed footer */}
        <Drawer.Footer className="border-t bg-ui-bg-base">
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>

          <Button type="submit" form="edit-company-form">
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                               */
/* ------------------------------------------------------------------ */

type CompanyFormProps = {
  company: CompanyDTO;
  formId: string;
  onSuccess?: () => void;
};

function CompanyForm({ company, formId, onSuccess }: CompanyFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateCompany({}, formData);

      if (result && "message" in result) {
        setMessage(result.message);
      } else {
        setMessage(null);
        onSuccess?.();
      }
    });
  };

  return (
    <form
      id={formId}
      action={action}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="company_id" value={company.id} />

      <Field name="name" label="Company Name" defaultValue={company.name} />
      <Field name="phone" label="Phone" defaultValue={company.phone ?? ""} />
      <Field name="email" label="Email" defaultValue={company.email ?? ""} />
      <Field name="address" label="Address" defaultValue={company.address ?? ""} />
      <Field name="city" label="City" defaultValue={company.city ?? ""} />
      <Field name="state" label="Province" defaultValue={company.state ?? ""} />
      <Field name="zip" label="Zip" defaultValue={company.zip ?? ""} />
      
      <div>
        <Label htmlFor="business_type">Business Type</Label>
        <Select
          name="business_type"
          defaultValue={company.business_type ?? "merchandising"}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select business type" />
          </Select.Trigger>
          <Select.Content className="z-50">
            <Select.Item value="laundry">Laundry</Select.Item>
            <Select.Item value="gas">Gas</Select.Item>
            <Select.Item value="mineral">Water</Select.Item>
            <Select.Item value="merchandising">Merchandise</Select.Item>
          </Select.Content>
        </Select>
      </div>

      <div>
        <Label htmlFor="image">Company Logo</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          
        />
      </div>

      {message && (
        <Badge className="justify-center">{message}</Badge>
      )}

      {/* Hidden submit (footer button triggers it) */}
      <Button type="submit" isLoading={isPending} className="hidden" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Field Helper                                                        */
/* ------------------------------------------------------------------ */

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="w-full">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}
