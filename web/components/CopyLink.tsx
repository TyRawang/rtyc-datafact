"use client";

import { useState } from "react";

export function CopyLink() {
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        type="button"
        className="pill"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setMessage("Link copied");
          } catch {
            setMessage("Copy this page's address from the address bar");
          }
        }}
      >
        Copy link
      </button>
      <span className="text-xs muted" aria-live="polite">
        {message}
      </span>
    </>
  );
}
