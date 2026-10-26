import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeScript } from "@/components/ThemeScript";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allTopicsQuery } from "@/lib/sanity/queries";
import type { TopicRef } from "@/lib/sanity/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rtyc-datafact-zeta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Factgaurd Tibet", template: "%s · Factgaurd Tibet" },
  applicationName: "Factgaurd Tibet",
  openGraph: { type: "website", siteName: "Factgaurd Tibet", locale: "en" },
  twitter: { card: "summary_large_image" },
  description:
    "Evidence-based reviews of specific claims about Tibet, with the original statements and the documents behind each finding. A project by Tibetan Youth Congress.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ isEnabled: isDraft }, topics] = await Promise.all([
    draftMode(),
    sanityFetch<TopicRef[]>({ query: allTopicsQuery }),
  ]);
  // Only topics with at least one published review appear in navigation; the nav shows the busiest six.
  const liveTopics = (topics ?? []).filter((t) => (t.count ?? 0) > 0);
  const navTopics = [...liveTopics].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 6);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {isDraft && (
          <div className="banner" role="status">
            Draft preview: you are seeing unpublished content. <a href="/api/draft/disable">Exit preview</a>
          </div>
        )}
        <SiteHeader topics={navTopics} />
        <main id="main">{children}</main>
        <SiteFooter topics={liveTopics} />
        {isDraft && <VisualEditing />}
      </body>
    </html>
  );
}
