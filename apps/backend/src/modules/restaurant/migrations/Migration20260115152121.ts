import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260115152121 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_restaurant_deleted_at" ON "restaurant" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_restaurant_admin_deleted_at" ON "restaurant_admin" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_restaurant_deleted_at";`);

    this.addSql(`drop index if exists "IDX_restaurant_admin_deleted_at";`);
  }

}
