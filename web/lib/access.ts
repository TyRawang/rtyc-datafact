export function accessLabel(policy?: string): string {
  switch (policy) {
    case "full": return "Full copy hosted";
    case "excerpt": return "Excerpt and link only";
    case "private": return "Private capture";
    default: return "Not specified";
  }
}
