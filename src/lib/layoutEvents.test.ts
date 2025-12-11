import type { TCalendarEvent } from '@/types/Calendar';
import { describe, expect, it } from 'vitest';
import { layoutEvents } from './layoutEvents';

// Helper to create mock events
const createEvent = (
  id: string,
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number
): TCalendarEvent => {
  const start = new Date();
  start.setHours(startHour, startMin, 0, 0);
  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  return {
    id,
    title: `Event ${id}`,
    start,
    end,
  } as TCalendarEvent;
};

describe('layoutEvents', () => {
  it('should handle non-overlapping events', () => {
    const events = [createEvent('1', 10, 0, 10, 30), createEvent('2', 10, 30, 11, 0)];

    const layout = layoutEvents(events);

    expect(layout['1']).toEqual({ width: 100, left: 0 });
    expect(layout['2']).toEqual({ width: 100, left: 0 });
  });

  it('should handle simple overlapping events', () => {
    const events = [createEvent('1', 10, 0, 11, 0), createEvent('2', 10, 30, 11, 30)];

    const layout = layoutEvents(events);

    // Should be 2 columns
    expect(layout['1'].width).toBe(50);
    expect(layout['2'].width).toBe(50);
    // One should be left 0, other left 50
    expect(layout['1'].left + layout['2'].left).toBe(50);
  });

  it('should handle complex overlapping events', () => {
    // A: 10:00 - 12:00
    // B: 10:30 - 11:30
    // C: 11:00 - 13:00
    // All 3 overlap at 11:00-11:30
    const events = [
      createEvent('A', 10, 0, 12, 0),
      createEvent('B', 10, 30, 11, 30),
      createEvent('C', 11, 0, 13, 0),
    ];

    const layout = layoutEvents(events);

    // Should be 3 columns
    expect(layout['A'].width).toBeCloseTo(33.33, 1);
    expect(layout['B'].width).toBeCloseTo(33.33, 1);
    expect(layout['C'].width).toBeCloseTo(33.33, 1);
  });

  it('should handle touching events as non-overlapping', () => {
    // A: 10:00 - 10:30
    // B: 10:30 - 11:00
    const events = [createEvent('A', 10, 0, 10, 30), createEvent('B', 10, 30, 11, 0)];

    const layout = layoutEvents(events);

    expect(layout['A']).toEqual({ width: 100, left: 0 });
    expect(layout['B']).toEqual({ width: 100, left: 0 });
  });

  it('should handle nested events', () => {
    // A: 10:00 - 12:00
    // B: 10:30 - 11:00
    const events = [createEvent('A', 10, 0, 12, 0), createEvent('B', 10, 30, 11, 0)];

    const layout = layoutEvents(events);

    expect(layout['A'].width).toBe(50);
    expect(layout['B'].width).toBe(50);
  });
});
