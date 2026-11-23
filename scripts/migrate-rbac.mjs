import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

const sql = await readFile(path.join(root, "neon", "schema.sql"), "utf8");
await client.query(sql);
console.log("Applied schema.sql");

await client.query("alter table users drop column if exists rank");
console.log("Dropped users.rank");

const r = await client.query(`
  select
    (select count(*) from users) users,
    (select count(*) from invite_tokens) invites,
    (select count(*) from audit_logs) audits
`);
console.log("Counts:", r.rows[0]);
await client.end();
