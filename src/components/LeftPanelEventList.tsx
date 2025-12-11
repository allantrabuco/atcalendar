import React, { useEffect, useMemo, useRef } from 'react';

import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import { useEvents, useSelectedDate, useViewBy } from '@/components/calendar/Provider';
import type { TCalendarEvent } from '@/types/Calendar';

const LeftPanelEventList: React.FC = () => {
  const { events, selectedEvent, setSelectedEvent } = useEvents();
  const { viewBy } = useViewBy();
  const { selectedDate } = useSelectedDate();
  const listRef = useRef<HTMLDivElement>(null);
  const headerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Flatten events from the record structure to a single array
  const allEvents = useMemo(() => {
    return Object.values(events).flat();
  }, [events]);

  // Filter and sort events based on view and selected date
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];

    let filtered: TCalendarEvent[] = [];

    switch (viewBy) {
      case 'day':
        filtered = allEvents.filter((event) => isSameDay(event.start, selectedDate));
        break;
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        filtered = allEvents.filter((event) => isWithinInterval(event.start, { start, end }));
        break;
      }
      case 'month': {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        filtered = allEvents.filter((event) => isWithinInterval(event.start, { start, end }));
        break;
      }
      case 'year': {
        const start = startOfYear(selectedDate);
        const end = endOfYear(selectedDate);
        filtered = allEvents.filter((event) => isWithinInterval(event.start, { start, end }));
        break;
      }
      default:
        break;
    }

    // Sort by all-day status then by start time
    return filtered.sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return a.start.getTime() - b.start.getTime();
    });
  }, [allEvents, viewBy, selectedDate]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TCalendarEvent[]> = {};
    filteredEvents.forEach((event) => {
      const dateKey = format(event.start, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  // Sorted date keys
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedEvents).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [groupedEvents]);

  // Scroll to the selected date header
  useEffect(() => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const element = headerRefs.current[dateKey];

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [selectedDate, sortedDateKeys]);

  // Scroll to the selected event
  useEffect(() => {
    if (!selectedEvent) return;

    const element = eventRefs.current[selectedEvent.id];

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedEvent]);

  if (filteredEvents.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-4 text-sm">
        No events
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="scrollbar scrollbar-corner-custom scrollbar-thumb-custom-light scrollbar-track-custom scrollbar-hover:bg-[--scroll-thumb-hover-colour] w-full flex-1 overflow-y-auto overflow-y-scroll border-[--scroll-border-colour] px-4 pr-2"
    >
      {sortedDateKeys.map((dateKey) => (
        <div
          key={dateKey}
          ref={(el) => {
            headerRefs.current[dateKey] = el;
          }}
        >
          <div className="bg-background sticky top-0 z-10 flex h-8 items-center px-2 text-sm font-semibold backdrop-blur-xs supports-[backdrop-filter]:bg-[var(--main-background)]/60">
            <h4 className="text-sm leading-none font-medium text-(--button-group-text-default-colour)">
              <span className="font-semibold">
                {format(new Date(dateKey), 'EEEE').toUpperCase()}
              </span>
              <span className="font-light">{format(new Date(dateKey), ' dd/MM/yyyy')}</span>
            </h4>
          </div>
          <div className="p-0.5">
            {groupedEvents[dateKey].map((event) => (
              <div
                key={event.id}
                ref={(el) => {
                  eventRefs.current[event.id] = el;
                }}
                onClick={() => setSelectedEvent(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedEvent(event);
                  }
                }}
                className={`hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm transition-colors ${event.allDay ? `px-0` : `px-2`} rounded-md`}
                style={
                  selectedEvent?.id === event.id
                    ? {
                        color: `white`,
                        backgroundColor: `var(--event-default-colour-${event.colour}-marker)`,
                      }
                    : {}
                }
              >
                <div
                  key={event.id}
                  className={`my-1 p-1 pb-1 text-xs ${event.allDay ? `rounded-md` : ``}`}
                  style={{
                    backgroundColor: event.allDay
                      ? `var(--event-default-colour-${event.colour}-marker)`
                      : `transparent`,
                  }}
                >
                  <div className="flex flex-row items-center">
                    {!event.allDay && (
                      <>
                        <div
                          className={`mr-2 h-3 w-2 rotate-60 transform rounded`}
                          style={{
                            backgroundColor:
                              selectedEvent?.id === event.id
                                ? `white`
                                : `var(--event-default-colour-${event.colour}-marker)`,
                          }}
                        />
                        <span
                          className={`mr-1 font-semibold ${selectedEvent?.id === event.id ? `text-white` : `text-(--button-group-text-default-colour)`}`}
                        >
                          {format(new Date(event.start), 'HH:mm')} -{' '}
                          {format(new Date(event.end), 'HH:mm')}
                        </span>
                      </>
                    )}
                  </div>
                  {event.allDay && (
                    <div className="relative flex flex-row items-center">
                      {selectedEvent?.id === event.id && (
                        <div
                          className={`absolute -top-1 -left-1 h-7 w-1.5 rounded-tl-md rounded-bl-md`}
                          style={{ backgroundColor: `white` }}
                        />
                      )}
                    </div>
                  )}
                  <span
                    className={`${event.allDay && selectedEvent?.id === event.id ? `pl-2` : event.allDay ? `pl-1` : `pl-4`} truncate text-sm font-light`}
                  >
                    {event.title || '(No Title)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeftPanelEventList;
