import { type ClassValue, clsx } from 'clsx';
import { addMinutes, differenceInMinutes } from 'date-fns';
import { twMerge } from 'tailwind-merge';

import { changeEvent } from '../services/Events';
import type { IEvent, TCalendarEvent } from '../types/Calendar';

/**
 * Small helper that composes clsx and tailwind-merge. Use instead of `clsx(...)`
 * when Tailwind class conflicts should be resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------
   Date parsing & key utils
   ------------------------- */

/**
 * Safely parse an ISO date string into a Date.
 * Returns null for missing/invalid input (avoids Invalid Date propagation).
 */
function parseSafeDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Create a deterministic key for grouping events into 15-minute slots.
 * Format: event-YYYY-MM-DD-H-SLOT where hour H intentionally has no leading zero
 * to preserve the existing key shape.
 */
function makeEventKey(dt: Date) {
  const year = dt.getFullYear();
  const month = pad2(dt.getMonth() + 1); // "01".."12"
  const day = pad2(dt.getDate()); // "01".."31"
  const hour = String(dt.getHours()); // "0".."23" (no leading zero)
  const slot = Math.floor(dt.getMinutes() / 15); // 0..3
  return `event-${year}-${month}-${day}-${hour}-${slot}`;
}

/**
 * Convert backend IEvent items into TCalendarEvent objects grouped by 15-min slot.
 * - Skips events with invalid or missing start dates.
 * - Ensures end defaults to start + 15 minutes when missing/invalid.
 * - Duration is non-negative (minutes between start and end).
 */
export function groupApiEventsToScheduled(apiEvents: IEvent[]): Record<string, TCalendarEvent[]> {
  return apiEvents.reduce<Record<string, TCalendarEvent[]>>((acc, ev) => {
    const start = parseSafeDate(ev.start);
    if (!start) {
      // Skip entries that lack a valid start date (cannot place them on calendar)
      return acc;
    }

    // Use provided end if valid, otherwise default to start + 15 minutes.
    const end = parseSafeDate(ev.end) ?? addMinutes(start, 15);

    // Defensive: ensure duration >= 0
    const duration = Math.max(0, differenceInMinutes(end, start));

    let key = makeEventKey(start);
    if (ev.allDay) {
      const year = start.getFullYear();
      const month = pad2(start.getMonth() + 1);
      const day = pad2(start.getDate());
      key = `all-day-${year}-${month}-${day}`;
    }

    const item: TCalendarEvent = {
      id: String(ev.id),
      title: ev.title,
      // prefer explicit description when available
      description: ev.description ?? ev.title,
      start,
      end,
      duration,
      type: ev.type ? String(ev.type) : 'other',
      colour: String(ev.colour ?? ''),
      slot: Math.floor(start.getMinutes() / 15),
      allDay: !!ev.allDay,
    };

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);

    return acc;
  }, {});
}

/**
 * Convert a TCalendarEvent back into the API shape and send the update.
 * Awaits the changeEvent call and returns the payload so callers can await
 * and inspect the value or handle errors.
 */
export const updatedEvent = async (event: TCalendarEvent): Promise<IEvent> => {
  const payload: IEvent = {
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.start ? event.start.toISOString() : new Date().toISOString(),
    end: event.end ? event.end.toISOString() : new Date().toISOString(),
    type: event.type,
    colour: event.colour,
    allDay: event.allDay,
  };

  // Allow upstream to catch/rethrow errors from the service
  await changeEvent(payload);
  return payload;
};
