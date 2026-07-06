"use client";

import { useEffect } from "react";
import { trackSearchQuery } from "@/lib/analytics/track";

export function SearchTracker({ query, resultCount }: { query: string; resultCount: number }) {
  useEffect(() => {
    trackSearchQuery(query, resultCount);
  }, [query, resultCount]);

  return null;
}
