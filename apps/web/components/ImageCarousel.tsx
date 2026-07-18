"use client";

import { useState } from "react";

export function ImageCarousel({
  images,
  sold,
}: {
  images: { id: string; url: string }[];
  sold?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const has = total > 0;
  const current = has ? images[Math.min(idx, total - 1)] : null;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card bg-gray-100">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.url}
          alt=""
          className={`h-full w-full object-cover ${sold ? "opacity-60" : ""}`}
        />
      ) : (
        <div className="h-full w-full bg-gray-200" />
      )}

      {total > 1 && (
        <>
          <button
            aria-label="이전 이미지"
            onClick={() => setIdx((i) => (i - 1 + total) % total)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-ink shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            aria-label="다음 이미지"
            onClick={() => setIdx((i) => (i + 1) % total)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-ink shadow hover:bg-white"
          >
            ›
          </button>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            이미지 {Math.min(idx, total - 1) + 1} / {total}
          </span>
        </>
      )}
    </div>
  );
}
