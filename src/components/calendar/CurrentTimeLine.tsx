import { CELL_HEIGHT, SLOTS_PER_HOUR } from '@/lib/constants';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';

interface CurrentTimeLineProps {
  cellHeight?: number;
  slotsPerHour?: number;
  offset?: number; // optional, for fine-tuning the vertical position
}

const CurrentTimeLine: React.FC<CurrentTimeLineProps> = ({
  cellHeight = CELL_HEIGHT,
  slotsPerHour = SLOTS_PER_HOUR,
  offset = 0,
}) => {
  const [now, setNow] = useState(() => new Date());

  // tick every 15s (or whatever resolution you need) — this updates only this component
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const top =
    now.getHours() * cellHeight * slotsPerHour + now.getMinutes() * (cellHeight / 15) + offset;
  const timeLabel = format(now, 'HH:mm');

  return (
    <div
      className="pointer-events-none absolute left-(--calendar-hour-width) w-[calc(100%-var(--calendar-hour-width)+0.5rem)]"
      style={{
        left: 'calc(var(--time-label-width) + 0px)', // adjust as needed
        right: 0,
        top,
      }}
      aria-hidden
    >
      <div className="h-0.5 w-full bg-red-500" />
      <span className="absolute -top-2 -left-12 bg-(--main-background) text-xs text-red-500">
        {timeLabel}
      </span>
      <div className="absolute -top-1.5 -left-4.5 ml-2 h-3 w-3 rounded-4xl bg-red-500" />
      {/* <div className=" bg-green-500 flex-1" style={{ height: '1px' }} /> */}
    </div>
  );
};

// memo so parent re-renders don't affect its render unless props/context it reads change
export default React.memo(CurrentTimeLine);
