const STORAGE_KEY = "velora_view_history";
const MAX_ITEMS = 20;

export function recordProductView(productId: string): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getViewedProductIds();
    const next = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function getViewedProductIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
