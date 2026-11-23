import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED is not set. Run `neon env pull` first.");
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL || "shyttyplays@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

console.log("Deleting all data…");
await client.query(
  "truncate table report_exports, issuances, requests, transactions, inventory, users restart identity cascade",
);

await client.query(
  "alter table users add column if not exists password_hash text",
);

const hash = await bcrypt.hash(adminPassword, 12);
await client.query(
  `insert into users (full_name, email, password_hash, role, rank, department, active)
   values ($1, $2, $3, 'Admin', 'Administrator', 'Command', true)`,
  ["Administrator", adminEmail, hash],
);

const counts = await client.query(`
  select
    (select count(*) from inventory) as inventory,
    (select count(*) from transactions) as transactions,
    (select count(*) from requests) as requests,
    (select count(*) from issuances) as issuances,
    (select count(*) from users) as users
`);
console.log("Admin user:", adminEmail);
console.log("Row counts after reset:", counts.rows[0]);
await client.end();
