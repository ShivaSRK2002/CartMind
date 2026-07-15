import type { BehavioralEventName } from "./events";

export interface IngestEventInput {
  eventType: BehavioralEventName;
  sessionId: string;
  anonymousId?: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
}

export interface IngestEventsBatchRequest {
  events: IngestEventInput[];
}

export interface IngestEventResult {
  id: string;
  eventType: BehavioralEventName;
  receivedAt: string;
}

export interface IngestEventsBatchResult {
  ingested: number;
  events: IngestEventResult[];
}
