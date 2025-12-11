import { type Dispatch, type SetStateAction, useId, useMemo, useState } from 'react';

import { format } from 'date-fns';

import { useEvents, useNewEvent, useSelectedDate } from '@/components/calendar/Provider';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DateInput from './DateInput';

import useFetchEvents from '@/hooks/useFetchEvents';
import { COLOURS, DEFAULT_START_HOUR, EVENT_TYPE } from '@/lib/constants';
import { addEvent, changeEvent } from '@/services/Events';
import type { IEvent, TCalendarEvent } from '@/types/Calendar';

type EventPanelProps = {
  id?: string;
  title: string;
  setTitle?: Dispatch<SetStateAction<string>> | undefined;
  start?: Date;
  end?: Date;
  allDay?: boolean;
  onClose?: () => void | undefined;
  event?: TCalendarEvent | null;
  className?: string;
};

/**
 * EventPanel
 * - Uses React 19.2 hooks: useId for stable ids.
 * - Decoupled from context for event data; relies on `event` prop.
 * - Expects parent to handle key-based remounting for state reset.
 */
const EventPanel = ({
  title,
  setTitle,
  start,
  end,
  onClose,
  event,
  className = '',
}: EventPanelProps) => {
  // stable ids for accessibility
  const idAllDay = useId();
  const idStarts = useId();
  const idEnds = useId();
  const idColour = useId();

  const { selectedDate } = useSelectedDate();
  const { setSelectedEvent } = useEvents();
  const { fetchEvents } = useFetchEvents(false);

  const { startDateTime, endDateTime } = useNewEvent();
  const [processingAction, setProcessingAction] = useState(false);

  const [frmTitle, setFrmTitle] = useState<string>(event?.title ?? title);
  const [frmType, setFrmType] = useState<string>(event?.type || 'other');

  // default colour index and state derived from it
  const DEFAULT_COLOUR = '1';
  const [frmColour, setFrmColour] = useState<string>(event?.colour || DEFAULT_COLOUR);

  // all-day flag (controlled)
  const [allDay, setAllDay] = useState<boolean>(event?.allDay || false);

  // derive sane default start/end datetimes from selected (or now) using useMemo so initialisers are stable
  const initialStart = useMemo(() => {
    if (startDateTime) {
      return new Date(startDateTime);
    }

    if (start) {
      return new Date(start);
    }

    const base = selectedDate ?? new Date();
    return new Date(format(base, `yyyy/MM/dd ${DEFAULT_START_HOUR}:00`));
  }, [selectedDate, start, startDateTime]);

  const initialEnd = useMemo(() => {
    if (endDateTime) {
      return new Date(endDateTime);
    }

    if (end) {
      return new Date(end);
    }

    const base = selectedDate ?? new Date();
    return new Date(format(base, `yyyy/MM/dd ${DEFAULT_START_HOUR + 1}:00`));
  }, [selectedDate, end, endDateTime]);

  const [startDate, setStartDate] = useState<Date>(() => initialStart);
  const [endDate, setEndDate] = useState<Date>(() => initialEnd);

  // stable handlers using useCallback
  const handleStartDateChange = (date: Date) => {
    // compare timestamps to avoid false negatives from Date object identity
    if (date.getTime() !== startDate.getTime()) {
      setStartDate(date);
      setEndDate((prev) => {
        const prevTime = format(prev, 'HH:mm');
        const startDate = format(date, 'yyyy/MM/dd');
        return new Date(`${startDate} ${prevTime}`);
      });
      // ensure end >= start
      // if (endDate.getTime() < date.getTime()) {
      //   setEndDate(date);
      // }
    }
  };

  const handleEndDateChange = (date: Date) => {
    if (date.getTime() !== endDate.getTime()) {
      setEndDate(date);
      // ensure start <= end
      if (startDate.getTime() > date.getTime()) {
        setStartDate(date);
      }
    }
  };

  const handleUpdateEvent = () => {
    if (!event) return;

    setProcessingAction(true);

    // Use setTimeout to allow the UI to render the loading state before processing
    setTimeout(async () => {
      try {
        const uEvent: IEvent = {
          id: event.id,
          title: frmTitle,
          description: frmTitle,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay,
          type: frmType,
          colour: frmColour,
        };
        await changeEvent(uEvent);
        await fetchEvents(true);
        if (onClose) {
          onClose();
        } else {
          setSelectedEvent(null);
        }
      } catch (error) {
        console.error('Failed to update event', error);
      } finally {
        setProcessingAction(false);
      }
    }, 0);
  };

  const handleAddEvent = () => {
    if (!selectedDate) return;

    setProcessingAction(true);

    // Use setTimeout to allow the UI to render the loading state before processing
    setTimeout(async () => {
      try {
        const newEvent: Omit<IEvent, 'id'> = {
          title: title,
          description: title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay,
          type: frmType,
          colour: frmColour,
        };
        await addEvent(newEvent);
        await fetchEvents(true);
        if (onClose) onClose();
      } catch (error) {
        console.error('Failed to add event', error);
      } finally {
        setProcessingAction(false);
      }
    }, 0);
  };

  return (
    <div
      className={`flex flex-col gap-2 p-3 ${event ? 'pt-4' : 'bg-(--button-group-separator)'} mx-2 mb-3 w-full rounded-md ${className}`}
    >
      {processingAction && (
        <div className="flex items-center gap-2">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" />
          <span className="text-primary ml-2">Processing...</span>
        </div>
      )}

      {!processingAction && (
        <div className="flex flex-col gap-2">
          <div className="flex w-full items-center pb-2">
            <Input
              type="text"
              value={event ? frmTitle : title}
              onChange={(e) => {
                if (event) {
                  setFrmTitle(e.target.value);
                } else {
                  setTitle?.(e.target.value);
                }
              }}
              placeholder="Event title"
              className={`h-6 w-full p-0`}
              style={{
                fontSize: event ? '1.3rem' : '1rem',
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor={idAllDay} className="w-12 justify-end">
              all-day
            </Label>
            {/* Controlled Checkbox */}
            <Checkbox
              id={idAllDay}
              checked={allDay}
              onCheckedChange={(toggle: boolean) => setAllDay(toggle)}
              // disabled={true}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor={idStarts} className="w-12 justify-end">
              starts
            </Label>
            <DateInput
              datetime={startDate}
              showTime={!allDay}
              onDateChange={handleStartDateChange}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor={idEnds} className="w-12 justify-end">
              ends
            </Label>
            <DateInput
              datetime={endDate}
              showTime={!allDay}
              onDateChange={handleEndDateChange}
              dateReadonly={true}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor={idColour} className="w-12 justify-end">
              type
            </Label>
            <Select
              defaultValue={frmType}
              onValueChange={(value) => {
                setFrmType(value);
              }}
            >
              <SelectTrigger className="w-1/2">
                <SelectValue>{frmType.charAt(0).toUpperCase() + frmType.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-(--left-background)">
                {EVENT_TYPE.map((type) => (
                  <SelectItem value={type} key={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor={idColour} className="w-12 justify-end">
              colour
            </Label>
            <Select defaultValue={frmColour} onValueChange={(value) => setFrmColour(value)}>
              <SelectTrigger>
                <SelectValue>
                  <div
                    className="w-10"
                    style={{ backgroundColor: `var(--event-default-colour-${frmColour})` }}
                  >
                    &nbsp;
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-(--left-background)">
                {COLOURS.map((c, i) => (
                  <SelectItem value={`${i + 1}`} key={c}>
                    <div className="w-20" style={{ backgroundColor: `var(${c})` }}>
                      &nbsp;
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              disabled={processingAction}
              onClick={() => {
                if ((event ? frmTitle : title).trim()) {
                  if (event) {
                    handleUpdateEvent();
                  } else {
                    handleAddEvent();
                  }
                }
              }}
              className={`mt-5 w-2/3 rounded-sm py-2 text-sm font-semibold`}
            >
              {processingAction ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="ml-2">Processing...</span>
                </div>
              ) : event ? (
                `Update Event`
              ) : (
                `Add Event`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPanel;
