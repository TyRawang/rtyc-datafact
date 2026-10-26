# Factgaurd Tibet

A research website where readers find a claim about Tibet, read an evidence-based assessment, and inspect the original statement and supporting documents.

Two apps:

| Folder | What it is | Runs at |
|---|---|---|
| `web/` | Public site (Next.js 16, App Router). Reads content from Sanity, or from `web/fixtures/dataset.ndjson` when no Sanity project is configured. | http://localhost:3000 |
| `studio/` | Editing dashboard (Sanity Studio 6). Separate origin from the public site on purpose. | http://localhost:3333 |

Search is MiniSearch in the browser over a published-only index served at `/search-index.json`, with an `Intl.Segmenter` tokenizer so Chinese and Tibetan queries work.

## Quick start (no Sanity account needed)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. With no `NEXT_PUBLIC_SANITY_PROJECT_ID` set, the site reads the sample dataset in `web/fixtures/dataset.ndjson` through `groq-js`, so every page and the search work offline. The sample content is placeholder text marked `[Sample]`.

Run the search checks (English, Chinese, Tibetan, keyword aliases, topic filter) against a running site:

```bash
npm run check:search -- http://localhost:3000
```

## Sanity project

The live project is **RTYC** (project ID `2t4727im`, dataset `production`, manage at https://www.sanity.io/manage/project/2t4727im). Local setup is already done on the original development machine:

- `studio/.env` holds the project ID and the preview URL.
- `web/.env.local` holds the project ID, a **Viewer** read token for draft preview, and a webhook secret. Both files are gitignored. Never commit or paste the token.
- CORS origins `http://localhost:3000` and `http://localhost:3333` are allowed. Add the production site domain under API → CORS origins when it exists.
- The sample content is imported. Re-import with `npm run import:fixtures` in `studio/` (replaces documents with the same IDs only).

Setting up another machine:

```bash
cd studio && npm install && npx sanity login --provider sanity
npm run setup:web-env        # creates a viewer token and writes ../web/.env.local
npm run dev                  # Studio on http://localhost:3333
cd ../web && npm install && npm run dev   # site on http://localhost:3000
```

Deployed:

| Piece | Where |
|---|---|
| Public site | https://rtyc-datafact-zeta.vercel.app (Vercel, root directory `web`, env vars copied from `web/.env.local`) |
| Studio | https://rtyc-datafact.sanity.studio (deploy updates with `npm run deploy` in `studio/`) |
| Webhook | "revalidate" → `/api/revalidate`, production dataset, create/update/delete, secret set. Verified delivering HTTP 200. |

Operational scripts in `studio/scripts/` (run with `npx sanity exec <script> --with-user-token`):

- `setup-web-env.ts` creates a viewer token and writes `web/.env.local`.
- `set-webhook-secret.ts` copies the revalidate secret from `web/.env.local` onto the webhook and fixes its URL and triggers. Pass `SITE_URL=https://…` if the site moves.

When the site gets a custom domain: add it to Vercel, add it as a CORS origin in Sanity, run `SITE_URL=https://<domain> npx sanity exec scripts/set-webhook-secret.ts --with-user-token`, and set `SANITY_STUDIO_PREVIEW_URL` to it before the next Studio deploy.

Draft preview: open the **Presentation** tab in the Studio. It loads the site with draft mode on, using the read token, so unpublished reviews can be checked in the real layout.

## Design

The UI is ported from the "Sarsa static editorial template" (a Tailwind 4 + Alpine rebuild supplied as `sarsa-template-source.zip`): utility bar, centred masthead with the Factgaurd Tibet logo, hero plus side stories, latest grid with a "Start here" list, a searchable archive with topic pills, and a centred serif article page. Alpine interactions were rewritten as React components (`web/components/SiteHeader.tsx`, `Browse.tsx`, `CopyLink.tsx`). The template's photographs were not used; they were unlicensed demo images.

- Styles live in `web/app/globals.css`. Brand green is the `--brand` variable (currently `#0b6a3b`, estimated from the logo; replace with the official value if there is one). Dark mode follows the system preference and the toggle in the masthead, stored per browser.
- Reviews usually have no photograph. Cards and the hero show a typographic "plate" with the finding instead. A review can carry an optional lead image (with alt text and credit) set in the Studio.
- The logo is `web/public/logo.png`, the supplied PNG with a white background. It is blended into the page in light mode and inverted in dark mode. A transparent SVG or PNG would render more cleanly; drop it in with the same name.
- Navigation lists only topics that have at least one published review, the six busiest. The archive's topic pills follow the same rule.

## Content model

| Type | Purpose |
|---|---|
| **Claim review** | One statement, assessed. Question, slug, topics, claim type, the exact claim in its original language with translation and translator, speaker, publisher, statement date, original URL, preserved statement (capture), short answer, finding, evidence, limitations, search keywords, public byline, review date, corrections. |
| **Source** | One record per document: title, publisher, date, original URL, language, rights status, hosting policy (full copy, excerpt and link, or private), optional file, context notes, related documents. |
| **Citation** | An annotation inside a review's evidence text: a reference to a Source plus page or section, quoted passage, translation, and what the passage supports. Citations are numbered in reading order on the page. |
| **Dataset** | A tabular file with its source, period, coverage, units, methodology, and limitations. |
| **Topic** | Editable browse facet with a stable slug. |
| **Page** | Editorial pages. The page with slug `method` is shown at `/method` above the fixed finding definitions. |

Rules enforced by the schema:

- A review cannot be published without a finding, a claim type, a statement date, a short answer, evidence, at least one topic, and a record of how the statement was preserved (a captured file, a Wayback URL, or an explicit note that no archive could be made).
- A non-English claim requires an English translation.
- A source marked **private** cannot have a file uploaded, because any file in Sanity has a public URL. Keep private captures outside the CMS.
- Sanity refuses to delete a source that a review still references.

The finding vocabulary lives in `web/lib/findings.ts` and `studio/lib/findings.ts`. Change both together.

## Editorial workflow

Single editor. Drafts stay in Sanity until **Publish** is pressed; the public site, the search index, and the corrections log only ever read published documents. Preview drafts from the Studio's Presentation tab before publishing.

After publishing, record every material change as a correction entry on the review. It appears on the review page and in the public log at `/corrections`.

## What is deliberately not built yet

PDF text extraction and OCR, CSV-to-table rendering, charts, bulk imports, public submissions, multilingual UI, and any form of AI-generated text.
