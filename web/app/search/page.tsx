import type { Metadata } from "next";
import { SiteSearch } from "@/components/SiteSearch";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <SiteSearch key={q ?? ""} initialQuery={q ?? ""} />;
}
