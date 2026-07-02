import { RudderAnalytics } from "@rudderstack/analytics-js";

let analytics: RudderAnalytics | null = null;

export function initAnalytics(writeKey: string, dataPlaneUrl: string): void {
  if (typeof window === "undefined" || analytics) {
    return;
  }

  analytics = new RudderAnalytics();
  analytics.load(writeKey, dataPlaneUrl);
}

export function getAnalytics(): RudderAnalytics | null {
  return analytics;
}
