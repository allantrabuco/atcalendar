import React, { useMemo } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { isSameDay, isToday } from 'date-fns';

import type { CalendarCellProps, TCalendarEvent } from '@/types/Calendar';
import { DraggableMonthEvent } from './DraggableMonthEvent';
import { useSelectedDate } from './Provider';

import { CELL_HEIGHT } from '@/lib/constants';

/**
 * Extract events that belong to a specific year-month-day-hour key.
 * Keys in scheduledEvents are expected to be in the format: prefix-Y-M-D-H (e.g. "event-2025-11-17-9")
 *
 * This helper is defensive and performs minimal splitting/parsing for performance.
 */
function getEventsForHour(
  scheduledEvents: Record<string, TCalendarEvent[]> | undefined,
  year: number,
  month: string,
  day: string,
  hour: number
): TCalendarEvent[] {
  if (!scheduledEvents) return [];

  const targetY = year.toString();
  const targetM = month;
  const targetD = day;
  const targetH = hour.toString();

  const out: TCalendarEvent[] = [];

  // Iterate entries once and push matching lists directly
  for (const [key, evts] of Object.entries(scheduledEvents)) {
    const parts = key.split('-');
    if (parts.length < 5) continue;
    // parts: [prefix, year, month, day, hour, ...maybeMore]
    const [, y, m, d, h] = parts;
    if (y === targetY && m === targetM && d === targetD && h === targetH) {
      out.push(...evts);
    }
  }

  return out;
}

type TCalendarMonthCellProps = CalendarCellProps & {
  maxVisibleEvents: number;
  onClick?: () => void;
  isExpanded?: boolean;
  onExpand?: (rect: DOMRect) => void;
};

const MonthCell: React.FC<TCalendarMonthCellProps> = ({
  year,
  month,
  day,
  hour,
  slot,
  events = [],
  scheduledEvents,
  onClick,
  children,
  columnSize,
  maxVisibleEvents,
  isExpanded = false,
  onExpand,
}: TCalendarMonthCellProps) => {
  // Create a stable droppable id for this cell using the same format the app expects.
  // useDroppable returns setNodeRef which we pass to the <td> element.
  const { setNodeRef } = useDroppable({
    id: `event-${year}-${month}-${day}-${hour}-${slot}`,
    data: { year, month, day, hour, slot },
  });

  // Memoize extraction + sort of scheduled events for this hour to avoid recomputation on unrelated renders.
  const eventsThisHour = useMemo(() => {
    return getEventsForHour(scheduledEvents, year, month, day, hour).sort((a, b) =>
      a.start instanceof Date && b.start instanceof Date ? a.start.getTime() - b.start.getTime() : 0
    );
  }, [scheduledEvents, year, month, day, hour]);

  // Selected date from context/provider
  const { selectedDate, setSelectedDate } = useSelectedDate();

  // Build a Date object for the cell; use numeric constructor to avoid string parsing differences/timezone issues.
  // month is a string (e.g. "11") so subtract 1 for Date month index.
  const cellDate = useMemo(() => {
    const m = Number(month);
    const d = Number(day);
    return new Date(year, Number.isFinite(m) ? m - 1 : 0, Number.isFinite(d) ? d : 1);
  }, [year, month, day]);

  // Determine if this cell's column is the one that's currently selected.
  const isSelected = !!selectedDate && isSameDay(cellDate, selectedDate);

  // Precompute length used in render to avoid repeated calculation in map
  const lenEventsThisHour = eventsThisHour.length;

  // State for expansion
  const cellRef = React.useRef<HTMLTableDataCellElement>(null);

  return (
    <td
      ref={(node) => {
        setNodeRef(node);

        cellRef.current = node;
      }}
      className={` ${slot == 0 ? 'border-t border-t-(--calendar-hour-line)' : slot == 2 ? 'border-t border-t-(--calendar-half-hour-line)' : 'border-t border-t-transparent'} cursor-pointer border-r border-r-(--calendar-hour-line) p-0 align-top transition-colors duration-150 ${isSelected && isToday(selectedDate ?? new Date()) ? 'bg-(--colour-4-10)' : ''} ${isSelected && !isToday(selectedDate ?? new Date()) ? 'bg-(--grey-4)' : ''} relative`}
      style={{
        width: columnSize,
        height: `${CELL_HEIGHT}px`,
      }}
      onClick={onClick}
    >
      {/* Layer for events and any additional children (e.g. hour labels) */}
      <div
        className={`absolute top-0 left-0 z-0 flex h-full w-full flex-col justify-start overflow-hidden px-2 pt-6 transition-all duration-200 ease-in-out`}
      >
        {/* If expanded, we hide the events here because they are shown in the overlay. 
            However, we might want to keep them invisible to maintain layout if needed, 
            but for now we just don't render them if expanded to avoid duplicate IDs for DnD. 
            Actually, if we don't render them, the cell might look empty underneath. 
            Let's render them but hidden or just rely on the overlay covering them.
            The overlay is absolute over the cell, so it covers it.
            BUT, if we pass 'isExpanded' as true, we should probably NOT render the "more" button again.
         */}
        {(isExpanded ? [] : events.slice(0, maxVisibleEvents)).map((event, ix) => {
          // When we reach the last visible slot show the "N more..." indicator
          // ONLY if NOT expanded
          if (!isExpanded && ix + 1 === maxVisibleEvents) {
            return (
              <div
                key="more-indicator"
                className="relative w-full cursor-pointer"
                data-events-per-hour={lenEventsThisHour}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent cell click
                  setSelectedDate?.(event.start);
                  if (cellRef.current && onExpand) {
                    onExpand(cellRef.current.getBoundingClientRect());
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    setSelectedDate?.(event.start);
                    if (cellRef.current && onExpand) {
                      onExpand(cellRef.current.getBoundingClientRect());
                    }
                  }
                }}
              >
                <span className="text-xs font-medium">
                  {events.length - maxVisibleEvents + 1} more...
                </span>
              </div>
            );
          }

          // Regular visible event - DraggableMonthEvent handles its own drag behavior.
          return (
            <div
              key={event.id}
              className="relative w-full"
              data-events-per-hour={lenEventsThisHour}
              data-id={event.id}
            >
              <DraggableMonthEvent event={event} />
            </div>
          );
        })}
        {children}
      </div>
    </td>
  );
};

export default React.memo(MonthCell);
