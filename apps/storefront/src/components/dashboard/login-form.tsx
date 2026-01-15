"use client";

import { BikeIcon, PizzaIcon } from "@/components/common/icons";
import { login } from "@/lib/actions";
import { Spinner } from "@medusajs/icons";
import { Badge, Button, Input, Label, Select } from "@medusajs/ui";
import { Link } from "next-view-transitions";
import { useState, useTransition } from "react";

/* ---------------- Default Login ---------------- */

function DefaultLoginForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await login({}, formData);
      setMessage(result?.message ?? null);
    });
  };

  return (
    <form action={action} className="flex flex-col gap-4 max-w-96">
      <div className="flex flex-col gap-2">
        <Field id="email" label="Email" type="email" />
        <Field id="password" label="Password" type="password" />

        <div>
          <Label htmlFor="actor_type">I&apos;m a...</Label>
          <Select name="actor_type">
            <Select.Trigger>
              <Select.Value placeholder="Select role" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="restaurant">Restaurant</Select.Item>
              <Select.Item value="driver">Driver</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Link href="/signup">
          <Button variant="transparent" size="large">
            Create account
          </Button>
        </Link>

        <Button
          type="submit"
          size="large"
          isLoading={isPending}
          disabled={isPending}
        >
          Login
        </Button>
      </div>

      {message && (
        <Badge className="justify-center text-center">{message}</Badge>
      )}
    </form>
  );
}

/* ---------------- Demo Login ---------------- */

function DemoLoginForm() {
  const [isLoading, setIsLoading] = useState({
    restaurant: false,
    driver: false,
  });

  const loginAs = async (actor_type: "restaurant" | "driver") => {
    setIsLoading((prev) => ({ ...prev, [actor_type]: true }));

    const credentials = new FormData();
    credentials.set("email", `${actor_type}@account.com`);
    credentials.set("password", "123");
    credentials.set("actor_type", actor_type);

    try {
      await login({}, credentials);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [actor_type]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-3 items-center">
      <Button size="xlarge" onClick={() => loginAs("restaurant")}>
        {isLoading.restaurant ? (
          <Spinner className="animate-spin" />
        ) : (
          <PizzaIcon />
        )}
        Log in as a Restaurant
      </Button>

      <Button size="xlarge" onClick={() => loginAs("driver")}>
        {isLoading.driver ? <Spinner className="animate-spin" /> : <BikeIcon />}
        Log in as a Driver
      </Button>
    </div>
  );
}

/* ---------------- Public Entry ---------------- */

export function LoginForm() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
    <DemoLoginForm />
  ) : (
    <DefaultLoginForm />
  );
}

/* ---------------- Small Helper ---------------- */

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
