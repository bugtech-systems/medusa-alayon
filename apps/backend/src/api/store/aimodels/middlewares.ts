

import {
  authenticate,
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";

import {
  AdminGetAiModels,
  AdminCreateAiModel,
  AdminUpdateAiModel,
} from "./validators";
import { adminAiModelQueryConfig } from "./query-config";


// import {
//   CreateAiSession,
//   ListAiSessions,
// } from "./validators/ai-sessions";

// import {
//   ListAiMessages,
//   RateAiMessage,
// } from "./validators/ai-messages";

// import {
//   AiChatRequest,
// } from "./validators/ai-chat";

// import {
//   VectorSearch,
//   CreateAiMemory,
// } from "./validators/ai-memory";

/**
 * Shared helper to enable SSE streaming
 */
const enableSSE = () => {
  return async (req, res, next) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    next();
  };
};

/**
 * Attach AI session context (messages, memory, model)
 */
const attachAiSessionContext = () => {
  return async (req, res, next) => {
    const service = req.scope.resolve("aiModuleService");

    if (req.body?.session_id) {
      const session = await service.retrieveAiConversationSessions(
        req.body.session_id,
        { relations: ["messages"] }
      );

      req.ai = {
        session,
        history: session.messages ?? [],
      };
    }

    next();
  };
};

/**
 * Correlate request → audit logs / workflows
 */
const attachExecutionContext = () => {
  return async (req, res, next) => {
    req.executionContext = {
      request_id: crypto.randomUUID(),
      started_at: new Date(),
      actor_id: req.user?.id,
      actor_type: req.user ? "admin" : "store",
    };
    next();
  };
};

export const aiModelsMiddlewares: MiddlewareRoute[] = [
  /**
   * ============================
   * ADMIN — AI MODELS
   * ============================
   */
  {
    matcher: "/store/aimodels",
    middlewares: [
      validateAndTransformQuery(AdminGetAiModels, adminAiModelQueryConfig.list),
    ],
  },
  {
    matcher: "/store/aimodels",
    method: "POST",
    middlewares: [
      validateAndTransformBody(AdminCreateAiModel),
      attachExecutionContext(),
    ],
  }
  // {
  //   matcher: "/store/aimodels/:id",
  //   method: "POST",
  //   middlewares: [
  //     validateAndTransformBody(AdminUpdateAiModel),
  //     attachExecutionContext(),
  //   ],
  // },

  /**
   * ============================
   * ADMIN — TRAIN / PROMOTE
   * ============================
   */
  // {
  //   matcher: "/admin/ai/models/:id/train",
  //   method: "POST",
  //   middlewares: [
  //     attachExecutionContext(),
  //   ],
  // },
  // {
  //   matcher: "/admin/ai/models/:id/promote",
  //   method: "POST",
  //   middlewares: [
  //     attachExecutionContext(),
  //   ],
  // },
  // {
  //   matcher: "/admin/ai/models/:id/fine-tune",
  //   method: "POST",
  //   middlewares: [
  //     attachExecutionContext(),
  //   ],
  // },

  /**
   * ============================
   * AI SESSIONS
   * ============================
   */
  // {
  //   matcher: "/ai/sessions",
  //   method: "POST",
  //   middlewares: [
  //     authenticate(["admin", "store"]),
  //     validateAndTransformBody(CreateAiSession),
  //   ],
  // },
  // {
  //   matcher: "/ai/sessions",
  //   method: "GET",
  //   middlewares: [
  //     authenticate(["admin", "store"]),
  //     validateAndTransformQuery(ListAiSessions),
  //   ],
  // },

  /**
   * ============================
   * AI MESSAGES
   * ============================
   */
  // {
  //   matcher: "/ai/sessions/:id/messages",
  //   method: "GET",
  //   middlewares: [
  //     authenticate(["admin", "store"]),
  //     validateAndTransformQuery(ListAiMessages),
  //   ],
  // },
  // {
  //   matcher: "/ai/messages/:id/rate",
  //   method: "POST",
  //   middlewares: [
  //     authenticate(["admin", "store"]),
  //     validateAndTransformBody(RateAiMessage),
  //     attachExecutionContext(),
  //   ],
  // },

  /**
   * ============================
   * CHAT — STREAMING (ADMIN + STORE)
   * ============================
   */
  // {
  //   matcher: ["/admin/ai/chat/stream", "/store/ai/chat/stream"],
  //   method: "POST",
  //   middlewares: [
  //     authenticate(["admin", "store"]),
  //     validateAndTransformBody(AiChatRequest),
  //     attachAiSessionContext(),
  //     attachExecutionContext(),
  //     enableSSE(),
  //   ],
  // },

  /**
   * ============================
   * CHAT — NON-STREAM
   * ============================
   */
  // {
  //   matcher: "/admin/ai/chat/tool",
  //   method: "POST",
  //   middlewares: [
  //     authenticate("admin"),
  //     validateAndTransformBody(AiChatRequest),
  //     attachAiSessionContext(),
  //     attachExecutionContext(),
  //   ],
  // },

  /**
   * ============================
   * VECTOR MEMORY
   * ============================
   */
  // {
  //   matcher: "/ai/memory",
  //   method: "POST",
  //   middlewares: [
  //     authenticate("admin"),
  //     validateAndTransformBody(CreateAiMemory),
  //     attachExecutionContext(),
  //   ],
  // },
  // {
  //   matcher: "/ai/memory/search",
  //   method: "POST",
  //   middlewares: [
  //     authenticate(["admin", "store"]),
  //     validateAndTransformBody(VectorSearch),
  //   ],
  // },
];
