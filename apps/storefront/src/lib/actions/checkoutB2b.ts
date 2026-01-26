"use server";

import { UpsertAddressDTO } from "@medusajs/types";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sdk } from "../config";
import { getCartId, removeCartId } from "../data/cookies";
import { getAuthHeaders, getCacheTag } from "../data1/cookies";
import { DeliveryDTO } from "@/lib/types";
import medusaError from "../util/medusa-error";
import { track } from "@vercel/analytics";

/* -----------------------------
   Full B2B Checkout
----------------------------- */
type CheckoutFormData = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  companyId: string;
};

export async function checkoutB2B(data: FormData) {
  const cartId = await getCartId();
  if (!cartId) return { message: "No cart found" };

  const firstName = data.get("first-name")?.toString();
  const lastName = data.get("last-name")?.toString();
  const address = data.get("address")?.toString();
  const city = data.get("city")?.toString();
  const zip = data.get("zip")?.toString();
  const phone = data.get("phone")?.toString();
  const email = data.get("email")?.toString();
  const companyId = data.get("company-id")?.toString();


//   const { firstName, lastName, address, city, zip, phone, email, companyId } = formData;

  if (!firstName || !lastName || !address || !city || !zip || !phone || !companyId) {
    return { message: "Please fill in all fields" };
  }

  const shippingAddress: UpsertAddressDTO = {
    first_name: firstName,
    last_name: lastName,
    address_1: address,
    city,
    postal_code: zip,
    phone,
  };

  try {
    const headers = await getAuthHeaders();

    // 1️⃣ Update cart shipping address
    await sdk.store.cart.update(cartId, { shipping_address: shippingAddress }, {}, headers);
    revalidateTag(getCacheTag("carts"));

    // 2️⃣ Prepare cart: attach customer and company
    await sdk.client.fetch<{ cart: any }>("/store/checkout/prepare", {
      method: "POST",
      body: { cart_id: cartId, email, phone, firstName, lastName, companyId },
      headers: { "Content-Type": "application/json", ...headers },
    });
    revalidateTag(getCacheTag("carts"));

    // 3️⃣ Ensure manual payment session exists
    const cart = await sdk.store.cart.retrieve(cartId, {}, headers);
    if (!cart.payment_sessions?.length) {
      await sdk.store.payment.initiatePaymentSession({ id: cartId }, { provider_id: "manual" }, undefined, headers);
      await sdk.store.cart.setPaymentSession(cartId, "manual", headers);
      await sdk.store.cart.authorizePayment(cartId, headers);
    }

    // 4️⃣ Complete cart → create order
    const response = await sdk.store.cart.complete(cartId, {}, headers).catch(medusaError);
    if (!response || response.type !== "order") return { message: "Error completing order" };
    const order = response.order;

    track("order_completed", { order_id: order.id });

    // 5️⃣ Create delivery
    const { delivery } = await sdk.client.fetch<{ delivery: DeliveryDTO }>("/store/deliveries", {
      method: "POST",
      body: { cart_id: cartId, company_id: companyId },
      headers: { "Content-Type": "application/json", ...headers },
    });
    revalidateTag(getCacheTag("deliveries"));

    // 6️⃣ Revalidate other cache tags
    revalidateTag(await getCacheTag("orders"));
    revalidateTag(await getCacheTag("approvals"));

    // 7️⃣ Remove local cart ID
    await removeCartId();

    // 8️⃣ Save delivery ID in cookie
    cookies().set("_medusa_delivery_id", delivery.id);

    // 9️⃣ Redirect to order confirmation page
    redirect("/your-order");

  } catch (error) {
    console.error("Error during B2B checkout:", error);
    return { message: "Error placing order" };
  }
}
