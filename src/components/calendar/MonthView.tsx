import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  DndContext,
  DragOverlay,
  type Modifier,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { addDays, endOfMonth, format, isToday, startOfMonth, subDays } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';

import Header from './Header';

import ExpandedCellOverlay from './ExpandedCellOverlay';
import MonthCell from './MonthCell';
import { useEvents, useMonth, usePanels, useSelectedDate, useViewBy } from './Provider';
import { restrictToTable } from './restrictToTable';

import { CELL_HEIGHT, CELL_WIDTH, EVENT_ROW_HEIGHT } from '@/lib/constants';
import snapToQuarterHour from '@/lib/snapToQuarterHour';

import useCalendarDrag, { type DragOverCellType } from '@/hooks/useCalendarDrag';
import useFetchEvents from '@/hooks/useFetchEvents';
import type { TCalendarEvent } from '@/types/Calendar';

// Helper: build a month grid (strings in 'yyyy-MM-dd') with Monday as first column.
const getMonthDaysGrid = (date: Date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const daysInMonth: string[] = [];

  // Monday as first column (JS Sunday=0 -> Monday index 0..6)
  let startDayOfWeek = start.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Pad start with previous month's days if needed
  for (let i = startDayOfWeek; i > 0; i--) {
    const prevDate = subDays(start, i);
    daysInMonth.push(format(prevDate, 'yyyy-MM-dd'));
  }

  // Add current month days
  let current = start;
  while (current <= end) {
    daysInMonth.push(format(current, 'yyyy-MM-dd'));
    current = addDays(current, 1);
  }

  // Pad end with next month's days until full weeks
  let nextDate = addDays(end, 1);
  while (daysInMonth.length % 7 !== 0) {
    daysInMonth.push(format(nextDate, 'yyyy-MM-dd'));
    nextDate = addDays(nextDate, 1);
  }

  // Ensure 5 or 6 full weeks (35 or 42 days shown)
  while (daysInMonth.length < 35) {
    daysInMonth.push(format(nextDate, 'yyyy-MM-dd'));
    nextDate = addDays(nextDate, 1);
  }
  if (daysInMonth.length > 35) {
    while (daysInMonth.length < 42) {
      daysInMonth.push(format(nextDate, 'yyyy-MM-dd'));
      nextDate = addDays(nextDate, 1);
    }
  }

  return daysInMonth;
};

