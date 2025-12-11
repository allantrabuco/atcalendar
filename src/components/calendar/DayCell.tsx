import React, { useMemo } from 'react';

import { useDroppable } from '@dnd-kit/core';

import type { CalendarCellProps, TCalendarEvent } from '@/types/Calendar';
import { DraggableEvent } from './DraggableEvent';

import { CELL_HEIGHT } from '@/lib/constants';

/**
 * Safely extract y,m,d,h parts from a scheduledEvents key.
 * Expected format: <prefix>-<year>-<month>-<day>-<hour>-...
 * Returns null if the key does not contain at least 5 parts.
 */
function parseKeyParts(key: string) {
  const parts = key.split('-');
  if (parts.length < 5) return null;
  // parts[0] is the prefix (ignored), parts[1]..parts[4] are year,month,day,hour
  return {
    year: parts[1],
    month: parts[2],
    day: parts[3],
    hour: parts[4],
  };
}

/**
 * Collect events that match a given year/month/day/hour from scheduledEvents.
 * This avoids repeatedly splitting keys in the render path.
 */
function getEventsForHour(
  scheduledEvents: Record<string, TCalendarEvent[]>,
  year: number,
  month: string,
  day: string,
  hour: number
) {
  const targetY = year.toString();
  const targetH = hour.toString();
  const events: TCalendarEvent[] = [];

  // iterate keys once and push matching arrays
  for (const key of Object.keys(scheduledEvents)) {
    const parts = parseKeyParts(key);
    if (!parts) continue;
    if (
      parts.year === targetY &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === targetH
    ) {
      events.push(...scheduledEvents[key]);
    }
  }

  return events;
}

/**
 * CalendarDayCell component
 *
 * Renders a droppable cell (for drag/drop) and any events inside it.
 * - Uses useMemo to avoid recomputing the filtered/sorted events on every render.
 * - Guards against division by zero when laying out concurrent events.
 */
const CalendarDayCell: React.FC<CalendarCellProps> = ({
  year,
  month,
  day,
  hour,
  slot,
  events,
  scheduledEvents,
  children,
  layout,
  onDoubleClick,
}) => {
  // Register this cell as a droppable target with contextual data
  const { setNodeRef } = useDroppable({
    id: `event-${year}-${month}-${day}-${hour}-${slot}`,
    data: { year, month, day, hour, slot },
  });

  // Memoize events for this hour and sort by start time if present
  const eventsThisHour = useMemo(() => {
    const ev = getEventsForHour(scheduledEvents, year, month, day, hour);
    return ev.sort((a, b) => (a.start && b.start ? a.start.getTime() - b.start.getTime() : 0));
  }, [scheduledEvents, year, month, day, hour]);

  const lenEventsThisHour = eventsThisHour.length;

  return (
    <td
      ref={setNodeRef}
      className={` ${slot === 0 ? 'border-t border-t-(--calendar-hour-line)' : slot === 2 ? 'border-t border-t-(--calendar-half-hour-line)' : 'border-t-1 border-t-transparent'} cursor-pointer border-r border-r-(--calendar-hour-line) p-0 align-top transition-colors duration-150`}
      style={{
        height: CELL_HEIGHT,
        position: 'relative',
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* container for events and any children overlays */}
      <div className="pointer-events-none absolute left-0 z-50 flex w-[calc(100%-10px)] flex-row justify-between px-1 py-0">
        {/*
          Render events passed explicitly via the `events` prop.
          Layout logic uses eventsThisHour (derived from scheduledEvents)
          to determine horizontal splitting of concurrent events.
        */}
        {events.map((event) => {
          // If we have a layout map, use it
          if (layout && layout[event.id]) {
            const { width, left } = layout[event.id];
            return (
              <div
                key={event.id}
                style={{
                  width: `calc(${width}%)`,
                  position: 'absolute',
                  left: `calc(${left}% + 2px)`,
                }}
                className="pointer-events-auto"
                data-events-per-hour={Math.round(100 / width)}
                data-id={event.id}
              >
                <DraggableEvent event={event} />
              </div>
            );
          }

          // Fallback to old logic if no layout provided (or event not in layout)
          // guard against division by zero when there are no scheduled events for this hour
          if (lenEventsThisHour <= 0) {
            // fallback: full width, left offset of 2px to match previous offset logic
            return (
              <div
                key={event.id}
                style={{
                  width: '100%',
                  position: 'absolute',
                  left: '2px',
                }}
                className="pointer-events-auto"
                data-events-per-hour={0}
                data-id={event.id}
              >
                <DraggableEvent event={event} />
              </div>
            );
          }

          const index = eventsThisHour.indexOf(event);
          // if event is not found in eventsThisHour, place it at the end
          const effectiveIndex = index >= 0 ? index : lenEventsThisHour - 1;
          const percentWidth = 100 / lenEventsThisHour;
          const posLeft = percentWidth * effectiveIndex;

          return (
            <div
              key={event.id}
              style={{
                width: `calc(${percentWidth}%)`,
                position: 'absolute',
                left: `calc(${posLeft}% + 2px)`,
              }}
              className="pointer-events-auto"
              data-events-per-hour={lenEventsThisHour}
              data-id={event.id}
            >
              <DraggableEvent event={event} />
            </div>
          );
        })}
        {children}
      </div>
    </td>
  );
};

export default CalendarDayCell;
