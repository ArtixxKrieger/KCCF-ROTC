import { createRealtime, rawSql } from "@neon/realtime/server";

const db =
  process.env.DATABASE_URL && /^\w+:\/\//.test(process.env.DATABASE_URL)
    ? new URL(process.env.DATABASE_URL).pathname.replace(/^\//, "")
    : "neondb";

const secret = process.env.NEON_REALTIME_SECRET;
if (!secret) {
  throw new Error("NEON_REALTIME_SECRET is not set. Run `neon env pull` first.");
}

const realtime = createRealtime({ secret, db });

export const inventoryLiveQuerySql = `
  select
    id,
    name,
    category,
    item_type,
    quantity,
    available_quantity,
    issued_quantity,
    damaged_quantity,
    condition,
    status,
    storage_location,
    min_stock_level,
    unit,
    description
  from inventory
  order by name
`;

export function sealInventoryQuery() {
  return realtime.seal({ query: rawSql(inventoryLiveQuerySql) });
}