const MonthView: React.FC = () => {
  const { viewBy } = useViewBy();
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const { month } = useMonth();
  const { events } = useEvents();
  const { showLeftPanel } = usePanels();
  useFetchEvents();

  const [activeEvent, setActiveEvent] = useState<TCalendarEvent | null>(null);

  const [, setActiveEventElement] = useState<HTMLElement | null>(null);

  const [dragOverCell, setDragOverCell] = useState<DragOverCellType | null>(null);

  const [expandedCell, setExpandedCell] = useState<{
    events: TCalendarEvent[];
    date: Date;
    position: { top?: number; bottom?: number; left: number; width: number; height: number };
  } | null>(null);

  const handleExpand = useCallback((events: TCalendarEvent[], date: Date, rect: DOMRect) => {
    const container = document.getElementById('month-view-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();

      const isBottom = rect.bottom > containerRect.bottom - 200;

      if (isBottom) {
        setExpandedCell({
          events,
          date,
          position: {
            bottom: containerRect.bottom - rect.bottom, // Position from bottom of container
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height,
          },
        });
      } else {
        setExpandedCell({
          events,
          date,
          position: {
            top: rect.top - containerRect.top,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height,
          },
        });
      }
    }
  }, []);

  const handleCloseExpand = useCallback(() => {
    setExpandedCell(null);
  }, []);

  const [days, setDays] = useState<string[]>(getMonthDaysGrid(month ?? new Date()));

  const [columnSize, setColumnSize] = useState(CELL_WIDTH);

  const columnSizeRef = useRef(columnSize);
  useEffect(() => {
    columnSizeRef.current = columnSize;
  }, [columnSize]);

  const [maxVisibleEvents, setMaxVisibleEvents] = useState(
    Math.floor(CELL_HEIGHT / EVENT_ROW_HEIGHT)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const lastDragRef = useRef<{ key: string; ts: number } | null>(null);
  const isHandlingDrop = useRef(false);

  const { handleDragOver, handleDragStart, handleMonthDragEnd } = useCalendarDrag({
    activeEvent,
    setActiveEvent,
    setActiveEventElement,
    setColumnSize,
    setMaxVisibleEvents,
    setDragOverCell,
    lastDragRef,
    isHandlingDrop,
  });

  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    setDays(getMonthDaysGrid(month ?? new Date()));
  }, [month, viewBy]);

  useLayoutEffect(() => {
    let resizeTimeout: number | undefined;

    const updateSizes = () => {
      window.requestAnimationFrame(() => {
        const tableEl = tableRef.current;
        if (!tableEl) return;

        const firstRow = tableEl.querySelector('tr');
        const firstCell = firstRow?.querySelector('td') as HTMLElement | null;
        if (firstCell) {
          setMaxVisibleEvents(
            Math.max(0, Math.floor(firstCell.offsetHeight / EVENT_ROW_HEIGHT) - 1)
          );
        }
      });
    };

    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(updateSizes, 100); // Debounce by 100ms
    };

    updateSizes();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  const snapToQuarterHourModifier = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (args: any) =>
      snapToQuarterHour({
        transform: args.transform,
        columnSize: columnSizeRef.current,
      }),
    []
  ) as unknown as Modifier;

  // eslint-disable-next-line react-hooks/refs
  const tableRectModifier = restrictToTable(tableRef);

  const sensorsList = sensors;

  // Render
  return (
    <div
      className={`${showLeftPanel ? 'w-[calc(100vw-var(--left-width))]' : 'w-full'} flex flex-col border-0 border-green-300`}
    >
      <Header selectedDate={selectedDate} days={days.slice(0, 7)} columnSize={columnSize} />

      <DndContext
        sensors={sensorsList}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleMonthDragEnd}
        onDragOver={handleDragOver}
        // eslint-disable-next-line react-hooks/refs
        modifiers={[snapToQuarterHourModifier, restrictToWindowEdges, tableRectModifier].filter(
          (mod): mod is Modifier => !!mod
        )}
      >
        <div className="relative flex h-full flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate ? format(selectedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-full w-full flex-row items-start border-r border-(--scroll-border-colour)"
              id="month-view-container"
            >
              <table
                ref={tableRef}
                className="h-full w-full overflow-auto"
                onScroll={handleCloseExpand}
              >
                <tbody>
                  {Array.from({ length: days.length / 7 }).map((_, weekIdx) => (
                    <tr key={weekIdx}>
                      {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((fulldate, dayIdx) => {
                        const cellDate = new Date(fulldate);
                        if (!fulldate) {
                          return <td key={dayIdx} style={{ width: columnSize }} />;
                        }
                        const [yearStr, monthStr, dayStr] = fulldate.split('-');
                        const cellKey = `event-${fulldate}-0-0`;

                        const eventsInCell = Object.keys(events)
                          .filter(
                            (key) =>
                              key.startsWith(`event-${fulldate}`) ||
                              key.startsWith(`all-day-${fulldate}`)
                          )
                          .flatMap((key) => events[key] ?? [])
                          .sort((a, b) => {
                            if (a.allDay && !b.allDay) return -1;
                            if (!a.allDay && b.allDay) return 1;
                            return a.start && b.start ? a.start.getTime() - b.start.getTime() : 0;
                          });

                        return (
                          <MonthCell
                            year={parseInt(yearStr, 10)}
                            month={monthStr}
                            day={dayStr}
                            hour={0}
                            slot={0}
                            events={eventsInCell}
                            scheduledEvents={events}
                            key={cellKey}
                            onClick={() => {
                              setSelectedDate?.(
                                new Date(
                                  parseInt(yearStr, 10),
                                  parseInt(monthStr, 10) - 1,
                                  parseInt(dayStr, 10)
                                )
                              );
                            }}
                            columnSize={columnSize}
                            maxVisibleEvents={maxVisibleEvents}
                            isExpanded={
                              expandedCell
                                ? isToday(cellDate)
                                  ? isToday(expandedCell.date)
                                  : format(cellDate, 'yyyy-MM-dd') ===
                                    format(expandedCell.date, 'yyyy-MM-dd')
                                : false
                            }
                            onExpand={(rect) => handleExpand(eventsInCell, cellDate, rect)}
                          >
                            <div
                              className={`absolute top-1 right-1 mr-2 rounded-full text-sm font-medium ${isToday(cellDate) ? 'bg-(--colour-4) px-2' : ''}`}
                            >
                              <span
                                className={`font-medium ${isToday(cellDate) ? 'text-white' : 'text-foreground'} pl-[3px]`}
                              >
                                {fulldate === format(new Date(), 'yyyy-MM-dd') ||
                                parseInt(dayStr, 10) === 1
                                  ? format(cellDate, 'd MMM')
                                  : parseInt(dayStr, 10)}
                              </span>
                            </div>
                          </MonthCell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {expandedCell && (
                <ExpandedCellOverlay
                  events={expandedCell.events}
                  date={expandedCell.date}
                  position={expandedCell.position}
                  onClose={handleCloseExpand}
                />
              )}

              <DragOverlay modifiers={[snapToQuarterHourModifier]}>
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
                          width: `${columnSize}px`,
                        }}
                      >
                        <span className="px-1">
                          {String(dragOverCell.day).padStart(2, '0')}/
                          {String(dragOverCell.month).padStart(2, '0')}/{dragOverCell.year} @{' '}
                          {format(activeEvent.start, 'HH:mm')} - {activeEvent.title} -{' '}
                          {activeEvent.title}
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

export default React.memo(MonthView);
