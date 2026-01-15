import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows"

import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"

import type { Logger, ExecArgs } from "@medusajs/framework/types"

import dotenv from "dotenv"

import medusaEatsSeedData from "../../data/medusa-eats-seed-data.json"
import { createRestaurantWorkflow } from "../workflows/restaurant/workflows/create-restaurant"
import { createRestaurantProductsWorkflow } from "../workflows/restaurant/workflows/create-restaurant-products"

dotenv.config()

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000"

const countries = ["ph"]
const fulfillmentProviderId = "manual-provider"

/* --------------------------------
   Helpers
--------------------------------- */

async function findOrCreate<T>(
  find: () => Promise<T | undefined>,
  create: () => Promise<T>
): Promise<T> {
  const existing = await find()
  if (existing) return existing
  return create()
}

async function safeRun(fn: () => Promise<any>) {
  try {
    await fn()
  } catch {
    // intentionally ignored (already exists / already linked)
  }
}

/* --------------------------------
   Seed
--------------------------------- */

export default async function seedDemoData({
  container,
}: ExecArgs) {
  const logger = container.resolve<Logger>(
    ContainerRegistrationKeys.LOGGER
  )

  const remoteLink = container.resolve(
    ContainerRegistrationKeys.LINK
  )

  const fulfillmentService = container.resolve(
    Modules.FULFILLMENT
  )
  const salesChannelService = container.resolve(
    Modules.SALES_CHANNEL
  )
  const storeService = container.resolve(
    Modules.STORE
  )
  const regionService = container.resolve(
    Modules.REGION
  )
  const stockLocationService = container.resolve(
    Modules.STOCK_LOCATION
  )
  // const shippingProfileService = container.resolve(
  //   Modules.SHIPPING_PROFILE
  // )
  // const shippingOptionService = container.resolve(
  //   Modules.SHIPPING_OPTION
  // )
  const apiKeyService = container.resolve(
    Modules.API_KEY
  )

  logger.info("🌱 Seeding Medusa Eats demo data")

  /* --------------------------------
     Store
  --------------------------------- */

  const [store] = await storeService.listStores()
  if (!store) {
    throw new Error("Store not found")
  }

  /* --------------------------------
     Sales Channel
  --------------------------------- */

  const defaultSalesChannel = await findOrCreate(
    async () => {
      const [sc] =
        await salesChannelService.listSalesChannels({
          name: "Default Sales Channel",
        })
      return sc
    },
    async () => {
      const { result } =
        await createSalesChannelsWorkflow(container).run({
          input: {
            salesChannelsData: [
              { name: "Default Sales Channel" },
            ],
          },
        })
      return result[0]
    }
  )

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "PHP", is_default: true },
          { currency_code: "USD" },
        ],
        default_sales_channel_id:
          defaultSalesChannel.id,
      },
    },
  })

  /* --------------------------------
     Region
  --------------------------------- */

  const region = await findOrCreate(
    async () => {
      const [existing] =
        await regionService.listRegions({
          name: "Philippines",
        })
      return existing
    },
    async () => {
      const { result } =
        await createRegionsWorkflow(container).run({
          input: {
            regions: [
              {
                name: "Philippines",
                currency_code: "PHP",
                countries,
                payment_providers: [
                  "pp_system_default",
                ],
              },
            ],
          },
        })
      return result[0]
    }
  )

  await safeRun(() =>
    createTaxRegionsWorkflow(container).run({
      input: countries.map((country_code) => ({
        country_code,
      })),
    })
  )

  /* --------------------------------
     Shipping Profile
  --------------------------------- */

  // const shippingProfile = await findOrCreate(
  //   async () => {
  //     const [profile] =
  //       await shippingProfileService.listShippingProfiles(
  //         { name: "Default" }
  //       )
  //     return profile
  //   },
  //   async () => {
  //     const { result } =
  //       await createShippingProfilesWorkflow(
  //         container
  //       ).run({
  //         input: {
  //           data: [
  //             { name: "Default", type: "default" },
  //           ],
  //         },
  //       })
  //     return result[0]
  //   }
  // )

  /* --------------------------------
     Fulfillment Set
  --------------------------------- */

  const [existingSet] =
    await fulfillmentService.listFulfillmentSets({
      name: "PH Warehouse",
    })

  const fulfillmentSet =
    existingSet ??
    (await fulfillmentService.createFulfillmentSets(
      {
        name: "PH Warehouse",
        type: "shipping",
        service_zones: [
          {
            name: "Philippines",
            geo_zones: [
              {
                country_code: "ph",
                type: "country",
              },
            ],
          },
        ],
      }
    ))

  /* --------------------------------
     Stock Location
  --------------------------------- */

  const location = await findOrCreate(
    async () => {
      const [loc] =
        await stockLocationService.listStockLocations(
          { name: "Manila Warehouse" }
        )
      return loc
    },
    async () => {
      const { result } =
        await createStockLocationsWorkflow(
          container
        ).run({
          input: {
            locations: [
              {
                name: "Manila Warehouse",
                address: {
                  city: "Manila",
                  country_code: "PH",
                  address_1: "",
                },
              },
            ],
          },
        })
      return result[0]
    }
  )

  /* --------------------------------
     Remote Links
  --------------------------------- */

  await safeRun(() =>
    remoteLink.create([
      {
        [Modules.STOCK_LOCATION]: {
          stock_location_id: location.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_set_id: fulfillmentSet.id,
        },
      },
    ])
  )

  await safeRun(() =>
    remoteLink.create([
      {
        [Modules.STOCK_LOCATION]: {
          stock_location_id: location.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_provider_id:
            fulfillmentProviderId,
        },
      },
    ])
  )

  /* --------------------------------
     Shipping Option
  --------------------------------- */

  // const [existingOption] =
  //   await shippingOptionService.listShippingOptions(
  //     { name: "Standard Shipping" }
  //   )

  // if (!existingOption) {
  //   await createShippingOptionsWorkflow(
  //     container
  //   ).run({
  //     input: [
  //       {
  //         name: "Standard Shipping",
  //         price_type: "flat",
  //         provider_id: fulfillmentProviderId,
  //         service_zone_id:
  //           fulfillmentSet.service_zones[0].id,
  //         shipping_profile_id:
  //           shippingProfile.id,
  //         type: {
  //           label: "Standard",
  //           code: "standard",
  //         },
  //         prices: [
  //           {
  //             region_id: region.id,
  //             amount: 100,
  //           },
  //         ],
  //       },
  //     ],
  //   })
  // }

  /* --------------------------------
     API Key
  --------------------------------- */

  const apiKey = await findOrCreate(
    async () => {
      const [key] =
        await apiKeyService.listApiKeys({
          title: "Webshop",
        })
      return key
    },
    async () => {
      const { result } =
        await createApiKeysWorkflow(
          container
        ).run({
          input: {
            api_keys: [
              {
                title: "Webshop",
                type: "publishable",
                created_by: ""
              },
            ],
          },
        })
      return result[0]
    }
  )

  await safeRun(() =>
    linkSalesChannelsToApiKeyWorkflow(
      container
    ).run({
      input: {
        id: apiKey.id,
        add: [defaultSalesChannel.id],
      },
    })
  )

  /* --------------------------------
     Restaurant
  --------------------------------- */

  const restaurantInput = {
    ...medusaEatsSeedData.restaurant,
    image_url:
      FRONTEND_URL +
      medusaEatsSeedData.restaurant.image_url,
  }

  const { result: restaurant } =
    await createRestaurantWorkflow(
      container
    ).run({
      input: { restaurant: restaurantInput },
    })

  /* --------------------------------
     Categories
  --------------------------------- */

  const { result: categories } =
    await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories:
          medusaEatsSeedData.categories,
      },
    })

  /* --------------------------------
     Products
  --------------------------------- */

  const products =
    medusaEatsSeedData.products.map(
      (product) => {
        const category = categories.find(
          (c) =>
            c.handle === product.category
        )

        return {
          ...product,
          category_ids: [category!.id],
          thumbnail:
            FRONTEND_URL + product.thumbnail,
          status: ProductStatus.PUBLISHED,
          sales_channels: [
            { id: defaultSalesChannel.id },
          ],
          options: [
            {
              title: "Default",
              values: ["Standard"],
            },
          ],
          variants: product.variants.map((variant) => {
            return {
              title: variant.title,
              sku: variant.sku,
              prices: variant.prices,
              options: {
                Default: "Standard",
              }
            }
          }),
        }
      }
    )

  await createRestaurantProductsWorkflow(
    container
  ).run({
    input: {
      restaurant_id: restaurant.id,
      products,
    },
  })

  logger.info("✅ Medusa Eats seed completed")
}
