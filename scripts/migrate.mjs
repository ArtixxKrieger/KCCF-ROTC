import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED is not set. Run `neon env pull` first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

for (const file of ["schema.sql", "seed.sql"]) {
  const sql = await readFile(path.join(root, "neon", file), "utf8");
  await client.query(sql);
  console.log(`Applied ${file}`);
}

const counts = await client.query(`
  select
    (select count(*) from inventory) as inventory,
    (select count(*) from transactions) as transactions,
    (select count(*) from requests) as requests,
    (select count(*) from issuances) as issuances,
    (select count(*) from users) as users
`);
console.log("Row counts:", counts.rows[0]);
await client.end();
