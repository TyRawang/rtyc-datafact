import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>The review or document you asked for is not published. <Link href="/">Browse all reviews</Link>.</p>
    </section>
  );
}
