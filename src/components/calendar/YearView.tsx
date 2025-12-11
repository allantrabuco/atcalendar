import React, { useMemo } from 'react';

import {
  addDays,
  eachDayOfInterval,
  format,
  getDay,
  getMonth,
  getYear,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';

import useFetchEvents from '@/hooks/useFetchEvents';
import type { TCalendarEvent } from '@/types/Calendar';
import { useTheme } from '../ThemeProvider';
import { useEvents, useSelectedDate, useViewBy } from './Provider';
import YearDayCell from './YearDayCell';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Use full Date in cells and a boolean flag for inMonth
type Cell = { date: Date; inMonth: boolean };

function generateMonthMatrix(year: number, monthIndex: number): Cell[][] {
  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  // weekStartsOn: 1 -> Monday-first
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // always show 6 weeks (6 * 7 = 42 days)
  const days = eachDayOfInterval({
    start: rangeStart,
    end: addDays(rangeStart, 42 - 1),
  });

  const weeks: Cell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7).map((d) => ({
      date: d,
      inMonth: isSameMonth(d, monthStart),
    }));
    weeks.push(week);
  }
  return weeks;
}

export const YearView: React.FC = () => {
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const { setViewBy } = useViewBy();
  const { events } = useEvents();
  const { theme } = useTheme();

  useFetchEvents();

  const year = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);
  const currentYear = selectedDate ? format(selectedDate, 'yyyy') : year;

  // build a map of yyyy-MM-dd => array of events for that day (based on event.start)
  const eventsMap = useMemo(() => {
    const m = new Map<string, TCalendarEvent[]>();

    // normalize and flatten events into a flat array of event objects
    const iterableEvents: TCalendarEvent[] = (() => {
      if (!events) return [];
      if (Array.isArray(events)) return events;
      if (events instanceof Map) return Array.from(events.values()).flat();
      if (events instanceof Set) return Array.from(events).flat();
      if (typeof events === 'object') return Object.values(events).flat();
      return [];
    })();

    iterableEvents.forEach((ev: TCalendarEvent) => {
      if (!ev) return;
      const dt = ev?.start;
      if (!dt) return;
      const d = new Date(dt);
      if (Number.isNaN(d.getTime())) return;
      const key = format(d, 'yyyy-MM-dd');
      const arr = m.get(key) ?? [];
      arr.push(ev);
      m.set(key, arr);
    });

    return m;
  }, [events]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate?.(date);
    setViewBy('day');
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedDate ? selectedDate.getFullYear() : 'default'}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full w-full overflow-hidden"
      >
        <div className="mt-5.5 ml-5 flex w-full justify-start gap-1.5 border-b border-[var(--calendar-hour-line)] pb-2">
          <span className="text-primary text-3xl font-extralight">{currentYear}</span>
        </div>
        <div className="grid h-[calc(100dvh-var(--headers-height))] min-h-0 auto-rows-fr grid-cols-4 gap-2 p-5 pb-10 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10">
          {months.map((monthIndex) => {
            const weeks = generateMonthMatrix(year, monthIndex);
            return (
              <div
                key={monthIndex}
                className="flex h-full min-w-0 flex-col bg-[var(--header-background)] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-foreground font-light">{MONTH_NAMES[monthIndex]}</div>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  <table className="h-full w-full table-fixed text-xs">
                    <thead>
                      <tr>
                        {(() => {
                          const now = new Date();
                          const todayIndex = (getDay(now) + 6) % 7; // Monday=0..Sunday=6
                          const isThisMonth =
                            getYear(now) === getYear(selectedDate ?? year) &&
                            getMonth(now) === monthIndex;
                          return WEEK_DAYS.map((d, idx) => {
                            const isTodayHeader = isThisMonth && idx === todayIndex;
                            return (
                              <th
                                key={d}
                                className={`py-0.5 text-center text-[0.65rem] font-medium text-(--button-group-text-default-colour) ${isTodayHeader ? 'text-(--colour-4)' : ''}`}
                              >
                                <span
                                  className={`pl-1 font-normal ${isTodayHeader ? 'font-semibold' : ''}`}
                                >
                                  {d.toUpperCase()}
                                </span>
                              </th>
                            );
                          });
                        })()}
                      </tr>
                    </thead>

                    <tbody className="align-top">
                      {weeks.map((week, wi) => (
                        <tr key={wi}>
                          {week.map((cell, di) => {
                            const cellDate = cell.date;
                            const inMonth = cell.inMonth;
                            const isSelectedDay =
                              format(cellDate, 'yyyy-MM-dd') ===
                              format(selectedDate || new Date(), 'yyyy-MM-dd');

                            const dayKey = format(cellDate, 'yyyy-MM-dd');
                            const dayEvents = eventsMap.get(dayKey) ?? [];

                            return (
                              <YearDayCell
                                key={di}
                                date={cellDate}
                                inMonth={inMonth}
                                isSelected={isSelectedDay}
                                events={dayEvents}
                                theme={theme}
                                onSelectDate={handleSelectDate}
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default YearView;
