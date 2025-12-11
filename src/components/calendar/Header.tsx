import React, { useEffect, useRef, useState } from 'react';

import { format, isToday, startOfWeek } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';

import { useSelectedDate, useViewBy } from './Provider';

import { cn } from '@/lib/utils';

import useScrollbarSize from '@/hooks/useScrollbarSize';

interface CalendarHeaderProps {
  selectedDate?: Date;
  days?: string[];
  columnSize?: number;
}
const CELL_WIDTH = 120;

// const Header: React.FC<CalendarHeaderProps> = React.memo(({ selected, days }) => {
const Header: React.FC<CalendarHeaderProps> = ({ selectedDate, days, columnSize }) => {
  useScrollbarSize();
  const { viewBy } = useViewBy();
  const { setSelectedDate } = useSelectedDate();
  const weekday = selectedDate ?? new Date();
  const dayHeaderRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isVeryNarrow, setIsVeryNarrow] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (dayHeaderRef.current) {
        const width = dayHeaderRef.current.offsetWidth;
        setIsNarrow(width < 378);
        setIsVeryNarrow(width < 284);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderDayHeader = () => (
    <div
      ref={dayHeaderRef}
      className="border-[var(--calendar-hour-line) mt-5.5 ml-18 flex w-full justify-start gap-1.5 border-b pb-2"
    >
      <span
        className={cn(
          'text-3xl font-extralight',
          isToday(weekday) ? 'text-(--colour-4)' : 'inherit'
        )}
      >
        {format(weekday, isVeryNarrow ? 'EE' : 'EEEE')}
      </span>
      <span className="text-foreground text-3xl font-medium">
        {format(weekday, isNarrow ? 'd MMM' : 'd MMMM')}
      </span>
      <span className="text-primary text-3xl font-extralight">{format(weekday, 'yyyy')}</span>
    </div>
  );

  const renderWeekHeader = () => (
    <div className="mt-2 flex w-full flex-row pl-[calc(var(--calendar-hour-width)-3.55rem)]">
      {/* Spacer for TimeLabel */}
      <div className="w-(--calendar-hour-width) shrink-0" />

      {/* Header Content */}
      <div className="flex-1">
        <table className="h-14 w-full table-fixed overflow-hidden border-0">
          <tbody>
            <tr>
              {days?.map((fulldate, di) => {
                const dateObj = new Date(fulldate);
                const isTodayDate = isToday(dateObj);
                return (
                  <th
                    key={di}
                    className="border-[var(--calendar-hour-line) cursor-pointer border-r border-b text-left text-[0.65rem] text-(--button-group-text-default-colour)"
                    onClick={() => {
                      setSelectedDate?.(dateObj);
                    }}
                  >
                    <div className="absolute top-0.5 flex flex-col pl-1">
                      <span
                        className={`font-normal ${isTodayDate ? 'text-primary pl-[7px]' : 'pl-1'}`}
                      >
                        {format(dateObj, 'EEE').toUpperCase()}
                      </span>
                      <div
                        className={`w-[1.85rem] rounded-full ${isTodayDate ? 'ml-1 bg-(--colour-4)' : ''} text-center`}
                      >
                        <span
                          className={`text-xl font-medium ${isTodayDate ? 'text-white' : 'text--foreground'}`}
                        >
                          {format(dateObj, 'd')}
                        </span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scrollbar Spacer */}
      <div className="w-[var(--scrollbar-size,1rem)] shrink-0" />
    </div>
  );

  const renderMonthHeader = () => (
    <div className="relative mt-6 flex h-12 w-full flex-col border-0 border-green-300">
      <table className="h-full w-full overflow-hidden">
        <tbody>
          <tr>
            {days?.map((fulldate, di) => {
              const dateObj = new Date(fulldate);
              return (
                <th
                  key={di}
                  className="border-[var(--calendar-hour-line) border-r-0 border-b"
                  style={{ width: columnSize ? `${columnSize}px` : CELL_WIDTH }}
                >
                  <div className="mb-4 flex h-full w-full flex-col items-end justify-end pl-1">
                    <span className="text-foreground mr-2 w-full text-right text-sm font-medium">
                      {format(dateObj, 'EEE').toUpperCase()}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );

  // const renderCount = useRef(0);
  // renderCount.current++;

  // run animation
  // run animation
  const runAnimation = () => {
    if (viewBy === 'month') {
      return selectedDate ? format(selectedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
    } else if (viewBy === 'week') {
      const date = selectedDate ?? new Date();
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return format(start, 'yyyy-MM-dd');
    } else {
      return selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'default';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={runAnimation()}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        // className="relative flex flex-row h-full w-full items-start border-r-1 border-[var(--scroll-border-colour)]"
        className="relative flex w-full flex-row items-start border-r-0 border-(--scroll-border-colour)"
      >
        {viewBy === 'day' && renderDayHeader()}
        {viewBy === 'week' && renderWeekHeader()}
        {viewBy === 'month' && renderMonthHeader()}
      </motion.div>
    </AnimatePresence>
  );
};

export default Header;
