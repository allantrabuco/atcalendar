import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import Calendar from './calendar/Calendar';
import EventPanel from './calendar/EventPanel';
import { useEvents, useNewEvent } from './calendar/Provider';
import LeftPanelEventList from './LeftPanelEventList';
import { Button } from './ui/button';
import { Input } from './ui/input';

type LeftPanelProps = {
  month: Date;
  setMonth?: (date: Date) => void;
  setSelectedDate?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
};

const LeftPanel: React.FC<LeftPanelProps> = ({
  month,
  setMonth,
  setSelectedDate,
  selectedDate,
}) => {
  const { selectedEvent, setSelectedEvent } = useEvents();

  // Title for the new event input
  const [title, setTitle] = useState<string>('');

  // Whether the compact input control has been toggled open by the user
  const { isInputToggled, setIsInputToggled, startDateTime, setStartDateTime, setEndDateTime } =
    useNewEvent();

  // Panel should be visible (expanded) only when user toggled and there is a non-empty title.
  const isPanelVisible = isInputToggled && (startDateTime || title.length > 0);

  // Ref to the input for programmatic focus
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus the input when the compact input region is revealed.
  // requestAnimationFrame ensures the input exists in the DOM before focusing (good with concurrent rendering).
  useEffect(() => {
    if (!isInputToggled) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [isInputToggled]);

  // Stable helper to clear title
  const clearTitle = useCallback(() => {
    setTitle('');
  }, []);

  // Close handler for EventPanel: clear title and collapse compact toggle
  const handleOnClose = useCallback(() => {
    if (selectedEvent) {
      setSelectedEvent(null);
    } else {
      clearTitle();
      setIsInputToggled(false);
    }
  }, [clearTitle, selectedEvent, setSelectedEvent, setIsInputToggled]);

  // Stable blur handler
  const handleInputBlur = useCallback(() => {
    // If input is empty when it blurs, hide the compact input control
    if (title.length === 0) {
      setIsInputToggled(false);
    }
  }, [title, setIsInputToggled]);

  // Stable keydown handler
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setIsInputToggled(false);
        setStartDateTime(null);
        setEndDateTime(null);
        setTitle('');
      }
    },
    [setIsInputToggled, setStartDateTime, setEndDateTime]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header / input toggle row */}
      <div className="ml-auto flex h-[--header-height] w-full flex-row items-center justify-end gap-2 p-2">
        {isInputToggled ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={isInputToggled ? 'open' : 'closed'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              <Input
                // Forward ref so it can be focused programmatically
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="text-secondary-foreground h-6 w-full rounded-xs bg-(--button-group-separator)"
                clearable={true}
                onClear={() => clearTitle()}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <Button
            size="smdr"
            variant="grey"
            className="w-7"
            onClick={() => setIsInputToggled(true)}
          >
            <Plus className="stroke-3" />
          </Button>
        )}
      </div>

      {/* Collapsible EventPanel
          - showEventPanel keeps AnimatePresence mounted while exit runs
          - motion child rendered only while isPanelVisible is true so AnimatePresence detects removal
      */}
      {/* Collapsible EventPanel */}
      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            key="new-event-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: { duration: 0.25, ease: 'easeInOut' },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.25, ease: 'easeOut' },
            }}
            style={{ overflow: 'hidden' }} // required for smooth height animation
            className="relative flex w-full shrink-0 flex-row"
          >
            <EventPanel
              key={selectedDate?.toISOString() ?? 'no-selection'}
              title={title}
              setTitle={setTitle}
              onClose={handleOnClose}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main calendar area */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-hidden">
        <Calendar
          keyMonth={month.toDateString()} // forces rerender on same-day click
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
        />
        <div className="my-2 h-px w-full" />
        <LeftPanelEventList />
      </div>
    </div>
  );
};

export default LeftPanel;
