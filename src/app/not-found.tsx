import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="standalone-message">
      <p className="eyebrow">A missing page</p>
      <h1>This moment isn’t here.</h1>
      <p>The page may have moved, or it may belong to a different archive.</p>
      <Link className="button paper" href="/home">
        Return to your archive
      </Link>
    </main>
  );
}
