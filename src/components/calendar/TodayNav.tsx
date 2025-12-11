import React from 'react';

import { addDays, addMonths, addYears } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { useMonth, useSelectedDate, useViewBy } from './Provider';

import { Button } from '@/components/ui/button';

const TodayNav: React.FC = () => {
  const { viewBy } = useViewBy();
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const { setMonth } = useMonth();

  const handleTodayClick = () => {
    const today = new Date();
    if (setSelectedDate) {
      setSelectedDate(today);
    }
    if (setMonth) {
      setMonth(today); // forces calendar to scroll to today
    }
  };

  const handleTodayNavigation = (direction: string) => {
    const today = new Date(selectedDate || new Date());
    let nextDay = today; // default to today in case no change
    let prevDay = today;

    if (direction === 'next') {
      switch (viewBy) {
        case 'day':
          nextDay = addDays(today, 1);
          break;
        case 'week':
          nextDay = addDays(today, 7);
          break;
        case 'month':
          nextDay = addMonths(today, 1);
          break;
        // case 'quarter':
        // handle quarter view logic here
        // break;
        case 'year':
          nextDay = addYears(today, 1);
          break;
        default:
          break;
      }
      // const nextDay = addDays(today, 1);
      if (setSelectedDate) {
        setSelectedDate(nextDay);
      }
      if (setMonth) {
        setMonth(nextDay); // forces calendar to scroll to next day
      }
    } else if (direction === 'prev') {
      switch (viewBy) {
        case 'day':
          prevDay = addDays(today, -1);
          break;
        case 'week':
          prevDay = addDays(today, -7);
          break;
        case 'month':
          prevDay = addMonths(today, -1);
          break;
        // case 'quarter':
        // handle quarter view logic here
        // break;
        case 'year':
          prevDay = addYears(today, -1);
          break;
        default:
          break;
      }
      if (setSelectedDate) {
        setSelectedDate(prevDay);
      }
      if (setMonth) {
        setMonth(prevDay); // forces calendar to scroll to previous day
      }
    }
  };

  return (
    <div className="flex h-(--header-height) flex-row items-center justify-baseline gap-0.5 pr-2 pl-4">
      <Button
        size="smdrl"
        variant="grey"
        className="w-7"
        onClick={() => handleTodayNavigation('prev')}
      >
        <ChevronLeftIcon className="stroke-3" />
      </Button>
      <Button size="sm" variant="grey" className="w-18" onClick={() => handleTodayClick()}>
        Today
      </Button>
      <Button
        size="smdrr"
        variant="grey"
        className="w-7"
        onClick={() => handleTodayNavigation('next')}
      >
        <ChevronRightIcon className="stroke-3" />
      </Button>
    </div>
  );
};

export default TodayNav;
