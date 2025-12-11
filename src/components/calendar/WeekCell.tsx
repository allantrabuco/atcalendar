import React, { useMemo } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { isToday } from 'date-fns';

import type { CalendarCellProps, TCalendarEvent } from '@/types/Calendar';
import { DraggableEvent } from './DraggableEvent';
import { useSelectedDate } from './Provider';

import { CELL_HEIGHT } from '@/lib/constants';

/**
 * Extract events that belong to a specific year-month-day-hour key.
 * Keys in scheduledEvents are expected to be in the format: prefix-Y-M-D-H (e.g. "event-2025-11-17-9")
 */
function getEventsForHour(
  scheduledEvents: Record<string, TCalendarEvent[]>,
  year: number,
  month: string,
  day: string,
  hour: number
) {
  const events: TCalendarEvent[] = [];

  // Iterate entries to avoid repeated key lookups and to be explicit about destructuring
  Object.entries(scheduledEvents).forEach(([key, evts]) => {
    const parts = key.split('-');
    // Defensive: ensure we have at least the expected number of parts before destructuring
    if (parts.length < 5) return;
    const [, y, m, d, h] = parts;
    if (y === year.toString() && m === month && d === day && h === hour.toString()) {
      events.push(...evts);
    }
  });

  return events;
}

const WeekCell: React.FC<CalendarCellProps> = ({
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
}: CalendarCellProps) => {
  // Create a droppable area for dnd-kit; id encodes the cell coordinates
  const { setNodeRef } = useDroppable({
    id: `event-${year}-${month}-${day}-${hour}-${slot}`,
    data: { year, month, day, hour, slot },
  });

  // Memoize the computed events for this hour to avoid recomputation on every render
  const eventsThisHour = useMemo(() => {
    return getEventsForHour(scheduledEvents, year, month, day, hour).sort((a, b) =>
      a.start && b.start ? a.start.getTime() - b.start.getTime() : 0
    );
  }, [scheduledEvents, year, month, day, hour]);

  // Get the selected date from provider
  const { selectedDate, setSelectedDate } = useSelectedDate();

  // Build a Date object for this cell; memoized for stable comparisons
  const cellDate = useMemo(() => new Date(`${year}-${month}-${day}`), [year, month, day]);

  // Determine whether this column is the selected date column
  const isSelectedColumn = useMemo(() => {
    if (!selectedDate) return false;
    return (
      cellDate.getFullYear() === selectedDate.getFullYear() &&
      cellDate.getMonth() === selectedDate.getMonth() &&
      cellDate.getDate() === selectedDate.getDate()
    );
  }, [cellDate, selectedDate]);

  /**
   * Compute top border class based on slot and selection state.
   * - slot === 0 -> hour line
   * - slot === 2 -> half-hour line
   * - otherwise, if selected column -> highlight border depending on whether selected is today
   * - fallback -> transparent top border
   *
   * Memoized to avoid repeated string building on every render.
   */
  const topBorderClass = useMemo(() => {
    if (slot === 0) return 'border-t-1 border-t-(--calendar-hour-line)';
    if (slot === 2) return 'border-t-1 border-t-(--calendar-half-hour-line)';
    if (isSelectedColumn) {
      // preserve original behaviour: check if the selected date is today
      return isToday(selectedDate ?? new Date())
        ? 'border-t-1 border-t-(--colour-4-10)'
        : 'border-t-1 border-t-(--grey-4)';
    }
    return 'border-t-1 border-t-transparent';
  }, [slot, isSelectedColumn, selectedDate]);

  /**
   * Compute background class only for selected column.
   * Keep the same colours as before.
   */
  const backgroundClass = useMemo(() => {
    if (!isSelectedColumn) return '';
    return isToday(selectedDate ?? new Date()) ? 'bg-[var(--colour-4-10)]' : 'bg-[var(--grey-4)]';
  }, [isSelectedColumn, selectedDate]);

  // Consolidate the final className for the cell
  const cellClassName = [
    topBorderClass,
    'align-top',
    'p-0',
    'transition-colors',
    'duration-150',
    'cursor-pointer',
    'border-r-[var(--calendar-hour-line)]',
    'border-r-1',
    backgroundClass,
  ]
    .filter(Boolean)
    .join(' ');

  // Render
  return (
    <td
      ref={setNodeRef}
      className={cellClassName}
      style={{
        height: CELL_HEIGHT,
        position: 'relative',
      }}
      onClick={() => {
        // e.stopPropagation();
        setSelectedDate?.(cellDate);
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* Container holds draggable events and any children passed in (e.g. overlays) */}
      <div className="absolute left-0 z-50 flex w-[calc(100%-3px)] flex-row justify-between px-1 py-0">
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

          // Number of events in this hour — guard against zero to avoid division by zero.
          // If there are no scheduled events for the hour, fallback to 1 to keep layout stable.
          const lenEventsThisHour = Math.max(1, eventsThisHour.length);

          // Position this event based on its index within the hour bucket
          const index = eventsThisHour.indexOf(event);
          const posLeft = (100 / lenEventsThisHour) * (index >= 0 ? index : 0);

          return (
            <div
              key={event.id}
              style={{
                width: `calc(${100 / lenEventsThisHour}%)`,
                position: 'absolute',
                left: `calc(${posLeft}% + 2px)`,
              }}
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

export default React.memo(WeekCell);
