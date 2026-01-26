// api/query-config/ai.ts
export const adminAiModelQueryConfig = {
  list: {
    defaults: ["id", "name", "version", "system_prompt", "status", "ollama_tag", "created_at"],
  },
  retrieve: {
    defaults: ["*", "parameters"],
  },
};

export const aiSessionQueryConfig = {
  retrieve: {
    relations: ["messages"],
  },
};

export const aiMessageQueryConfig = {
  list: {
    defaults: ["id", "role", "content", "score", "created_at"],
  },
};


