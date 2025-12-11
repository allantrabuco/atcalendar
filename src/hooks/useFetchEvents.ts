import { endOfWeek, endOfYear, getYear, startOfWeek, startOfYear } from 'date-fns';
import { useCallback, useEffect, useRef } from 'react';

import { useEvents, useLoading, useSelectedDate, useViewBy } from '@/components/calendar/Provider';
import { groupApiEventsToScheduled } from '@/lib/utils';
import { getEventsByDate, getEventsByMonth, getEventsByRange } from '@/services/Events';
import type { IEvent, TCalendarEvent } from '@/types/Calendar';

const useFetchEvents = (autoFetch = true) => {
  const { viewBy } = useViewBy();
  const { selectedDate } = useSelectedDate();
  const { setEvents } = useEvents();
  const { setIsLoading } = useLoading();

  // Refs to track previously fetched ranges to avoid redundant calls
  const fetchedRangeRef = useRef<{ start: number; end: number } | null>(null);
  const prevSelectedMonthRef = useRef<number | null>(null);
  const prevSelectedYearRef = useRef<number | null>(null);

  const fetchEvents = useCallback(
    async (force = false) => {
      if (!selectedDate) return;

      let events: IEvent[] = [];
      let gEvents: Record<string, TCalendarEvent[]> = {};

      try {
        switch (viewBy) {
          case 'day':
            setIsLoading(true);
            setEvents({});
            events = await getEventsByDate(selectedDate);
            break;

          case 'week': {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

            const startMs = weekStart.getTime();
            const endMs = weekEnd.getTime();

            // Check if we already fetched this range
            if (
              !force &&
              fetchedRangeRef.current &&
              fetchedRangeRef.current.start === startMs &&
              fetchedRangeRef.current.end === endMs
            ) {
              return;
            }

            setIsLoading(true);
            setEvents({});
            events = await getEventsByRange(weekStart, weekEnd);

            // Update the ref only after a successful fetch (or before, if we want to block immediate refetches)
            fetchedRangeRef.current = { start: startMs, end: endMs };

            break;
          }

          case 'month': {
            if (!force && prevSelectedMonthRef.current === selectedDate?.getMonth()) {
              return;
            }
            setIsLoading(true);
            setEvents({});
            prevSelectedMonthRef.current = selectedDate?.getMonth() ?? null;
            events = await getEventsByMonth(selectedDate);

            break;
          }

          case 'year': {
            const year = getYear(selectedDate);

            // Check if we already fetched this year
            if (!force && prevSelectedYearRef.current === year) {
              return;
            }

            setIsLoading(true);
            setEvents({});
            // get the first day of the year
            const firstDayOfYear = startOfYear(selectedDate);
            // get the last day of the year
            const lastDayOfYear = endOfYear(selectedDate);
            events = await getEventsByRange(firstDayOfYear, lastDayOfYear);

            // Update the ref only after a successful fetch
            prevSelectedYearRef.current = year;

            break;
          }

          default:
            break;
        }

        gEvents = groupApiEventsToScheduled(events);
        setEvents(gEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate, viewBy, setEvents, setIsLoading]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [fetchEvents, autoFetch]);

  return { fetchEvents };
};

export default useFetchEvents;
