"use server";

import { retrieveSession } from "@/lib/data1/sessions";
import { CompanyDTO, CompanyProductDTO } from "@/lib/types";
import { promises as fs } from "fs";
import {  revalidateTag } from "next/cache";
import { sdk } from "../config";
import { getAuthHeaders, getCacheTag } from "../data1/cookies";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9001";
const FRONTEND_URL =
  (process.env.NEXT_PUBLIC_VERCEL_URL &&
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`) ||
  "http://localhost:8001";



export async function updateCompany(
  prevState: any,
  companyData: FormData
): Promise<CompanyDTO | { message: string }> {
  const companyId = companyData.get("company_id") as string;
    const image = companyData.get("image") as File;
  const fileName = image?.name;


  if (image) {
    await saveFile(image, fileName as string);
  }

  if (fileName && fileName != "undefined") {
    companyData.set("logo_url", `${FRONTEND_URL}/${fileName}`);
  }

  companyData.delete("image");
  
console.log(fileName, image, 'IMAGGE ', fileName != 'undefined')

  // Remove non-company fields
  companyData.delete("company_id");

  const updateData: Record<string, any> = {};

  Array.from(companyData.entries()).forEach(([key, value]) => {
    // if (value === "" || value == null) return;
    updateData[key] = value;
  });
  
  
  console.log(updateData, 'UPDATE DATA')

  try {
    const { company } = await sdk.client.fetch<{ company: CompanyDTO }>(
      `/store/companies/${companyId}`,
      {
        method: "POST", // Medusa Store APIs often use POST for updates
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body:  updateData,
      }
    );

    // Revalidate company cache
    revalidateTag(await getCacheTag("companies"));

    return company;
  } catch (error) {
    console.error(error);
    return { message: "Error updating company" };
  }
}



export async function setCompanyStatus(
  companyId: string,
  status: boolean
): Promise<CompanyDTO | { message: string }> {
  try {
    const { restaurant } = await sdk.client.fetch<{
      restaurant: CompanyDTO;
    }>(`/store/companies/${companyId}/status`, {
      method: "POST",
      body: { is_open: status },
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    revalidateTag(getCacheTag("companies"));

    return restaurant;
  } catch (error) {
    return { message: "Error setting restaurant status" };
  }
}

export async function createProduct(
  prevState: any,
  createProductData: FormData
): Promise<CompanyProductDTO | { message: string }> {
  const token = await retrieveSession();
  const companyId = createProductData.get("company_id") as string;
  const image = createProductData.get("image") as File;
  const fileName = image?.name;

  if (image) {
    await saveFile(image, fileName as string);
  }

  if (fileName) {
    createProductData.set("thumbnail", `${FRONTEND_URL}/${fileName}`);
  }

  createProductData.delete("image");

  const productData: Record<string, any> = {};

  Array.from(createProductData.entries()).forEach(([key, value]) => {
    if (key === "company_id") return;

    productData[key] = value;
  });

  // Always create default variant with price
  const priceValue = createProductData.get("price");
  const amount = priceValue ? Math.round(Number(priceValue)) : 0;

  productData.variants = [
    {
      title: "Default",
      sku: `default-${Date.now()}`,
      prices: [
        {
          currency_code: "php",
          amount,
        },
      ],
    },
  ];

  // Also add options if needed
  productData.options = [
    {
      title: "Default",
      values: ["Per Load"],
    },
  ];

  try {
    const { company_product } = await sdk.client.fetch<{
      company_product: CompanyProductDTO;
    }>(`/store/companies/${companyId}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: {
        products: [productData],
      },
    });

    revalidateTag(await getCacheTag("products"));

    return company_product;
  } catch (error) {
    console.error(error);
    return { message: "Error creating product" };
  }
}


export async function updateProduct(
  prevState: any,
  updateProductData: FormData
): Promise<CompanyProductDTO | { message: string }> {
  const token = await retrieveSession();

  const companyId = updateProductData.get("company_id") as string;
  const productId = updateProductData.get("product_id") as string;
  const image = updateProductData.get("image") as File | null;

  if (image && image.size > 0) {
    const fileName = image.name;
    await saveFile(image, fileName);
    updateProductData.set("thumbnail", `${FRONTEND_URL}/${fileName}`);
  }

  // Remove non-product fields
  updateProductData.delete("image");
  updateProductData.delete("company_id");
  updateProductData.delete("product_id");

  const productData: Record<string, any> = {};

  Array.from(updateProductData.entries()).forEach(([key, value]) => {
    if (value === "" || value == null) return;

    productData[key] = value;
  });

  // Map price to first variant
  const priceValue = updateProductData.get("price");
  if (priceValue) {
    const amount = Math.round(Number(priceValue));

    // Create a default variant if none exists
    if (!productData.variants) {
      productData.variants = [
        {
          title: "Default",
          sku: `default-${Date.now()}`,
          prices: [
            {
              currency_code: "php",
              amount,
            },
          ],
        },
      ];
    } else {
      // Update first variant's price
      productData.variants[0].prices = [
        {
          currency_code: "php",
          amount,
        },
      ];
    }
  }

  try {
    const { company_product } = await sdk.client.fetch<{
      company_product: CompanyProductDTO;
    }>(`/store/companies/${companyId}/products/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: {
        products: [productData],
      },
    });

    revalidateTag(await getCacheTag("products"));

    return company_product;
  } catch (error) {
    console.error(error);
    return { message: "Error updating product" };
  }
}



async function saveFile(file: File, fileName: string) {
  const data = await file.arrayBuffer();
  await fs.appendFile(`./public/${fileName}`, Buffer.from(data));
  return;
}

export async function deleteProduct(productId: string, companyId: string) {
  try {
    await sdk.client.fetch(`/store/companies/${companyId}/products`, {
      method: "DELETE",
      body: { product_ids: [productId] },
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    revalidateTag(getCacheTag("products"));
    revalidateTag(getCacheTag("companies"));

    return true;
  } catch (error) {
    return false;
  }
}


