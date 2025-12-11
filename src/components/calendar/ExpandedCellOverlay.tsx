import type { TCalendarEvent } from '@/types/Calendar';
import { format, isToday } from 'date-fns';
import React, { useEffect, useRef } from 'react';
import { DraggableMonthEvent } from './DraggableMonthEvent';
import { useSelectedDate } from './Provider';

interface ExpandedCellOverlayProps {
  events: TCalendarEvent[];
  date: Date;
  position: { top?: number; bottom?: number; left: number; width: number; height: number } | null;
  onClose: () => void;
}

const ExpandedCellOverlay: React.FC<ExpandedCellOverlayProps> = ({
  events,
  date,
  position,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { setSelectedDate } = useSelectedDate();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!position) return null;

  const isTodayDate = isToday(date);

  // absolute flex flex-col justify-start px-2 pt-6 left-0 w-full transition-all duration-200 ease-in-out z-0 h-full overflow-hidden top-0

  return (
    <div
      ref={overlayRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          setSelectedDate?.(date);
        }
      }}
      className={`absolute z-50 flex flex-col justify-start border border-(--calendar-hour-line) px-2 pt-6 pb-2 transition-all duration-200 ease-in-out ${isTodayDate ? 'bg-(--colour-5)' : 'bg-(--grey-5)'} `}
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        minHeight: position.height,
        maxHeight: '300px', // Limit height to prevent page scrolling
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedDate?.(date);
      }}
    >
      {/* Date Header (matches MonthCell look) */}
      <div
        className={`absolute top-1 right-1 mr-2 rounded-full text-sm font-medium ${isTodayDate ? 'bg-(--colour-4) px-2' : ''}`}
      >
        <span className={`font-medium ${isTodayDate ? 'text-white' : 'text-foreground'} pl-[3px]`}>
          {format(date, 'd')}
        </span>
      </div>

      {/* Scrollable Events List */}
      <div className="scrollbar scrollbar-corner-custom scrollbar-thumb-custom-light scrollbar-track-custom scrollbar-hover:bg-(--scroll-thumb-hover-colour) flex w-full flex-col overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="relative w-full" data-id={event.id}>
            <DraggableMonthEvent event={event} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpandedCellOverlay;
