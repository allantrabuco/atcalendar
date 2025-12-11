import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { TCalendarEvent } from '@/types/Calendar';
import { format, getDate, isToday } from 'date-fns';
import React, { useState } from 'react';
import { useSelectedDate } from './Provider';

const BG_SCALES_DARK = [
  'bg-yellow-500/80',
  'bg-yellow-600',
  'bg-yellow-700',
  'bg-yellow-800',
  'bg-red-900',
];
const BG_SCALES_LIGHT = [
  'bg-yellow-200/80',
  'bg-yellow-300/80',
  'bg-yellow-500/80',
  'bg-amber-500/80',
  'bg-red-500/40',
];

interface YearDayCellProps {
  date: Date;
  inMonth: boolean;
  isSelected: boolean;
  events: TCalendarEvent[];
  theme: string;
  onSelectDate: (date: Date) => void;
}

const YearDayCell: React.FC<YearDayCellProps> = ({
  date,
  inMonth,
  isSelected,
  events,
  theme,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedDate } = useSelectedDate();
  const today = isToday(date);
  const sortedEvents = [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
  const count = sortedEvents.length;

  let bgClass = '';
  if (!today && count > 0 && inMonth) {
    let idx = 0;
    if (count >= 9) idx = 4;
    else if (count >= 7) idx = 3;
    else if (count >= 5) idx = 2;
    else if (count >= 3) idx = 1;
    else idx = 0;
    bgClass = theme === 'dark' ? BG_SCALES_DARK[idx] : BG_SCALES_LIGHT[idx];
  } else if (today && inMonth) {
    // keep today's special highlight when there are no events
    bgClass = 'bg-[var(--colour-4)]';
  }

  const textColourClass = today ? 'text-white' : 'text-[var(--foreground)]';

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    setSelectedDate?.(date);
  };

  const handleDoubleClick = () => {
    if (inMonth) {
      onSelectDate(date);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <td
          tabIndex={-1}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`relative cursor-pointer overflow-visible text-center align-middle outline-none ${inMonth ? 'text-foreground' : 'text-(--grey-2)'} ${bgClass} ${isSelected && inMonth ? 'z-10 scale-110' : 'scale-100'} ${inMonth ? 'border border-transparent' : 'border-0'} `}
          aria-label={format(date, 'yyyy-MM-dd')}
        >
          <span
            className={`inline-block origin-center transform will-change-transform ${isSelected && inMonth ? 'scale-120' : 'scale-100'} ${isSelected && inMonth ? 'text-base' : 'text-xs'} ${isSelected && inMonth ? '-m-10' : ''} ${inMonth ? textColourClass : ''} `}
          >
            {getDate(date)}
          </span>
        </td>
      </PopoverTrigger>
      <PopoverContent
        className="pointer-events-none w-80 border-[var(--left-border-colour)] bg-[var(--left-background)]/95 p-2 shadow-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        side="right"
        align="start"
        sideOffset={2}
        alignOffset={10}
        showArrow={false}
      >
        <div className="space-y-1">
          <h4 className="mb-4 pb-1 text-sm leading-none font-medium font-semibold text-(--button-group-text-default-colour)">
            {format(date, 'EEEE dd/MM/yyyy').toUpperCase()}
          </h4>
          {sortedEvents.length > 0 ? (
            <div className="flex flex-col gap-1">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`hover:bg-accent hover:text-accent-foreground cursor-pointer p-1 pb-1 text-xs transition-colors ${event.allDay ? `flex h-6 items-center justify-start rounded-md` : ``}`}
                  style={{
                    backgroundColor: event.allDay
                      ? `var(--event-default-colour-${event.colour}-marker)`
                      : `transparent`,
                  }}
                >
                  {!event.allDay && (
                    <div className="flex flex-row items-center">
                      <div
                        className={`mr-2 h-3 w-2 rotate-60 transform rounded`}
                        style={{
                          backgroundColor: `var(--event-default-colour-${event.colour}-marker)`,
                        }}
                      />
                      <span className="mr-1 font-semibold text-(--button-group-text-default-colour)">
                        {format(new Date(event.start), 'HH:mm')} -{' '}
                        {format(new Date(event.end), 'HH:mm')}
                      </span>
                    </div>
                  )}
                  <span className={`${event.allDay ? `pl-1` : `pl-5`} truncate text-sm font-light`}>
                    {event.title || '(No Title)'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">No events</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default YearDayCell;
