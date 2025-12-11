import { useEffect, useState } from 'react';

import type { PropsSingle } from 'react-day-picker';
import { CalendarMonth, DayPicker } from 'react-day-picker';

import { endOfWeek, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

type DateRange = { from: Date; to: Date };

type CalendarProps = PropsSingle & {
  keyMonth?: string;
  mode?: 'single' | 'multiple' | 'range';
  month: Date;
  onMonthChange?: (date: Date) => void;
  onSelectDate?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
};

const CustomMonthCaption = (
  props: {
    calendarMonth: CalendarMonth;
    displayIndex: number;
  } & React.HTMLAttributes<HTMLDivElement>
): React.ReactElement => {
  const { calendarMonth, displayIndex, ...rest } = props;
  void displayIndex;

  return (
    <div {...rest}>
      <span className="text-foreground text-3xl font-medium">
        {format(calendarMonth.date, 'MMMM')}
      </span>
      <span>&nbsp;</span>
      <span className="text-primary text-3xl font-extralight">
        {format(calendarMonth.date, 'yyyy')}
      </span>
    </div>
  );
};

const CustomNav = ({
  onNextClick,
  onPreviousClick,
  className,
}: {
  onNextClick?: React.MouseEventHandler<HTMLButtonElement>;
  onPreviousClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}) => (
  <div className={cn('flex items-center justify-between gap-1', className)}>
    <button
      onClick={onPreviousClick}
      aria-label="Previous month"
      className="h-full w-full cursor-pointer"
    >
      <ChevronLeft className="h-5 w-5 stroke-3 text-(--colour-chevron)" />
    </button>
    <button onClick={onNextClick} aria-label="Next month" className="h-full w-full cursor-pointer">
      <ChevronRight className="h-5 w-5 stroke-3 text-(--colour-chevron)" />
    </button>
  </div>
);

const getWeekdayLabel = (date: Date, localeCode: string) => {
  const formatter = new Intl.DateTimeFormat(localeCode, { weekday: 'short' });
  const label = formatter.format(date);
  return label.length > 3 ? label.slice(0, 3) : label;
};
const localeCode = 'en-GB';

const Calendar = (props: CalendarProps) => {
  const {
    mode, // Required by DayPicker for selection behavior
    selectedDate, // The current selected date
    onSelectDate, // Callback for date selection
    month, // Controls visible month
    onMonthChange, // Callback for month navigation
    // keyMonth, // Used for force-rerender logic
  } = props;

  const [selectedWeek, setSelectedWeek] = useState<DateRange | undefined>();

  const isInRange = (date: Date, range?: { from: Date; to: Date }) => {
    if (!range) return false;
    return date >= range.from && date <= range.to;
  };

  useEffect(() => {
    const isSelectedInRange = selectedDate && isInRange(selectedDate, selectedWeek);

    if (selectedDate && !isSelectedInRange) {
      setSelectedWeek({ // eslint-disable-line react-hooks/set-state-in-effect
        from: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        to: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      });
    }
  }, [selectedDate, selectedWeek]);

  return (
    <DayPicker
      {...props}
      animate
      captionLayout="label"
      components={{
        MonthCaption: CustomMonthCaption,
        Nav: CustomNav,
      }}
      // footer={`key: ${keyMonth}`}
      formatters={{
        formatWeekdayName: (date: Date) => getWeekdayLabel(date, localeCode),
      }}
      // key={keyMonth}
      modifiers={{
        range_start: selectedWeek?.from,
        range_end: selectedWeek?.to,
        range_middle: (date: Date) =>
          isInRange(date, selectedWeek) &&
          date.getTime() !== selectedWeek?.from.getTime() &&
          date.getTime() !== selectedWeek?.to.getTime(),
      }}
      mode={mode || 'single'}
      month={month}
      navLayout="after"
      // onDayClick={(day, modifiers) => onDayClick(day, modifiers)}
      onMonthChange={onMonthChange}
      onSelect={onSelectDate}
      selected={selectedDate}
      showOutsideDays
      weekStartsOn={1} // Monday as the first day of the week
      required
      // fixedWeeks
    />
  );
};

export default Calendar;
