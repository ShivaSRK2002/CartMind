"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics/client";

export function RudderStackProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const writeKey = process.env.NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY;
    const dataPlaneUrl = process.env.NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL;

    if (!writeKey || !dataPlaneUrl) {
      console.warn(
        "RudderStack not initialized: set NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY and NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL",
      );
      return;
    }

    initAnalytics(writeKey, dataPlaneUrl);
  }, []);

  return <>{children}</>;
}
