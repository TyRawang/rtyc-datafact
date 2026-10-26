import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

type SanityDoc = { _id: string; _type: string; [key: string]: unknown };

let cache: Promise<SanityDoc[]> | null = null;

/** Loads /fixtures/dataset.ndjson once per server process. */
export function loadFixtures(): Promise<SanityDoc[]> {
  if (!cache) {
    const file = path.join(process.cwd(), "fixtures", "dataset.ndjson");
    cache = readFile(file, "utf8").then((text) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as SanityDoc),
    );
  }
  return cache;
}
