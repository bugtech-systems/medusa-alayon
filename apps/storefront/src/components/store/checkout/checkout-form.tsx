"use client";

import { placeOrder } from "@/lib/actions";
import { checkoutB2B } from "@/lib/actions/checkoutB2b";
import { B2BCart } from "@/types";
import { HttpTypes } from "@medusajs/types";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Textarea,
} from "@medusajs/ui";
import { useState, useTransition } from "react";

export default function CheckoutForm({
  cart,
}: {
  cart: HttpTypes.StoreCart | B2BCart;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const companyId = cart.metadata?.company_id as string | undefined;

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await placeOrder({}, formData);
      setMessage(result?.message ?? null);
    });
  };

  return (
      <Container className="flex flex-col gap-4">

    <div className="flex flex-col w-full gap-3">
      <Heading>Checkout</Heading>

      <form className="flex flex-col gap-2 w-full" action={action}>
        <section className="flex gap-2 w-full">
          <Field name="first-name" label="First Name" placeholder="John" />
          <Field name="last-name" label="Last Name" placeholder="Doe" />
        </section>

        <Field name="address" label="Address" placeholder="1234 Main St" />
        <Field name="city" label="City" placeholder="San Francisco" />
        <Field name="zip" label="Zip" placeholder="94105" />
        <Field name="phone" label="Phone" placeholder="555-555-5555" />
        <Field name="email" label="Email" placeholder="john@doe.com" />

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Leave a note for the driver"
          />
        </div>

        {companyId && (
          <input
            type="hidden"
            name="company-id"
            value={companyId}
          />
        )}

        <Button
          type="submit"
          size="large"
          className="self-end mt-6"
          isLoading={isPending}
          disabled={isPending}
        >
          Place Order
        </Button>

        {message && (
          <Badge className="justify-center text-center">{message}</Badge>
        )}
      </form>
    </div>
    </Container>
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
