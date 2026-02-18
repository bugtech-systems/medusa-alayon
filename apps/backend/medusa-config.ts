import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";
import { QUOTE_MODULE } from "./src/modules/quote";
import { COMPANY_MODULE } from "./src/modules/company";
import { APPROVAL_MODULE } from './src/modules/approval';
import { DELIVERY_MODULE } from "src/modules/delivery/index";
import { AI_MODULE } from "@/modules/ai";
import { ACTION_ENGINE_MODULE } from "@/modules/action-engine";
import { DYNAMIC_QUERY_MODULE } from "@/modules/dynamic-query";

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
    [ACTION_ENGINE_MODULE]: { 
    resolve: "./modules/action-engine",
    options: { 
          connection_url: process.env.DATABASE_URL,
          max_connections: 20,
          idle_timeout_ms: 30000,
          connection_timeout_ms: 5000,
          ssl: process.env.NODE_ENV === 'production'
      },
    },
    [DELIVERY_MODULE]: { resolve: "./modules/delivery" },
    [APPROVAL_MODULE]: { resolve: "./modules/approval" },
    [COMPANY_MODULE]: { resolve: "./modules/company" },
    [QUOTE_MODULE]: { resolve: "./modules/quote" },
    [AI_MODULE]: { resolve: "./modules/ai" },
    [DYNAMIC_QUERY_MODULE]: { resolve: "./modules/dynamic-query" },
    [Modules.CACHE]: { resolve: "@medusajs/medusa/cache-inmemory" },
    [Modules.WORKFLOW_ENGINE]: { resolve: "@medusajs/medusa/workflow-engine-inmemory" },
    [Modules.FULFILLMENT]: {
      options: {
        providers: [
          { resolve: "@medusajs/fulfillment-manual", id: "manual-provider" }
        ],
      },
    },
    [Modules.FILE]: {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "uploads",
              backend_url: 'http://localhost:9001/static'
            },
          },
        ],
      },
    },
    
  }
});
