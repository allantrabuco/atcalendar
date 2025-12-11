import { useEffect, useState } from 'react';

import { useDraggable } from '@dnd-kit/core';

import type { TCalendarEvent } from '@/types/Calendar';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';
import { AllDayEventCard } from './AllDayEventCard';
import EventPanel from './EventPanel';
import { useEvents, useViewBy } from './Provider';

export function DraggableAllDayEvent({ event }: { event: TCalendarEvent }) {
  const { selectedEvent, setSelectedEvent } = useEvents();
  const { viewBy } = useViewBy();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const handleClose = () => setIsEditOpen(false);
    window.addEventListener('resize', handleClose);
    window.addEventListener('calendar-scroll', handleClose);
    return () => {
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('calendar-scroll', handleClose);
    };
  }, []);

  return (
    <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
      <PopoverAnchor asChild>
        <AllDayEventCard
          event={event}
          isSelected={selectedEvent?.id === event.id}
          isDragging={isDragging}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
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
            if (viewBy === 'week' || viewBy === 'month') {
              setIsEditOpen(true);
            }
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-80 border-[var(--left-border-colour)] bg-[var(--left-background)] p-0 shadow-none"
        side="bottom"
        align="start"
        sideOffset={0}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
      >
        <EventPanel
          title="Edit Event"
          event={event}
          start={event.start}
          end={event.end}
          allDay={true}
          onClose={() => setIsEditOpen(false)}
          className="m-0"
        />
      </PopoverContent>
    </Popover>
  );
}
