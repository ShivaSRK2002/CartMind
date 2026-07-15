"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Banner } from "cartmind-shared-types";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[index];

  function goTo(delta: number) {
    setIndex((current) => (current + delta + banners.length) % banners.length);
  }

  const content = (
    <div className="relative aspect-[2.2/1] w-full overflow-hidden bg-surface-muted sm:aspect-[2.5/1] lg:aspect-[2.8/1]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="h-full w-full object-cover transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-header/70 via-brand-header/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
          Curated Collection
        </p>
        <h2 className="mt-3 max-w-lg font-display text-3xl font-medium leading-tight text-brand-header-text sm:text-4xl lg:text-5xl">
          {banner.title}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-brand-header-text/75">
          Handpicked essentials for the discerning shopper
        </p>
        <span className="mt-6 inline-flex w-fit items-center gap-2 border-b border-brand-accent pb-1 text-xs font-medium uppercase tracking-[0.15em] text-brand-header-text">
          Explore Now
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden premium-shadow-card">
      {banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous banner"
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-brand-header/40 text-lg text-white backdrop-blur-sm transition-colors hover:bg-brand-header/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next banner"
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-brand-header/40 text-lg text-white backdrop-blur-sm transition-colors hover:bg-brand-header/60"
          >
            ›
          </button>
          <div className="absolute bottom-6 left-8 flex gap-2 sm:left-12">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-px transition-all duration-300 ${
                  i === index ? "w-8 bg-brand-accent" : "w-4 bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
