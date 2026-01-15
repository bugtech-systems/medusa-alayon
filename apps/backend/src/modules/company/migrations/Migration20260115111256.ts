import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260115111256 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "employee" alter column "raw_spending_limit" type jsonb using ("raw_spending_limit"::jsonb);`);
    this.addSql(`alter table if exists "employee" alter column "raw_spending_limit" set default '{"value":"0","precision":20}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "employee" alter column "raw_spending_limit" drop default;`);
    this.addSql(`alter table if exists "employee" alter column "raw_spending_limit" type jsonb using ("raw_spending_limit"::jsonb);`);
  }

}
