import { addDays, addHours, startOfDay, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import type { IEvent } from '@/types/Calendar';

const STORAGE_KEY = 'at-calendar-events';

const today = new Date();

const MOCK_EVENTS: IEvent[] = [
  {
    id: 1,
    title: 'Team Meeting (read only)',
    description: 'Weekly sync with the team',
    start: addHours(startOfDay(today), 10).toISOString(),
    end: addHours(startOfDay(today), 11).toISOString(),
    type: 'work',
    colour: '1',
  },
  {
    id: 2,
    title: 'Lunch Break (read only)',
    description: 'Time to eat',
    start: addHours(startOfDay(today), 12).toISOString(),
    end: addHours(startOfDay(today), 13).toISOString(),
    type: 'personal',
    colour: '2',
  },
  {
    id: 3,
    title: 'Project Review (read only)',
    description: 'Reviewing the latest changes',
    start: addHours(startOfDay(addDays(today, 1)), 14).toISOString(),
    end: addHours(startOfDay(addDays(today, 1)), 15).toISOString(),
    type: 'work',
    colour: '4',
  },
  {
    id: 4,
    title: 'Dentist Appointment (read only)',
    description: 'Routine checkup',
    start: addHours(startOfDay(subDays(today, 2)), 9).toISOString(),
    end: addHours(startOfDay(subDays(today, 2)), 10).toISOString(),
    type: 'health',
    colour: '3',
  },
];

const getStoredEvents = (): IEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse events from localStorage', error);
  }
  // Initialize with mock data if empty
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_EVENTS));
  return MOCK_EVENTS;
};

const setStoredEvents = (events: IEvent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events to localStorage', error);
  }
};

/**
 * Fetch all events.
 * @returns Promise resolving to an array of events.
 */
export const getEvents = async (): Promise<IEvent[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredEvents());
    }, 200); // Simulate network delay
  });
};

/**
 * Fetch events for a specific date.
 * Accepts either a Date or a string (ISO or YYYY-MM-DD). Normalizes to YYYY-MM-DD.
 * @param date Date or date string to fetch events for.
 * @returns Promise resolving to an array of events for that date.
 */
export const getEventsByDate = async (date: string | Date): Promise<IEvent[]> => {
  const targetDate =
    date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0];
  const events = getStoredEvents();
  const filtered = events.filter((e) => e.start.startsWith(targetDate));
  return new Promise((resolve) => setTimeout(() => resolve(filtered), 200));
};

/**
 * Fetch events for a specific month.
 * Accepts a month number (1-12), a zero-based month (0-11), a string ("3" or "03"), or a Date.
 * Normalizes to a two-digit month string e.g. "03".
 * @param month number | string | Date Month to fetch events for.
 * @returns Promise resolving to an array of events for that month.
 */
export const getEventsByMonth = async (month: number | string | Date): Promise<IEvent[]> => {
  let m: number;

  if (month instanceof Date) {
    m = month.getMonth() + 1;
  } else if (typeof month === 'number') {
    m = month;
  } else {
    m = parseInt(String(month), 10);
  }

  const events = getStoredEvents();
  const filtered = events.filter((e) => {
    const eventDate = new Date(e.start);
    return eventDate.getMonth() + 1 === m;
  });

  return new Promise((resolve) => setTimeout(() => resolve(filtered), 200));
};

/**
 * Fetch events for a specific date range.
 * Accepts Date or string (ISO or YYYY-MM-DD) for both `from` and `to`.
 * @param from start date (inclusive)
 * @param to end date (inclusive)
 * @returns Promise resolving to an array of events within the range
 */
export const getEventsByRange = async (
  from: string | Date,
  to: string | Date
): Promise<IEvent[]> => {
  const start = new Date(from);
  const end = new Date(to);

  const events = getStoredEvents();
  const filtered = events.filter((e) => {
    const eventStart = new Date(e.start);
    return eventStart >= start && eventStart <= end;
  });

  return new Promise((resolve) => setTimeout(() => resolve(filtered), 200));
};

/**
 * Add a new event.
 * The caller should omit `id` (we assign it).
 * @param event Event data without id.
 * @returns Promise resolving to the created event (with id).
 */
export const addEvent = async (event: Omit<IEvent, 'id'>): Promise<IEvent> => {
  const newEvent = { ...event, id: uuidv4() } as unknown as IEvent;
  const events = getStoredEvents();
  events.push(newEvent);
  setStoredEvents(events);
  return new Promise((resolve) => setTimeout(() => resolve(newEvent), 200));
};

/**
 * Delete an event by id.
 * @param id Event id to delete.
 */
export const deleteEvent = async (id: number | string): Promise<void> => {
  const events = getStoredEvents();
  const updated = events.filter((e) => e.id !== id);
  setStoredEvents(updated);
  return new Promise((resolve) => setTimeout(() => resolve(), 200));
};

/**
 * Replace/update an event.
 * @param event Full event object (must include id).
 * @returns Promise resolving to the updated event.
 */
export const changeEvent = async (event: IEvent): Promise<IEvent> => {
  const events = getStoredEvents();
  const index = events.findIndex((e) => e.id === event.id);
  if (index !== -1) {
    events[index] = event;
    setStoredEvents(events);
  }
  return new Promise((resolve) => setTimeout(() => resolve(event), 200));
};

/**
 * Add multiple events in a single request.
 * Useful for bulk imports; caller should omit ids for each event.
 * @param events Array of events without ids.
 * @returns Promise resolving to created events (with ids).
 */
export const addEventsBulk = async (events: Omit<IEvent, 'id'>[]): Promise<IEvent[]> => {
  const newEvents = events.map((e) => ({ ...e, id: uuidv4() }) as unknown as IEvent);
  const stored = getStoredEvents();
  const updated = [...stored, ...newEvents];
  setStoredEvents(updated);
  return new Promise((resolve) => setTimeout(() => resolve(newEvents), 200));
};
