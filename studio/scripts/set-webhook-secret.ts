/**
 * Copies SANITY_REVALIDATE_SECRET from ../web/.env.local onto the "revalidate"
 * webhook, and makes sure its URL and triggers are right. Never prints the secret.
 * Run from studio/:  npx sanity exec scripts/set-webhook-secret.ts --with-user-token
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";

const SITE_URL = process.env.SITE_URL || "https://rtyc-datafact-zeta.vercel.app";

type Hook = {
  id: string;
  name: string;
  url: string;
  dataset: string;
  httpMethod: string;
  apiVersion: string;
  includeDrafts: boolean;
  isDisabled: boolean;
  headers: Record<string, string>;
  rule: { on: string[] };
  filter?: string | null;
  projection?: string | null;
  secret?: string | null;
  description?: string | null;
};

const envPath = path.resolve(process.cwd(), "..", "web", ".env.local");
const secretLine = readFileSync(envPath, "utf8").split("\n").find((l) => l.startsWith("SANITY_REVALIDATE_SECRET="));
const secret = secretLine?.slice("SANITY_REVALIDATE_SECRET=".length).trim();
if (!secret) throw new Error("SANITY_REVALIDATE_SECRET not found in web/.env.local");

const cli = getCliClient({ apiVersion: "2025-10-01" });
const projectId = cli.config().projectId as string;
// The webhook management API lives on api.sanity.io, not the project hostname.
const client = cli.withConfig({ useProjectHostname: false, apiVersion: "2021-10-04", useCdn: false });

async function main() {
  const hooks = await client.request<Hook[]>({ url: `/hooks/projects/${projectId}`, method: "GET" });
  const existing = hooks.find((h) => h.name === "revalidate") ?? hooks.find((h) => h.url.endsWith("/api/revalidate"));
  const base = {
    type: "document",
    name: "revalidate",
    url: `${SITE_URL}/api/revalidate`,
    dataset: "production",
    httpMethod: "POST",
    apiVersion: "v2021-03-25",
    includeDrafts: false,
    includeAllVersions: false,
    headers: {},
    rule: { on: ["create", "update", "delete"] },
    filter: null,
    projection: null,
    isDisabled: false,
    description: "Revalidates the public site when content is published.",
  };
  if (existing) {
    // The management API accepts PATCH on the hook; PUT returns 404.
    const body = { url: base.url, dataset: base.dataset, rule: base.rule, isDisabled: false, secret };
    await client.request({ url: `/hooks/projects/${projectId}/${existing.id}`, method: "PATCH", body });
    console.log(`Updated webhook "${existing.name}" (${existing.id}): url=${base.url}, dataset=production, on=create,update,delete, secret set`);
  } else {
    const created = await client.request<Hook>({ url: `/hooks/projects/${projectId}`, method: "POST", body: { ...base, secret } });
    console.log(`Created webhook "${created.name}" (${created.id}) with secret set`);
  }
}

main().catch((err) => {
  console.error(err?.statusCode, String(err?.response?.body?.message ?? err?.message ?? err).slice(0, 300));
  process.exit(1);
});
