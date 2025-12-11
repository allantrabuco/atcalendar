import { describe, expect, it } from 'vitest';

import type { IEvent } from '@/types/Calendar';

import { groupApiEventsToScheduled } from './utils';

describe('groupApiEventsToScheduled', () => {
  it('should group events by 15-minute slots', () => {
    const apiEvents: Partial<IEvent>[] = [
      {
        id: 1,
        title: 'Event 1',
        start: '2023-10-27T10:00:00', // Local time
        end: '2023-10-27T10:30:00',
      },
      {
        id: 2,
        title: 'Event 2',
        start: '2023-10-27T10:15:00',
        end: '2023-10-27T10:45:00',
      },
    ];

    const grouped = groupApiEventsToScheduled(apiEvents as IEvent[]);

    // Key format: event-YYYY-MM-DD-H-SLOT
    // 10:00 is slot 0 of hour 10
    const key1 = 'event-2023-10-27-10-0';
    // 10:15 is slot 1 of hour 10
    const key2 = 'event-2023-10-27-10-1';

    expect(grouped[key1]).toHaveLength(1);
    expect(grouped[key1][0].title).toBe('Event 1');
    expect(grouped[key2]).toHaveLength(1);
    expect(grouped[key2][0].title).toBe('Event 2');
  });

  it('should handle invalid dates gracefully', () => {
    const apiEvents: Partial<IEvent>[] = [
      {
        id: 1,
        title: 'Invalid Event',
        start: 'invalid-date',
      },
    ];

    const grouped = groupApiEventsToScheduled(apiEvents as IEvent[]);

    expect(Object.keys(grouped)).toHaveLength(0);
  });

  it('should default end time if missing', () => {
    const apiEvents: Partial<IEvent>[] = [
      {
        id: 1,
        title: 'No End Event',
        start: '2023-10-27T10:00:00',
      },
    ];

    const grouped = groupApiEventsToScheduled(apiEvents as IEvent[]);
    const key = 'event-2023-10-27-10-0';

    expect(grouped[key]).toHaveLength(1);
    const event = grouped[key][0];
    expect(event.end).toBeDefined();
    // Should be 15 minutes after start
    expect(event.duration).toBe(15);
  });

  it('should group all-day events with a special key', () => {
    const apiEvents: Partial<IEvent>[] = [
      {
        id: 1,
        title: 'All Day Event',
        start: '2023-10-27T00:00:00',
        allDay: true,
      },
    ];

    const grouped = groupApiEventsToScheduled(apiEvents as IEvent[]);
    const key = 'all-day-2023-10-27';

    expect(grouped[key]).toHaveLength(1);
    expect(grouped[key][0].title).toBe('All Day Event');
    expect(grouped[key][0].allDay).toBe(true);
  });
});
