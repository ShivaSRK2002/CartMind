"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { CartLineItem } from "cartmind-shared-types";
import { trackCheckoutAbandoned } from "@/lib/analytics/track";

interface UseCheckoutAbandonmentOptions {
  items: CartLineItem[];
  totalAmount: number;
  stage: string;
  completedRef: MutableRefObject<boolean>;
}

export function useCheckoutAbandonment({
  items,
  totalAmount,
  stage,
  completedRef,
}: UseCheckoutAbandonmentOptions) {
  const trackedRef = useRef(false);
  const stageRef = useRef(stage);
  const payloadRef = useRef({ items, totalAmount });

  stageRef.current = stage;
  payloadRef.current = { items, totalAmount };

  useEffect(() => {
    if (items.length === 0) return;

    function fireAbandonment() {
      if (trackedRef.current || completedRef.current || payloadRef.current.items.length === 0) return;
      trackedRef.current = true;
      trackCheckoutAbandoned(payloadRef.current, stageRef.current);
    }

    function handleBeforeUnload() {
      fireAbandonment();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      fireAbandonment();
    };
  }, [items.length, completedRef]);
}
