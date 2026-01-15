// medusa-config.mjs
import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";
import { QUOTE_MODULE } from "./src/modules/quote";
import { COMPANY_MODULE } from "./src/modules/company";
import { APPROVAL_MODULE } from './src/modules/approval';
import { RESTAURANT_MODULE } from "src/modules/restaurant";
import { DELIVERY_MODULE } from "src/modules/delivery";

loadEnv(process.env.NODE_ENV as any, process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: {
    [DELIVERY_MODULE]: {
      resolve: "./modules/delivery",
    },
    [RESTAURANT_MODULE]: {
      resolve: "./modules/restaurant",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [Modules.CACHE]: {
      resolve: "@medusajs/medusa/cache-inmemory",
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/medusa/workflow-engine-inmemory",
    },
    // [Modules.FULFILLMENT]: {
    //   options: {
    //     providers: [
    //       {
    //         resolve: "@medusajs/fulfillment-manual",
    //         id: "manual-provider",
    //       },
    //     ],
    //   },
    // },
  },
});
