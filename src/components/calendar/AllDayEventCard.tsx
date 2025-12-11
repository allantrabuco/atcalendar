import React, { useMemo } from 'react';

import type { TCalendarEvent } from '@/types/Calendar';

interface AllDayEventCardProps extends React.HTMLAttributes<HTMLDivElement> {
  event: TCalendarEvent;
  isSelected?: boolean;
  isDragging?: boolean;
}

// Small className helper to keep JSX cleaner.
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const AllDayEventCard = React.forwardRef<HTMLDivElement, AllDayEventCardProps>(
  ({ event, isSelected, isDragging, className, style, ...props }, ref) => {
    const containerStyle = useMemo<React.CSSProperties>(
      () => ({
        backgroundColor:
          isSelected && !isDragging
            ? `var(--event-default-colour-${event.colour})`
            : `var(--event-default-colour-${event.colour}-30)`,
        color:
          isSelected && !isDragging ? `white` : `var(--event-default-colour-${event.colour}-text)`,
        userSelect: 'none',
        ...style,
      }),
      [event.colour, isSelected, isDragging, style]
    );

    const markerStyle = useMemo(
      () => ({
        backgroundColor: `var(--event-default-colour-${event.colour}-marker)`,
      }),
      [event.colour]
    );

    return (
      <div
        ref={ref}
        className={cx(
          'relative',
          'flex',
          'flex-col',
          'border-0',
          'rounded',
          'pl-2',
          'pr-1',
          'py-0',
          'w-full',
          'justify-between',
          'items-start',
          'text-sm',
          'cursor-grab',
          'font-medium',
          'shadow-sm',
          'transition-opacity',
          isDragging ? 'bg-opacity-30' : 'bg-opacity-60',
          'outline-none',
          className
        )}
        style={containerStyle}
        tabIndex={-1}
        role="button"
        {...props}
      >
        {/* Left coloured marker */}
        <div
          className="absolute top-0 left-0 h-full w-1 rounded-tl rounded-bl text-xs"
          style={markerStyle}
          aria-hidden
        />

        {/* Content area: either single-row or stacked depending on duration */}
        <div
          className={cx(
            'flex',
            'flex-row gap-1',
            'items-start',
            'text-xs',
            'w-full',
            'h-full',
            'overflow-hidden'
          )}
        >
          {/* title; preserved truncation behaviour */}
          <span className="font-regular max-w-full truncate overflow-hidden whitespace-nowrap">
            {` ${event.title}`}
          </span>
        </div>
      </div>
    );
  }
);

AllDayEventCard.displayName = 'AllDayEventCard';
