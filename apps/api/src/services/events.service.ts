import type { BehavioralEventName, IngestEventInput, IngestEventResult } from "cartmind-shared-types";
import { pool } from "../db/pool";

interface EventInsertRow {
  id: string;
  event_type: BehavioralEventName;
  received_at: Date;
}

export async function insertEvent(
  input: IngestEventInput,
  userId?: string,
): Promise<IngestEventResult> {
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("Invalid occurredAt timestamp");
  }

  const result = await pool.query<EventInsertRow>(
    `INSERT INTO events (event_type, user_id, session_id, anonymous_id, payload, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, event_type, received_at`,
    [
      input.eventType,
      userId ?? null,
      input.sessionId,
      input.anonymousId ?? null,
      JSON.stringify(input.payload),
      occurredAt.toISOString(),
    ],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    eventType: row.event_type,
    receivedAt: row.received_at.toISOString(),
  };
}

export async function insertEventsBatch(
  events: IngestEventInput[],
  userId?: string,
): Promise<IngestEventResult[]> {
  const results: IngestEventResult[] = [];
  for (const event of events) {
    results.push(await insertEvent(event, userId));
  }
  return results;
}
