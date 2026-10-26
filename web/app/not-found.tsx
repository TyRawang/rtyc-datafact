import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap py-14">
      <p className="eyebrow muted">404</p>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">Page not found.</h1>
      <p className="muted mb-6">The review or document you asked for is not published.</p>
      <Link href="/reviews" className="primary">Browse all reviews ↗</Link>
    </div>
  );
}
