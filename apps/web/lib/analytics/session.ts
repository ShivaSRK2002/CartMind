const STORAGE_KEY = "velora_analytics_session";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    let id = window.sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `fallback_${Date.now()}`;
  }
}

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const key = "velora_anonymous_id";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}
