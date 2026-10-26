/**
 * Uploads lead images and attaches them to claim reviews.
 * Usage (from studio/):  npx sanity exec scripts/attach-images.ts --with-user-token -- <mapping.json>
 * mapping.json: [{ "reviewId": "claimReview-r01", "file": "/abs/path.jpg", "alt": "…", "credit": "…", "source": "https://commons…" }]
 * Skips reviews that already have an image unless FORCE=1.
 */
import { createReadStream, readFileSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";

type Row = { reviewId: string; file: string; alt: string; credit: string; source?: string };

const mappingPath = process.argv.find((a) => a.endsWith(".json"));
if (!mappingPath) throw new Error("Pass the path to a mapping .json file after --");
const rows = JSON.parse(readFileSync(mappingPath, "utf8")) as Row[];
const client = getCliClient({ apiVersion: "2025-10-01" });

async function main() {
  for (const row of rows) {
    const existing = await client.fetch<{ hasImage: boolean; question: string } | null>(
      `*[_id == $id][0]{ "hasImage": defined(image.asset), question }`,
      { id: row.reviewId },
    );
    if (!existing) {
      console.log(`skip ${row.reviewId}: not found`);
      continue;
    }
    if (existing.hasImage && !process.env.FORCE) {
      console.log(`skip ${row.reviewId}: already has an image`);
      continue;
    }
    const asset = await client.assets.upload("image", createReadStream(row.file), {
      filename: path.basename(row.file),
      title: row.alt,
      description: row.credit,
      source: row.source ? { name: "wikimedia-commons", id: row.source, url: row.source } : undefined,
    });
    await client
      .patch(row.reviewId)
      .set({
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: row.alt,
          credit: row.credit,
        },
      })
      .commit();
    console.log(`attached ${path.basename(row.file)} -> ${row.reviewId} (${existing.question.slice(0, 50)}…)`);
  }
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
