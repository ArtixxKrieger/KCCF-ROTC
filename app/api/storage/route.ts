import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sql } from "@/lib/db";
import { s3, ASSETS_BUCKET } from "@/lib/storage";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";


type ReportExportRow = {
  id: string;
  bucket: string;
  object_key: string;
  file_name: string;
  created_at: string;
};

export async function GET() {
  try {
    await requirePermission("report:read");
    const rows = (await sql`
      select * from report_exports order by created_at desc
    `) as ReportExportRow[];

    const withUrls = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: ASSETS_BUCKET,
            Key: row.object_key,
          }),
          { expiresIn: 3600 },
        ),
      })),
    );
    return ok(withUrls);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function POST() {
  try {
    const actor = await requirePermission("report:read");
    const inventory = await sql`select * from inventory order by name`;
    const timestamp = Date.now();
    const objectKey = `reports/inventory-${timestamp}.json`;
    const fileName = `inventory-${timestamp}.json`;
    const report = {
      generated_at: new Date().toISOString(),
      inventory,
    };

    await s3.send(
      new PutObjectCommand({
        Bucket: ASSETS_BUCKET,
        Key: objectKey,
        Body: JSON.stringify(report, null, 2),
        ContentType: "application/json",
      }),
    );

    const [row] = await sql`
      insert into report_exports (bucket, object_key, file_name)
      values (${ASSETS_BUCKET}::text, ${objectKey}::text, ${fileName}::text)
      returning *
    `;
    await logAudit({
      actor,
      action: "report.export",
      entity: "report_export",
      details: { objectKey },
    });
    return ok(row, { status: 201 });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
