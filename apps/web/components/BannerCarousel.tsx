"use client";

import { useState } from "react";
import Link from "next/link";
import type { Banner } from "cartmind-shared-types";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const banner = banners[index];

  function goTo(delta: number) {
    setIndex((current) => (current + delta + banners.length) % banners.length);
  }

  const content = (
    <div className="relative aspect-[3/1] w-full overflow-hidden bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-lg font-semibold text-white">{banner.title}</p>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-lg leading-none hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-lg leading-none hover:bg-white"
          >
            ›
          </button>
          <div className="mt-2 flex justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-4 rounded-full ${i === index ? "bg-slate-900" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
