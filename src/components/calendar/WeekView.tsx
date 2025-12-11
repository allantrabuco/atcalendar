import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { addDays, format, isSameWeek, startOfWeek } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';

import AllDaySection from './AllDaySection';
import CurrentTimeLine from './CurrentTimeLine';
import Header from './Header';
import { useEvents, useNewEvent, usePanels, useSelectedDate, useViewBy } from './Provider';
import TimeLabel from './TimeLabel';
import WeekCell from './WeekCell';

import { CELL_HEIGHT, CELL_WIDTH, HOURS, SLOTS_PER_HOUR } from '@/lib/constants';
import snapToQuarterHour from '@/lib/snapToQuarterHour';

import useCalendarDrag, { type DragOverCellType } from '@/hooks/useCalendarDrag';
import useFetchEvents from '@/hooks/useFetchEvents';
import useScrollbarSize from '@/hooks/useScrollbarSize';
import { layoutEvents, type EventLayout } from '@/lib/layoutEvents';
import type { TCalendarEvent } from '@/types/Calendar';

const WeekView: React.FC = () => {
  useScrollbarSize();
  const { viewBy } = useViewBy();
  const { selectedDate } = useSelectedDate();
  const { events } = useEvents();
  const { showLeftPanel, showRightPanel } = usePanels();
  const { setIsInputToggled, setStartDateTime, setEndDateTime } = useNewEvent();

  useFetchEvents();

  const [activeEvent, setActiveEvent] = useState<TCalendarEvent | null>(null);
  const [activeEventElement, setActiveEventElement] = useState<HTMLElement | null>(null);
  const [dragOverCell, setDragOverCell] = useState<DragOverCellType | null>(null);
  const [columnSize, setColumnSize] = useState(CELL_WIDTH);

  const tableRef = useRef<HTMLTableElement>(null);

  const days = useMemo(() => {
    if (viewBy === 'day') {
      return [selectedDate ?? new Date()];
    } else if (viewBy === 'week') {
      const start = startOfWeek(selectedDate ?? new Date(), { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    } else {
      return [selectedDate ?? new Date()];
    }
  }, [selectedDate, viewBy]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

  const showCurrentTime = useMemo(() => {
    if (!selectedDate) return false;
    return isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 });
  }, [selectedDate]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollTopRef = useRef(0);

  const weekKey = useMemo(() => {
    const date = selectedDate ?? new Date();
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return format(start, 'yyyy-MM-dd');
  }, [selectedDate]);

  const weekLayouts = useMemo(() => {
    const layouts: Record<string, Record<string, EventLayout>> = {};

    days.forEach((dayDate) => {
      const dateKey = format(dayDate, 'yyyy-MM-dd');
      const dayEvents: TCalendarEvent[] = [];

      Object.keys(events).forEach((key) => {
        if (key.includes(dateKey) && !key.startsWith('all-day-')) {
          dayEvents.push(...events[key]);
        }
      });

      const uniqueEvents = Array.from(new Set(dayEvents));
      layouts[dateKey] = layoutEvents(uniqueEvents);
    });

    return layouts;
  }, [days, events]);

  const setScrollContainer = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        requestAnimationFrame(() => {
          if (isSameWeek(selectedDate ?? new Date(), new Date(), { weekStartsOn: 1 })) {
            const now = new Date();
            const top =
              now.getHours() * CELL_HEIGHT * SLOTS_PER_HOUR + now.getMinutes() * (CELL_HEIGHT / 15);
            const containerHeight = node.clientHeight;
            node.scrollTo({ top: top - containerHeight / 2, behavior: 'smooth' });
          } else {
            const row = document.getElementById(`week-view-row-${weekKey}-7-3`);
            if (row) {
              node.scrollTop = row.offsetTop;
            }
          }
        });
        scrollContainerRef.current = node;
      }
    },
    [weekKey, selectedDate]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (scrollContainerRef.current) {
        initialScrollTopRef.current = scrollContainerRef.current.scrollTop;
      }
      hookDragStart(event);
    },
    [hookDragStart]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapToQuarterHourModifier = (args: any) => {
    return snapToQuarterHour({
      transform: args.transform,
      columnSize,
      getScrollCorrection: () => {
        const current = scrollContainerRef.current?.scrollTop ?? 0;
        const initial = initialScrollTopRef.current;
        return { x: 0, y: current - initial };
      },
    });
  };

  // const tableRectModifier = restrictToTable(tableRef);

  const handleDoubleClick = (dayDate: Date, hour: number, slot: number) => {
    const start = new Date(dayDate);
    start.setHours(hour);
    start.setMinutes(slot * 15);
    start.setSeconds(0);
    start.setMilliseconds(0);

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
      <Header
        selectedDate={selectedDate}
        days={days.map((d) => d.toISOString())}
        columnSize={columnSize}
      />

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
        <div className="relative flex h-[calc(100dvh-var(--headers-height)-1rem)] flex-col pl-4">
          <AllDaySection days={days} events={events} />

          <AnimatePresence mode="wait">
            <motion.div
              ref={setScrollContainer}
              key={weekKey}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="scrollbar scrollbar-corner-custom scrollbar-thumb-custom-light scrollbar-track-custom scrollbar-hover:bg-(--scroll-thumb-hover-colour) relative flex min-h-0 w-full flex-1 flex-row items-start overflow-y-scroll border-r border-(--scroll-border-colour)"
              onScroll={() => window.dispatchEvent(new Event('calendar-scroll'))}
            >
              <TimeLabel />

              {showCurrentTime && <CurrentTimeLine />}

              <table
                ref={tableRef}
                className="w-full overflow-hidden border-0"
                style={{ tableLayout: 'fixed', width: '100%' }}
              >
                <tbody>
                  {Array.from({ length: HOURS * SLOTS_PER_HOUR }).map((_, timeIndex) => {
                    const hour = Math.floor(timeIndex / SLOTS_PER_HOUR);
                    const slot = timeIndex % SLOTS_PER_HOUR;
                    return (
                      <tr key={`${hour}-${slot}`} id={`week-view-row-${weekKey}-${hour}-${slot}`}>
                        {days.map((dayDate) => {
                          const fulldate = format(dayDate, 'yyyy-MM-dd');
                          const [yearStr, monthStr, dayStr] = fulldate.split('-');
                          const cellKey = `event-${fulldate}-${hour}-${slot}`;
                          const eventsInCell = events[cellKey] || [];
                          return (
                            <WeekCell
                              year={parseInt(yearStr)}
                              month={monthStr}
                              day={dayStr}
                              hour={hour}
                              slot={slot}
                              events={eventsInCell}
                              scheduledEvents={events}
                              key={cellKey}
                              columnSize={columnSize}
                              layout={weekLayouts[fulldate]}
                              onDoubleClick={() => handleDoubleClick(dayDate, hour, slot)}
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

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
                          width: `${activeEventElement ? activeEventElement.offsetWidth * parseInt(activeEventElement.dataset.eventsPerHour ?? '1') : 0}px`,
                          left: `${activeEventElement && activeEventElement.offsetLeft !== 2 ? activeEventElement.offsetLeft * -1 + 2 : 2}px`,
                        }}
                      >
                        <span className="px-1">
                          {String(dragOverCell.day).padStart(2, '0')}@
                          {String(dragOverCell.hour).padStart(2, '0')}:
                          {String(dragOverCell.slot * 15).padStart(2, '0')} - {activeEvent.title}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </DragOverlay>
            </motion.div>
          </AnimatePresence>
        </div>
      </DndContext>
    </div>
  );
};

export default React.memo(WeekView);
