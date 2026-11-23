import { S3Client } from "@aws-sdk/client-s3";

export const ASSETS_BUCKET = process.env.NEON_ASSETS_BUCKET ?? "assets";

export const s3 = new S3Client({
  forcePathStyle: true,
});
