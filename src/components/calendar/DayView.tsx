import { memo, useCallback, useMemo, useRef, useState } from 'react';

import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { format, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';

import useCalendarDrag, { type DragOverCellType } from '@/hooks/useCalendarDrag';
import useFetchEvents from '@/hooks/useFetchEvents';
import useScrollbarSize from '@/hooks/useScrollbarSize';
import { CELL_HEIGHT, CELL_WIDTH, HOURS, SLOTS_PER_HOUR } from '@/lib/constants';
import { layoutEvents } from '@/lib/layoutEvents';
import snapToQuarterHour from '@/lib/snapToQuarterHour';
import type { TCalendarEvent } from '@/types/Calendar';
import AllDaySection from './AllDaySection';
import CurrentTimeLine from './CurrentTimeLine';
import DayCell from './DayCell';
import Header from './Header';
import { useEvents, useNewEvent, usePanels, useSelectedDate, useViewBy } from './Provider';
import TimeLabel from './TimeLabel';

const getWeekDays = (date: Date) => {
  return [format(date, 'yyyy-MM-dd')];
};

const DayView: React.FC = () => {
  useScrollbarSize();

  const { viewBy } = useViewBy();
  const { events } = useEvents();
  const { selectedDate } = useSelectedDate();
  const { showLeftPanel, showRightPanel } = usePanels();
  const { setIsInputToggled, setStartDateTime, setEndDateTime } = useNewEvent();

  const [activeEvent, setActiveEvent] = useState<TCalendarEvent | null>(null);
  const [activeEventElement, setActiveEventElement] = useState<HTMLElement | null>(null);
  const [dragOverCell, setDragOverCell] = useState<DragOverCellType | null>(null);

  const [columnSize, setColumnSize] = useState(CELL_WIDTH);

  const tableRef = useRef<HTMLTableElement | null>(null);

  useFetchEvents();

  const days = useMemo(() => getWeekDays(selectedDate ?? new Date()), [selectedDate]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollTopRef = useRef(0);

  const {
    handleDragStart: hookDragStart,
    handleDragEnd,
    handleDragOver,
  } = useCalendarDrag({
    activeEvent,
    setActiveEvent,
    setActiveEventElement,
    setColumnSize,
    setDragOverCell,
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (scrollContainerRef.current) {
        initialScrollTopRef.current = scrollContainerRef.current.scrollTop;
      }
      hookDragStart(event);
    },
    [hookDragStart]
  );

  const showCurrentTime = useMemo(() => {
    if (!selectedDate) return false;
    return isToday(selectedDate ?? new Date());
  }, [selectedDate]);

  // const tableRectModifier = restrictToTable(tableRef);

  const snapToQuarterHourModifier = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (args: any) =>
      snapToQuarterHour({
        transform: args.transform,
        columnSize,
        getScrollCorrection: () => {
          const current = scrollContainerRef.current?.scrollTop ?? 0;
          const initial = initialScrollTopRef.current;
          return { x: 0, y: current - initial };
        },
      }),
    [columnSize]
  );

  const timeSlots = useMemo(() => {
    return Array.from({ length: HOURS * SLOTS_PER_HOUR }).map((_, timeIndex) => {
      const hour = Math.floor(timeIndex / SLOTS_PER_HOUR);
      const slot = timeIndex % SLOTS_PER_HOUR;
      return { hour, slot, key: `${hour}-${slot}` };
    });
  }, []);

  const dayLayout = useMemo(() => {
    if (!selectedDate) return {};
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    const dayEvents: TCalendarEvent[] = [];
    Object.keys(events).forEach((key) => {
      if (key.includes(dateKey) && !key.startsWith('all-day-')) {
        dayEvents.push(...events[key]);
      }
    });

    const uniqueEvents = Array.from(new Set(dayEvents));

    return layoutEvents(uniqueEvents);
  }, [events, selectedDate]);

  const setScrollContainer = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && selectedDate) {
        requestAnimationFrame(() => {
          if (isToday(selectedDate)) {
            const now = new Date();
            const top =
              now.getHours() * CELL_HEIGHT * SLOTS_PER_HOUR + now.getMinutes() * (CELL_HEIGHT / 15);
            const containerHeight = node.clientHeight;
            node.scrollTo({ top: top - containerHeight / 2, behavior: 'smooth' });
          } else {
            const dateKey = format(selectedDate, 'yyyy-MM-dd');
            const row = document.getElementById(`day-view-row-${dateKey}-7-3`);
            if (row) {
              node.scrollTop = row.offsetTop;
            }
          }
        });
        scrollContainerRef.current = node;
      }
    },
    [selectedDate]
  );

  const handleDoubleClick = (hour: number, slot: number) => {
    if (!selectedDate) return;

    // Calculate start time
    const start = new Date(selectedDate);
    start.setHours(hour);
    start.setMinutes(slot * 15);
    start.setSeconds(0);
    start.setMilliseconds(0);

    // Calculate end time (1 hour later)
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setIsInputToggled(true);
    setStartDateTime(start);
    setEndDateTime(end);
  };

  return (
    <div
      className={`${
        viewBy === 'day'
          ? showLeftPanel && showRightPanel
            ? 'flex w-[calc(100vw-var(--left-width)-var(--right-width))] flex-col'
            : showRightPanel
              ? 'w-[calc(100vw-var(--right-width))]'
              : 'w-full'
          : showLeftPanel
            ? 'w-[calc(100vw-var(--left-width))]'
            : 'w-full'
      } flex flex-col`}
    >
      <Header selectedDate={selectedDate} days={days} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        modifiers={[
          snapToQuarterHourModifier,
          ...(viewBy === 'day' ? [restrictToVerticalAxis] : []),
          // tableRectModifier,
        ]}
      >
        <div className="relative flex h-[calc(100dvh-var(--headers-height)-1rem)] flex-col pl-2">
          <AllDaySection days={selectedDate ? [selectedDate] : []} events={events} />

          <AnimatePresence mode="wait">
            <motion.div
              ref={setScrollContainer}
              key={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'default'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="scrollbar scrollbar-corner-custom scrollbar-thumb-custom-light scrollbar-track-custom scrollbar-hover:bg-[--scroll-thumb-hover-colour] relative flex min-h-0 w-full flex-1 flex-row items-start overflow-y-scroll border-r border-[--scroll-border-colour] outline-none"
              tabIndex={-1}
            >
              <TimeLabel />

              {showCurrentTime && <CurrentTimeLine />}

              <table
                ref={tableRef}
                className="w-full overflow-hidden border-0"
                style={{ tableLayout: 'fixed', width: '100%' }}
              >
                <tbody>
                  {timeSlots.map(({ hour, slot, key: rowKey }) => (
                    <tr
                      key={rowKey}
                      id={`day-view-row-${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'default'}-${hour}-${slot}`}
                    >
                      {days.map((fulldate) => {
                        const [yearStr, monthStr, dayStr] = fulldate.split('-');
                        const cellKey = `event-${fulldate}-${hour}-${slot}`;
                        const eventsInCell = events[cellKey] || [];
                        return (
                          <DayCell
                            year={parseInt(yearStr)}
                            month={monthStr}
                            day={dayStr}
                            hour={hour}
                            slot={slot}
                            events={eventsInCell}
                            scheduledEvents={events}
                            key={cellKey}
                            columnSize={columnSize}
                            layout={dayLayout}
                            onDoubleClick={() => handleDoubleClick(hour, slot)}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>

          <DragOverlay>
            {activeEvent ? (
              <div
                className="pointer-events-none relative min-w-[120px] rounded text-left text-base font-semibold opacity-95"
                style={{
                  background: `var(--event-default-colour-${activeEvent.colour}-70)`,
                  color: '#222',
                }}
              >
                {dragOverCell ? (
                  <div
                    className="pointer-events-none absolute w-full min-w-[120px] rounded text-left text-xs font-semibold opacity-95"
                    style={{
                      backgroundColor: `var(--event-default-colour-${activeEvent.colour})`,
                      color: `white`,
                      height: activeEvent.duration ? `${activeEvent.duration}px` : 'auto',
                      width: `${
                        activeEventElement
                          ? activeEventElement.offsetWidth *
                            parseInt(activeEventElement.dataset.eventsPerHour ?? '1')
                          : 0
                      }px`,
                      left: `${
                        activeEventElement && activeEventElement.offsetLeft !== 2
                          ? activeEventElement.offsetLeft * -1 + 2
                          : 2
                      }px`,
                    }}
                  >
                    <span className="px-1">
                      {String(dragOverCell.hour).padStart(2, '0')}:
                      {String(dragOverCell.slot * 15).padStart(2, '0')} - {activeEvent.title}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  );
};

export default memo(DayView);
