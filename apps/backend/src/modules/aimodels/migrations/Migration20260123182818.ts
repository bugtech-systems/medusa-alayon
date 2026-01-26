import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260123182818 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ai_conversation_session" ("id" text not null, "model_id" text not null, "scope" text check ("scope" in ('order', 'cart', 'customer', 'admin', 'global')) not null, "scope_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_conversation_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_conversation_session_deleted_at" ON "ai_conversation_session" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_conversation_message" ("id" text not null, "role" text check ("role" in ('system', 'user', 'assistant')) not null, "content" text not null, "token_count" integer not null, "score" real not null, "session_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_conversation_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_conversation_message_session_id" ON "ai_conversation_message" ("session_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_conversation_message_deleted_at" ON "ai_conversation_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_memory" ("id" text not null, "scope" text not null, "scope_id" text not null, "content" text not null, "embedding" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_memory_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_memory_deleted_at" ON "ai_memory" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_model" ("id" text not null, "name" text not null, "version" text not null, "ollama_tag" text not null, "base_model" text not null, "modelfile" text not null, "system_prompt" text not null, "parameters" jsonb not null, "status" text check ("status" in ('draft', 'active', 'archived')) not null default 'draft', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_model_deleted_at" ON "ai_model" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_tool_execution" ("id" text not null, "tool_name" text not null, "arguments" jsonb not null, "status" text check ("status" in ('pending', 'running', 'completed', 'failed')) not null default 'pending', "result" jsonb not null, "error" text not null, "completed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_tool_execution_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_tool_execution_deleted_at" ON "ai_tool_execution" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "ai_conversation_message" add constraint "ai_conversation_message_session_id_foreign" foreign key ("session_id") references "ai_conversation_session" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ai_conversation_message" drop constraint if exists "ai_conversation_message_session_id_foreign";`);

    this.addSql(`drop table if exists "ai_conversation_session" cascade;`);

    this.addSql(`drop table if exists "ai_conversation_message" cascade;`);

    this.addSql(`drop table if exists "ai_memory" cascade;`);

    this.addSql(`drop table if exists "ai_model" cascade;`);

    this.addSql(`drop table if exists "ai_tool_execution" cascade;`);
  }

}
