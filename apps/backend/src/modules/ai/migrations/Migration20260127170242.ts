import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260127170242 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ai_conversation_message" ("id" text not null, "session_id" text not null, "role" text check ("role" in ('system', 'user', 'assistant', 'tool')) not null, "content" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_conversation_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_conversation_message_deleted_at" ON "ai_conversation_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_conversation_session" ("id" text not null, "customer_id" text null, "cart_id" text null, "language" text not null default 'en', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_conversation_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_conversation_session_deleted_at" ON "ai_conversation_session" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_memory" ("id" text not null, "scope" text not null, "scope_id" text not null, "content" text not null, "embedding" jsonb not null, "language" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_memory_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_memory_deleted_at" ON "ai_memory" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_model" ("id" text not null, "name" text not null, "provider" text not null, "model_type" text check ("model_type" in ('chat', 'embedding')) not null, "config" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_model_deleted_at" ON "ai_model" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ai_tool_execution" ("id" text not null, "session_id" text not null, "tool_name" text not null, "input" jsonb not null, "output" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_tool_execution_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_tool_execution_deleted_at" ON "ai_tool_execution" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ai_conversation_message" cascade;`);

    this.addSql(`drop table if exists "ai_conversation_session" cascade;`);

    this.addSql(`drop table if exists "ai_memory" cascade;`);

    this.addSql(`drop table if exists "ai_model" cascade;`);

    this.addSql(`drop table if exists "ai_tool_execution" cascade;`);
  }

}
