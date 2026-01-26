import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260117172541 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "employee" add column if not exists "first_name" text null, add column if not exists "last_name" text null, add column if not exists "email" text null, add column if not exists "avatar_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "employee" drop column if exists "first_name", drop column if exists "last_name", drop column if exists "email", drop column if exists "avatar_url";`);
  }

}
