import { useDndContext, useDroppable } from '@dnd-kit/core';
import { format, startOfWeek } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import React, { useMemo } from 'react';

import type { TCalendarEvent } from '@/types/Calendar';
import { AllDayEventCard } from './AllDayEventCard';
import { DraggableAllDayEvent } from './DraggableAllDayEvent';
import { useViewBy } from './Provider';

interface AllDaySectionProps {
  days: Date[];
  events: Record<string, TCalendarEvent[]>;
}

const DroppableDayColumn = ({ dateKey, events }: { dateKey: string; events: TCalendarEvent[] }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `all-day-${dateKey}`,
  });

  const { active } = useDndContext();
  const draggedEvent = active?.data.current?.event as TCalendarEvent | undefined;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-0 flex-1 flex-col transition-colors ${isOver ? 'bg-gray-100/10' : ''}`}
    >
      <AllDayEventList events={events} ghostEvent={isOver ? draggedEvent : undefined} />
    </div>
  );
};

const AllDayEventList = ({
  events,
  ghostEvent,
  className,
}: {
  events: TCalendarEvent[];
  ghostEvent?: TCalendarEvent;
  className?: string;
}) => (
  <div className={`flex w-full flex-col gap-0.5 py-0.5 align-top ${className || ''}`}>
    {events.map((event) => (
      <DraggableAllDayEvent key={event.id} event={event} />
    ))}
    {ghostEvent && (
      <AllDayEventCard event={ghostEvent} isDragging={true} style={{ opacity: 0.5 }} />
    )}
    {events.length === 0 && !ghostEvent && <div className="h-6" />}
  </div>
);

const AllDaySection: React.FC<AllDaySectionProps> = (props) => {
  const { days, events } = props;
  const { viewBy } = useViewBy();

  // Use the first day for the animation key in day view, or the week start in week view
  const animationKey = useMemo(() => {
    if (days.length === 0) return 'default';
    const firstDay = days[0];
    if (viewBy === 'week') {
      const start = startOfWeek(firstDay, { weekStartsOn: 1 });
      return format(start, 'yyyy-MM-dd');
    }
    return format(firstDay, 'yyyy-MM-dd');
  }, [days, viewBy]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="scrollbar scrollbar-corner-custom scrollbar-thumb-custom-light scrollbar-track-custom scrollbar-hover:bg-[--scroll-thumb-hover-colour] relative flex w-full flex-row items-start overflow-y-scroll border-r border-[--scroll-border-colour] outline-none"
      >
        {/* Label Column */}
        <div className="flex w-[calc(var(--calendar-hour-width)-0.44rem)] shrink-0 flex-col pr-3">
          <div className="relative flex items-center justify-end py-1">
            <span className="px-1 text-right text-xs font-extralight text-(--calendar-time-colour)">
              all-day
            </span>
          </div>
        </div>

        {/* Events Columns */}
        {viewBy === 'day' ? (
          <div className="flex flex-1 flex-row border-b-2 border-(--scroll-border-colour) pl-0.5">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events[`all-day-${dateKey}`] || [];

              return <DroppableDayColumn key={dateKey} dateKey={dateKey} events={dayEvents} />;
            })}
          </div>
        ) : (
          <div className="flex w-full flex-row pl-[calc(var(--calendar-hour-width)-4.10rem)]">
            <table className="w-full table-fixed overflow-hidden border-0">
              <tbody>
                <tr>
                  {days.map((day, di) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = events[`all-day-${dateKey}`] || [];
                    return (
                      <th
                        key={di}
                        className="border-[var(--calendar-hour-line) cursor-pointer border-r border-b px-0.5 align-top"
                      >
                        <DroppableDayColumn key={dateKey} dateKey={dateKey} events={dayEvents} />
                      </th>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Scrollbar Spacer */}
        {viewBy === 'day' && (
          <div className="h-full w-[var(--scrollbar-size,1rem)] shrink-0 border-r border-b-2 border-[--scroll-border-colour]" />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AllDaySection;
