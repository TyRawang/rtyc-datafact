import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import Link from "next/link";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: { default: "Tibet / Evidence", template: "%s · Tibet / Evidence" },
  description:
    "Evidence-based reviews of specific claims about Tibet, with the original statements and supporting documents.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraft } = await draftMode();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {isDraft && (
          <div className="banner" role="status">
            Draft preview: you are seeing unpublished content.{" "}
            <a href="/api/draft/disable">Exit preview</a>
          </div>
        )}
        <header className="site-header">
          <div className="inner">
            <Link className="brand" href="/">Tibet / Evidence</Link>
            <SiteNav />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="inner">
            Wireframe build. Every review links to its original statement and
            supporting sources. See <a href="/method">Method</a> and{" "}
            <a href="/corrections">Corrections</a>.
          </div>
        </footer>
        {isDraft && <VisualEditing />}
      </body>
    </html>
  );
}
