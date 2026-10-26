/**
 * Controlled finding vocabulary. Keep in sync with studio/schemaTypes/lib/findings.ts.
 */
export const FINDINGS = [
  {
    value: "accurate",
    label: "Accurate",
    requirement: "Reliable evidence supports the material claim.",
  },
  {
    value: "partly-accurate",
    label: "Partly accurate",
    requirement: "Supported elements coexist with material inaccuracies.",
  },
  {
    value: "misleading",
    label: "Misleading",
    requirement:
      "Wording or omitted context creates a materially false impression.",
  },
  {
    value: "contradicted",
    label: "Contradicted by evidence",
    requirement: "Reliable evidence directly conflicts with the claim.",
  },
  {
    value: "unsupported",
    label: "Unsupported",
    requirement: "Adequate supporting evidence has not been established.",
  },
  {
    value: "disputed-interpretation",
    label: "Disputed interpretation",
    requirement: "Credible interpretations differ; the review explains their basis.",
  },
  {
    value: "unverifiable",
    label: "Unverifiable",
    requirement: "Available evidence cannot resolve the question.",
  },
] as const;

export type FindingValue = (typeof FINDINGS)[number]["value"];

export const CLAIM_TYPES = [
  { value: "factual", label: "Factual" },
  { value: "legal", label: "Legal" },
  { value: "interpretive", label: "Historical or interpretive" },
  { value: "testimonial", label: "Testimony" },
] as const;

export type ClaimTypeValue = (typeof CLAIM_TYPES)[number]["value"];

export function findingLabel(value: string | null | undefined): string {
  return FINDINGS.find((f) => f.value === value)?.label ?? "No finding recorded";
}

export function claimTypeLabel(value: string | null | undefined): string {
  return CLAIM_TYPES.find((c) => c.value === value)?.label ?? "Unclassified";
}
