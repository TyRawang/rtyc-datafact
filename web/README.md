# web

Public site for Tibet / Evidence. See the repository README for setup.

- `npm run dev` runs against Sanity if `NEXT_PUBLIC_SANITY_PROJECT_ID` is set, otherwise against `fixtures/dataset.ndjson`.
- `npm run typecheck`, `npm run lint`, `npm run build`.
- `npm run check:search -- <site url>` runs the multilingual search checks against a running site.

Key paths: `lib/sanity/queries.ts` (GROQ), `lib/sanity/fetch.ts` (published vs draft vs fixtures), `lib/search/` (tokenizer and index config shared by the browser and the check script), `components/Evidence.tsx` (citation numbering).
