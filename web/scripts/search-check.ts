/**
 * Exercises the search index against the published index endpoint or the
 * fixtures. Run with the site up:  npm run check:search -- http://localhost:3000
 * Checks English, Chinese, Tibetan, keyword-alias, and topic-filter queries.
 */
import { createIndex, runSearch } from "../lib/search/index";
import { tokenize } from "../lib/search/tokenizer";
import type { SearchDoc } from "../lib/sanity/types";

async function main() {
  const base = process.argv[2] ?? "http://localhost:3000";
  const res = await fetch(`${base}/search-index.json`);
  if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
  const { docs } = (await res.json()) as { docs: SearchDoc[] };
  const index = createIndex(docs);

  console.log("tokens zh:", tokenize("示例声明：所有适龄儿童都已入学。"));
  console.log("tokens bo:", tokenize("དཔེ་མཚོན། དགོན་པར་འཛུལ་ཞུགས་བྱེད་པར་བཀག་འགོག་མེད།"));
  console.log("tokens en:", tokenize("Boarding schools, residential schools"));

  const cases: [string, string | undefined, string][] = [
    ["enrolment", undefined, "sample-boarding-enrolment"],
    ["enrollment", undefined, "sample-boarding-enrolment"],
    ["residential schools", undefined, "sample-boarding-enrolment"],
    ["boarding", undefined, "sample-boarding-enrolment"],
    ["寄宿制学校", undefined, "sample-boarding-enrolment"],
    ["适龄儿童", undefined, "sample-boarding-enrolment"],
    ["入学", undefined, "sample-boarding-enrolment"],
    ["monastery", undefined, "sample-monastery-admissions"],
    ["དགོན་པ", undefined, "sample-monastery-admissions"],
    ["sample", "religion-rights", "sample-monastery-admissions"],
  ];

  let failed = 0;
  for (const [q, topic, expectTop] of cases) {
    const hits = runSearch(index, q, topic);
    const top = hits[0]?.id;
    const ok = top === expectTop && (!topic || hits.every((h) => (h.topics as string[]).includes(topic)));
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(q)}${topic ? ` [topic=${topic}]` : ""} -> ${hits.map((h) => h.id).join(", ") || "(none)"}`);
  }
  if (failed) {
    console.error(`${failed} search check(s) failed`);
    process.exit(1);
  }
  console.log("All search checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
