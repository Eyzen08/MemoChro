"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>Your archive couldn’t open.</h1>
      <p>Your work is still yours. Check your connection, then try again.</p>
      <button className="button paper" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
