import { findingLabel } from "@/lib/findings";

export function FindingBadge({ finding }: { finding?: string | null }) {
  return <span className="badge">{findingLabel(finding)}</span>;
}
