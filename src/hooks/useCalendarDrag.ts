import React, { useCallback, useState } from 'react';

import type { DragEndEvent, DragStartEvent, Over } from '@dnd-kit/core';
import { addMinutes, differenceInMinutes, format } from 'date-fns';

import { CELL_HEIGHT, CELL_WIDTH, EVENT_ROW_HEIGHT } from '@/lib/constants';
import { updatedEvent } from '@/lib/utils';

import { useEvents, useSelectedDate } from '@/components/calendar/Provider';
import type { TCalendarEvent } from '@/types/Calendar';

/*
  Hook: useCalendarDrag

  Responsibilities:
  - Provide drag handlers used by calendar cells / event items.
  - Update scheduling store when an event is dropped on a cell or back to the event list.
  - Maintain some transient UI sizing state via provided setters.

  Notes / improvements applied:
  - Replaced inline mutations of activeEvent with immutable copies before persisting.
  - Consolidated duplicated logic for moving events and date calculations.
  - Added robust guards for duplicate / re-entrant drag-end notifications.
  - Added explanatory comments and used useCallback to stabilize handler identities.
  - Use explicit parseInt radix for clarity.
  - Use 24-hour format in date comparisons to avoid AM/PM pitfalls.
*/

export interface DragOverCellType {
  year: number;
  month: string;
  day: number;
  hour: number;
  slot: number;
}

