/**
 * Creates a read-only API token for the website's draft preview and writes
 * web/.env.local. Run from studio/:  npx sanity exec scripts/setup-web-env.ts --with-user-token
 * The token is written to the file only; it is never printed.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-10-01" });
const config = client.config();
if (!config.projectId) throw new Error("No project ID configured.");
const projectId: string = config.projectId;
const dataset: string = config.dataset ?? "production";

const envPath = path.resolve(process.cwd(), "..", "web", ".env.local");
const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const current = new Map(
  existing
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)] as [string, string]),
);

async function main() {
  if (!current.get("SANITY_API_READ_TOKEN")) {
    const label = `web-preview-${new Date().toISOString().slice(0, 10)}`;
    const res = await client.request<{ key: string; label: string }>({
      url: `/projects/${projectId}/tokens`,
      method: "POST",
      body: { label, roleName: "viewer" },
    });
    current.set("SANITY_API_READ_TOKEN", res.key);
    console.log(`Created viewer token "${res.label}"`);
  } else {
    console.log("Read token already present; keeping it.");
  }
  if (!current.get("SANITY_REVALIDATE_SECRET")) {
    current.set("SANITY_REVALIDATE_SECRET", randomBytes(24).toString("hex"));
    console.log("Generated revalidate secret");
  }
  current.set("NEXT_PUBLIC_SANITY_PROJECT_ID", projectId);
  current.set("NEXT_PUBLIC_SANITY_DATASET", dataset);
  if (!current.get("NEXT_PUBLIC_SANITY_API_VERSION")) current.set("NEXT_PUBLIC_SANITY_API_VERSION", "2025-10-01");
  if (!current.get("NEXT_PUBLIC_SANITY_STUDIO_URL")) current.set("NEXT_PUBLIC_SANITY_STUDIO_URL", "http://localhost:3333");

  const out = [...current.entries()].map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  writeFileSync(envPath, out, { mode: 0o600 });
  console.log(`Wrote ${envPath} with keys: ${[...current.keys()].join(", ")}`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
