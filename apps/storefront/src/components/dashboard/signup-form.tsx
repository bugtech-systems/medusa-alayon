"use client";

import { signup } from "@/lib/actions";
import { CompanyDTO } from "@/lib/types";
import { Badge, Button, Input, Label, Select } from "@medusajs/ui";
import { Link } from "next-view-transitions";
import { useState, useTransition } from "react";

const userTypes = [
  { value: "driver", label: "Driver" },
  { value: "company", label: "Merchant" },
];

export function SignupForm({
  companies = [],
}: {
  companies: CompanyDTO[];
}) {
  const [userType, setUserType] = useState("company");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await signup({}, formData);
      setMessage(result?.message ?? null);
    });
  };

  return (
    <form action={action} className="flex flex-col gap-4 max-w-96">
      <div className="flex flex-col gap-2">
        {/* User type */}
        <Select name="user_type" onValueChange={setUserType}>
          <Select.Trigger>
            <Select.Value placeholder="I'm a..." />
          </Select.Trigger>
          <Select.Content>
            {userTypes.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>

        {/* Restaurant */}
        {userType === "company" && (
          <Select name="company_id">
            <Select.Trigger>
              <Select.Value placeholder="Select Company" />
            </Select.Trigger>
            <Select.Content>
              {companies.map((company) => (
                <Select.Item key={company.id} value={company.id}>
                  {company.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        )}

        <Field id="first_name" label="First Name" />
        <Field id="last_name" label="Last Name" />
        <Field id="email" label="Email" type="email" />
        <Field id="phone" label="Phone" />
        <Field id="password" label="Password" type="password" />
        <Field
          id="repeat_password"
          label="Repeat Password"
          type="password"
        />
      </div>

      <div className="flex justify-between">
        <Link href="/admin/login">
          <Button variant="transparent" size="large">
            Log in
          </Button>
        </Link>

        <Button
          type="submit"
          size="large"
          isLoading={isPending}
          disabled={isPending}
        >
          Create account
        </Button>
      </div>

      {message && (
        <Badge className="justify-center text-center">{message}</Badge>
      )}
    </form>
  );
}

/* ---------------- Small helper ---------------- */

function Field({
  id,
  label,
  type = "text",
}: {
  id: string;
  label: string;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} />
    </div>
  );
}
