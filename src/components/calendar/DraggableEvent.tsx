import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';

import type { TCalendarEvent } from '@/types/Calendar';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';
import EventPanel from './EventPanel';
import { useEvents, useViewBy } from './Provider';

// Small className helper to keep JSX cleaner.
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/**
 * DraggableEvent
 *
 * - Memoized to avoid unnecessary re-renders when props don't change.
 * - Uses useDraggable from @dnd-kit/core to provide drag behaviour.
 * - Uses useMemo for derived values and inline style objects for stable references.
 *
 * Note: colours and border-related classnames/inline styles are kept exactly as in the original.
 */
export function DraggableEvent({ event }: { event: TCalendarEvent }) {
  // useEvents hook provides setSelectedEvent function
  const { selectedEvent, setSelectedEvent } = useEvents();

  const { viewBy } = useViewBy();

  // dnd-kit hook provides attributes/listeners to attach to the drag node
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  // Determine layout based on short duration. Memoized for stability.
  const oneLineTitle = useMemo(
    () => Boolean(event.duration && event.duration <= 30),
    [event.duration]
  );

  // Pre-format the start time once per relevant change.
  const formattedStart = useMemo(
    () => (event.start ? format(event.start, 'HH:mm') : ''),
    [event.start]
  );
  // Stable style objects to avoid creating new objects each render.
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      backgroundColor:
        selectedEvent?.id === event.id && !isDragging
          ? `var(--event-default-colour-${event.colour})`
          : `var(--event-default-colour-${event.colour}-30)`,
      color:
        selectedEvent?.id === event.id && !isDragging
          ? `white`
          : `var(--event-default-colour-${event.colour}-text)`,
      userSelect: 'none',
      height: event.duration ? `${event.duration}px` : 'auto',
    }),
    [event.colour, event.duration, selectedEvent?.id, isDragging, event.id]
  );

  const markerStyle = useMemo(
    () => ({
      height: event.duration ? `${event.duration}px` : 'auto',
      backgroundColor: `var(--event-default-colour-${event.colour}-marker)`,
    }),
    [event.colour, event.duration]
  );

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
        <div
          // attach the drag node ref and dnd attributes/listeners
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          // Keep original classnames (colours/borders unchanged)
          className={cx(
            'relative',
            'flex',
            'flex-col',
            'border-0',
            'rounded',
            'pl-2',
            'pr-1',
            oneLineTitle ? 'py-0' : 'py-1',
            'w-full',
            'justify-between',
            'items-start',
            'text-sm',
            'cursor-grab',
            'font-medium',
            'shadow-sm',
            'transition-opacity',
            isDragging ? 'bg-opacity-30' : 'bg-opacity-60',
            'outline-none'
          )}
          style={containerStyle}
          tabIndex={-1}
          role="button"
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
        >
          {/* Left coloured marker */}
          <div
            className="absolute top-0 left-0 w-1 rounded-tl rounded-bl border-0 text-xs"
            style={markerStyle}
            aria-hidden
          />

          {/* Content area: either single-row or stacked depending on duration */}
          <div
            className={cx(
              'flex',
              oneLineTitle ? 'flex-row gap-1' : 'flex-col',
              'items-start',
              'text-xs',
              'w-full',
              'h-full',
              'overflow-hidden'
            )}
          >
            {/* start time */}
            <span className="font-regular">{formattedStart}</span>

            {/* title; preserved truncation behaviour */}
            <span className="font-regular max-w-full truncate overflow-hidden whitespace-nowrap">
              {` ${event.title}`}
            </span>
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-80 border-[var(--left-border-colour)] bg-[var(--left-background)] p-0 shadow-none"
        side="right"
        align="start"
        sideOffset={0}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
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
