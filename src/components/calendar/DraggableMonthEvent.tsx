import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import type { TCalendarEvent } from '@/types/Calendar';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';
import EventPanel from './EventPanel';
import { useEvents } from './Provider';

export function DraggableMonthEvent({ event }: { event: TCalendarEvent }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const { selectedEvent, setSelectedEvent } = useEvents();

  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const handleClose = () => setIsEditOpen(false);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  // Stable style objects to avoid creating new objects each render.
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      backgroundColor:
        selectedEvent?.id === event.id && !isDragging
          ? `var(--event-default-colour-${event.colour})`
          : event.allDay
            ? `var(--event-default-colour-${event.colour}-30)`
            : `transparent`,
      color: selectedEvent?.id === event.id && !isDragging ? `white` : `var(--foreground)`,
      userSelect: 'none',
    }),
    [event.colour, selectedEvent?.id, isDragging, event.id, event.allDay]
  );

  return (
    <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
      <PopoverAnchor asChild>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={`relative mt-1 flex w-full cursor-grab flex-col items-start justify-between rounded border-0 py-0.5 pr-1 pl-2 text-sm font-medium transition-opacity outline-none ${isDragging ? 'bg-opacity-30' : 'bg-opacity-60'}`}
          style={containerStyle}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setIsEditOpen(true);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditOpen(true);
          }}
        >
          <div
            className={`absolute left-0 w-1 border-0 text-xs ${event.allDay ? 'top-0 h-full rounded-tl rounded-bl' : 'h-3/4 rounded'}`}
            style={{
              backgroundColor: `var(--event-default-colour-${event.colour})`,
            }}
          />

          <div
            className={`flex h-full w-full flex-row justify-between gap-1 overflow-hidden text-xs`}
          >
            <span className="font-regular max-w-full truncate overflow-hidden whitespace-nowrap">
              {` ${event.title}`}
            </span>
            <span className="font-regular">
              {event.allDay ? '' : event.start ? format(event.start, 'HH:mm') : ''}
            </span>
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-80 border-[var(--left-border-colour)] bg-[var(--left-background)] p-0 shadow-none"
        side="right"
        align="start"
        sideOffset={-6}
        alignOffset={-24}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EventPanel
          title="Edit Event"
          event={event}
          start={event.start}
          end={event.end}
          onClose={() => setIsEditOpen(false)}
          className="m-0"
        />
      </PopoverContent>
    </Popover>
  );
}