export default function useCalendarDrag(params: {
  activeEvent: TCalendarEvent | null;
  setActiveEvent: (ev: TCalendarEvent | null) => void;
  setActiveEventElement: (el: HTMLElement | null) => void;
  setColumnSize: React.Dispatch<React.SetStateAction<number>>;
  setRowSize?: React.Dispatch<React.SetStateAction<number>> | undefined;
  setMaxVisibleEvents?: React.Dispatch<React.SetStateAction<number>> | undefined;
  lastDragRef?: React.RefObject<{ key: string; ts: number } | null>;
  isHandlingDrop?: React.RefObject<boolean>;
  setDragOverCell: (c: DragOverCellType | null) => void;
}) {
  const {
    activeEvent,
    setActiveEvent,
    setActiveEventElement,
    setColumnSize,
    setRowSize,
    setMaxVisibleEvents,
    lastDragRef,
    isHandlingDrop,
    setDragOverCell,
  } = params;

  const { events, setEvents, setSelectedEvent } = useEvents();
  const { selectedDate } = useSelectedDate();

  // Keep track of where the drag started (calendar cell key or 'event-list')
  const [activeFrom, setActiveFrom] = useState<string | null>(null);

  // Helper: parse an over.id like `event-YYYY-MM-DD-HH-SLOT` into parts
  const parseOverId = (id: string) => id.toString().split('-') as string[]; // caller validates prefix

  // Helper: build a Date based on selected base date and YY/MM/DD/HH/slot parts.
  const buildDateTime = useCallback(
    (yearStr: string, monthStr: string, dayStr: string, hourStr: string, slotStr: string) => {
      const base = new Date(
        parseInt(yearStr, 10),
        parseInt(monthStr, 10) - 1,
        parseInt(dayStr, 10),
        parseInt(hourStr, 10),
        parseInt(slotStr, 10) * 15,
        0,
        0
      );
      return base;
    },
    []
  );

  /*
    Handler: drag start
    - mark active event
    - figure out which calendar cell (or event-list) it came from
    - capture DOM sizes for layout calculations
  */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { event: draggedEvent } = event.active.data.current as {
        event: TCalendarEvent;
      };
      setActiveEvent(draggedEvent);
      setSelectedEvent(draggedEvent);

      // find key in scheduled events where this event resides
      let foundKey: string | null = null;
      for (const key in events) {
        if (events[key].some((ev: TCalendarEvent) => ev.id === draggedEvent.id)) {
          foundKey = key;
          break;
        }
      }
      setActiveFrom(foundKey ?? 'event-list');

      // attempt to derive sizes from the event DOM node
      const node = document.querySelector(`[data-id="${event.active.id}"]`) as HTMLElement | null;

      if (node) {
        setActiveEventElement(node);

        const td = node.closest('td') as HTMLElement | null;
        const newCellHeight = td?.offsetHeight ?? CELL_HEIGHT;
        const newColumnSize = td?.offsetWidth ?? CELL_WIDTH;

        // update column/row sizes only when changed to avoid reflows
        setColumnSize((prev) => (prev !== newColumnSize ? newColumnSize : prev));
        if (setRowSize) {
          setRowSize((prev) => (prev !== newCellHeight ? newCellHeight : prev));
          if (setMaxVisibleEvents) {
            const newMaxVisibleEvents = Math.floor(newCellHeight / EVENT_ROW_HEIGHT) - 1;
            setMaxVisibleEvents((prev) =>
              prev !== newMaxVisibleEvents ? newMaxVisibleEvents : prev
            );
          }
        }
      }

      // clear any previous drag-over highlight
      setDragOverCell(null);
    },
    [
      events,
      setActiveEvent,
      setActiveEventElement,
      setColumnSize,
      setRowSize,
      setMaxVisibleEvents,
      setDragOverCell,
      setSelectedEvent,
    ]
  );

  /*
    Immutable move: given a target datetime & optional preserved duration,
    return a new event object (do not mutate the input activeEvent).
  */
  const makeMovedEvent = useCallback((src: TCalendarEvent, newStart: Date, preserveEnd = true) => {
    const originalStart = src.start ? new Date(src.start) : new Date();
    const originalEnd = src.end ? new Date(src.end) : new Date();
    const duration = differenceInMinutes(originalEnd, originalStart);

    const moved: TCalendarEvent = {
      ...src,
      start: newStart,
      end: preserveEnd ? addMinutes(newStart, duration) : src.end,
    };
    return moved;
  }, []);

  /*
    Handler: standard drag end (used when dropping inside same-week view / fine-grained cell)
    - If drop target is a calendar cell, compute new start/end and persist.
    - If dropped back to 'event-list', remove from scheduled map.
  */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over } = event;
      if (!activeEvent) {
        // nothing to do
        setActiveEvent(null);
        setActiveFrom(null);
        setDragOverCell(null);
        return;
      }
      if (!over) {
        setActiveEvent(null);
        setActiveFrom(null);
        setDragOverCell(null);
        return;
      }

      // target is a calendar cell id
      if (typeof over.id === 'string' && over.id.startsWith('event-')) {
        const [, yearStr, monthStr, dayStr, hourStr, slotStr] = parseOverId(over.id);

        // build new datetime precisely for this cell/slot
        const newDateTime = buildDateTime(yearStr, monthStr, dayStr, hourStr, slotStr);

        // compare using 24-hour format to avoid AM/PM ambiguity
        const originalStart = activeEvent.start ?? newDateTime;
        if (format(newDateTime, 'yyyyMMddHHmmss') !== format(originalStart, 'yyyyMMddHHmmss')) {
          // create a moved copy and persist into scheduled events
          const moved = makeMovedEvent(activeEvent, newDateTime, !activeEvent.allDay);
          const newSlot = parseInt(slotStr, 10);
          moved.slot = newSlot;

          // If was all-day, it is no longer
          if (activeEvent.allDay) {
            moved.allDay = false;
            // Set default duration if coming from all-day (e.g. 1 hour)
            moved.end = addMinutes(moved.start, 60);
            moved.duration = 60;
          }

          setEvents((prev) => {
            const newScheduled: Record<string, TCalendarEvent[]> = { ...prev };

            // remove from previous cell if applicable
            if (activeFrom && activeFrom !== 'event-list') {
              newScheduled[activeFrom] = (newScheduled[activeFrom] || []).filter(
                (ev) => ev.id !== activeEvent.id
              );
              if (newScheduled[activeFrom].length === 0) delete newScheduled[activeFrom];
            }

            const cellKey = `event-${yearStr}-${monthStr}-${dayStr}-${hourStr}-${slotStr}`;
            newScheduled[cellKey] = [...(newScheduled[cellKey] || []), moved];

            // persist change to external storage / API
            updatedEvent(moved);

            return newScheduled;
          });
        }
      } else if (typeof over.id === 'string' && over.id.startsWith('all-day-')) {
        // Dropped on an all-day section
        const [, , yearStr, monthStr, dayStr] = over.id.split('-');
        const newDate = new Date(
          parseInt(yearStr, 10),
          parseInt(monthStr, 10) - 1,
          parseInt(dayStr, 10)
        );

        // Check if changed
        const originalStart = activeEvent.start ?? new Date();
        const isSameDay = format(newDate, 'yyyyMMdd') === format(originalStart, 'yyyyMMdd');

        if (!activeEvent.allDay || !isSameDay) {
          const moved: TCalendarEvent = {
            ...activeEvent,
            start: newDate,
            end: newDate, // End date doesn't matter much for all-day, but keep it consistent
            allDay: true,
            slot: undefined, // Clear slot
          };

          setEvents((prev) => {
            const newScheduled: Record<string, TCalendarEvent[]> = { ...prev };

            // remove from previous cell if applicable
            if (activeFrom && activeFrom !== 'event-list') {
              newScheduled[activeFrom] = (newScheduled[activeFrom] || []).filter(
                (ev) => ev.id !== activeEvent.id
              );
              if (newScheduled[activeFrom].length === 0) delete newScheduled[activeFrom];
            }

            const newKey = `all-day-${yearStr}-${monthStr}-${dayStr}`;
            newScheduled[newKey] = [...(newScheduled[newKey] || []), moved];

            updatedEvent(moved);
            return newScheduled;
          });
        }
      } else if (over.id === 'event-list') {
        // remove event from any scheduled cells (back to unscheduled list)
        setEvents((prev) => {
          const copy: Record<string, TCalendarEvent[]> = { ...prev };
          for (const key in copy) {
            copy[key] = copy[key].filter((ev) => ev.id !== activeEvent.id);
            if (copy[key].length === 0) delete copy[key];
          }
          return copy;
        });
      }

      // reset transient drag state
      setActiveEvent(null);
      setActiveFrom(null);
      setDragOverCell(null);
    },
    [
      activeEvent,
      activeFrom,
      buildDateTime,
      makeMovedEvent,
      setEvents,
      setActiveEvent,
      setActiveFrom,
      setDragOverCell,
    ]
  );

  /*
    Handler: month-level drag end
    - Similar to handleDragEnd but used when dropping between month calendar views.
    - Extra guards to avoid processing duplicate notifications (debounce via lastDragRef).
    - Uses isHandlingDrop ref to guard re-entrancy.
  */
  const handleMonthDragEnd = useCallback(
    (event: DragEndEvent) => {
      // prevent re-entrancy
      if (isHandlingDrop?.current) {
        console.debug('Ignored reentrant drag end');
        return;
      }
      if (isHandlingDrop) isHandlingDrop.current = true;

      try {
        const key = `${event.active?.id ?? ''}::${event.over?.id ?? ''}`;
        const now = Date.now();

        // ignore identical quick duplicates
        if (
          lastDragRef?.current &&
          lastDragRef.current.key === key &&
          now - lastDragRef.current.ts < 300
        ) {
          console.debug('Ignored duplicate drag end key', key);
          return;
        }
        if (lastDragRef) lastDragRef.current = { key, ts: now };

        const { over } = event;
        if (!activeEvent || !over) return;

        if (typeof over.id === 'string' && over.id.startsWith('event-')) {
          const [, yearStr, monthStr, dayStr, hourStr, slotStr] = parseOverId(over.id);

          // check if moved to a different day (month-level movement focuses on date change)
          const newDateOnly = (() => {
            const d = selectedDate ? new Date(selectedDate) : new Date();
            d.setFullYear(parseInt(yearStr, 10));
            d.setMonth(parseInt(monthStr, 10) - 1);
            d.setDate(parseInt(dayStr, 10));
            d.setHours(0, 0, 0, 0);
            return d;
          })();

          const originalStart = activeEvent.start ?? newDateOnly;
          if (format(newDateOnly, 'yyyyMMdd') === format(originalStart, 'yyyyMMdd')) {
            // same day -> nothing to do
            return;
          }

          setEvents((prev) => {
            const newScheduled: Record<string, TCalendarEvent[]> = { ...prev };

            // remove from previous cell if applicable
            if (activeFrom && activeFrom !== 'event-list') {
              newScheduled[activeFrom] = (newScheduled[activeFrom] || []).filter(
                (ev) => ev.id !== activeEvent.id
              );
              if (newScheduled[activeFrom].length === 0) delete newScheduled[activeFrom];
            }

            // if activeFrom looks like an event key, prefer preserving its hour/slot
            const prevParts = activeFrom?.split('-') ?? [];
            let newHour = hourStr;
            let newSlot = slotStr;
            if (prevParts.length >= 6) {
              newHour = prevParts[4];
              newSlot = prevParts[5];
            }

            // build datetime using possibly preserved hour/slot
            const newDateTime = buildDateTime(yearStr, monthStr, dayStr, newHour, newSlot);

            const moved = makeMovedEvent(activeEvent, newDateTime, true);
            moved.slot = parseInt(newSlot, 10);

            const newCellKeyStr = `event-${yearStr}-${monthStr}-${dayStr}-${newHour}-${newSlot}`;
            newScheduled[newCellKeyStr] = [...(newScheduled[newCellKeyStr] || []), moved];

            // persist change
            updatedEvent(moved);

            return newScheduled;
          });
        } else if (over.id === 'event-list') {
          // moved back to unscheduled list
          setEvents((prev) => {
            const copy: Record<string, TCalendarEvent[]> = { ...prev };
            for (const key in copy) {
              copy[key] = copy[key].filter((ev) => ev.id !== activeEvent.id);
              if (copy[key].length === 0) delete copy[key];
            }
            return copy;
          });
        }
      } finally {
        if (isHandlingDrop) isHandlingDrop.current = false;
        setActiveEvent(null);
        setActiveFrom(null);
        setDragOverCell(null);
      }
    },
    [
      activeEvent,
      activeFrom,
      buildDateTime,
      isHandlingDrop,
      lastDragRef,
      makeMovedEvent,
      selectedDate,
      setEvents,
      setActiveEvent,
      setActiveFrom,
      setDragOverCell,
    ]
  );

  /*
    Handler: drag over (used to display a hover/preview cell)
    - Update drag-over cell info only when the hovered id matches expected pattern.
  */
  const handleDragOver = useCallback(
    (event: { over: Over | null }) => {
      const { over } = event;
      if (over && typeof over.id === 'string' && over.id.startsWith('event-')) {
        const [, yearStr, monthStr, dayStr, hourStr, slotStr] = parseOverId(over.id);
        setDragOverCell({
          year: parseInt(yearStr, 10),
          month: monthStr,
          day: parseInt(dayStr, 10),
          hour: parseInt(hourStr, 10),
          slot: parseInt(slotStr, 10),
        });
      } else {
        setDragOverCell(null);
      }
      setSelectedEvent(null);
    },
    [setDragOverCell, setSelectedEvent]
  );

  return { handleDragStart, handleDragEnd, handleMonthDragEnd, handleDragOver };
}
