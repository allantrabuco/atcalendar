// Hour labels for the calendar
const hourLabels: string[] = [
  'all-day',
  '',
  ...Array.from({ length: 24 }, (_, i) => {
    const hour = i + 1;
    return hour === 12 ? 'noon' : hour === 24 ? 'midnight' : `${hour}`;
  }),
];

const TimeLabel = () => {
  return (
    <div className="flex w-(--calendar-hour-width) flex-col pr-3">
      {hourLabels.slice(1).map((label, i) => (
        <div
          key={`label-${i}`}
          className={`relative ${i > 0 ? 'h-(--calendar-hour-height)' : 'h-[calc(var(--calendar-hour-height)/2)]'} flex items-center justify-end`}
        >
          <span
            className="absolute right-0 bg-(--calendar-background) px-1 text-right text-xs font-extralight text-(--calendar-time-colour)"
            // style={i > 0 ? { transform: "translateY(-40%)", top: "100%" } : {}}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TimeLabel;
