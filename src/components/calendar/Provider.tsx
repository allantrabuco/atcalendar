import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { TCalendarEvent } from '@/types/Calendar';

type ViewBy = 'day' | 'week' | 'month' | 'year';

type CalendarProviderProps = {
  children: React.ReactNode;
  defaultViewBy?: ViewBy;
  storageKeyViewBy?: string;
  // controlled optional props — if provided, provider acts controlled for that piece of state
  selectedDate?: Date | undefined;
  setSelectedDate?: (date: Date | undefined) => void;
  month?: Date;
  setMonth?: (date: Date) => void;
  showLeftPanel?: boolean;
  setShowLeftPanel?: (show: boolean) => void;
  showRightPanel?: boolean;
  setShowRightPanel?: (show: boolean) => void;
  // initialize events (uncontrolled state inside provider)
  initialEvents?: Record<string, TCalendarEvent[]>;
};

type CalendarProviderState = {
  viewBy: ViewBy;
  setViewBy: (view: ViewBy) => void;
  selectedDate?: Date | undefined;
  setSelectedDate?: (date: Date | undefined) => void;
  month?: Date;
  setMonth?: (date: Date) => void;
  showLeftPanel?: boolean;
  setShowLeftPanel?: (show: boolean) => void;
  showRightPanel?: boolean;
  setShowRightPanel?: (show: boolean) => void;
  selectedEvent: TCalendarEvent | null;
  setSelectedEvent: React.Dispatch<React.SetStateAction<TCalendarEvent | null>>;
  events: Record<string, TCalendarEvent[]>;
  setEvents: React.Dispatch<React.SetStateAction<Record<string, TCalendarEvent[]>>>;
  isInputToggled: boolean;
  setIsInputToggled: React.Dispatch<React.SetStateAction<boolean>>;
  startDateTime: Date | null;
  setStartDateTime: React.Dispatch<React.SetStateAction<Date | null>>;
  endDateTime: Date | null;
  setEndDateTime: React.Dispatch<React.SetStateAction<Date | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Minimal initial state used for context creation.
 * Functions are no-ops to make the context safer for consumers before provider is mounted.
 */
const initialState: CalendarProviderState = {
  viewBy: 'day',
  setViewBy: () => undefined,
  selectedDate: undefined,
  setSelectedDate: () => undefined,
  month: undefined,
  setMonth: () => undefined,
  showLeftPanel: true,
  setShowLeftPanel: () => undefined,
  showRightPanel: true,
  setShowRightPanel: () => undefined,
  selectedEvent: null,
  setSelectedEvent: () => undefined,
  events: {},
  setEvents: () => undefined,
  isInputToggled: false,
  setIsInputToggled: () => undefined,
  startDateTime: null,
  setStartDateTime: () => undefined,
  endDateTime: null,
  setEndDateTime: () => undefined,
  isLoading: false,
  setIsLoading: () => undefined,
};

const CalendarProviderContext = createContext<CalendarProviderState>(initialState);

const DEFAULT_EVENTS: Record<string, TCalendarEvent[]> = {};

/**
 * CalendarProvider
 *
 * - Supports controlled and uncontrolled usage for selected, month and panel visibility.
 * - Persists viewBy into localStorage (guarded for SSR).
 * - Uses React 19's useEffectEvent to create stable callbacks for handlers.
 * - Memoizes context value to avoid unnecessary re-renders.
 */
export function CalendarProvider({
  children,
  defaultViewBy = 'day',
  storageKeyViewBy = 'atcalendar-viewby',
  selectedDate,
  setSelectedDate,
  month,
  setMonth,
  showLeftPanel,
  setShowLeftPanel,
  showRightPanel,
  setShowRightPanel,
  initialEvents = DEFAULT_EVENTS,
  ...props
}: CalendarProviderProps) {
  // viewBy: similar safe init
  const getInitialViewBy = (): ViewBy => {
    if (typeof window === 'undefined') return defaultViewBy;
    const stored = localStorage.getItem(storageKeyViewBy) as ViewBy | null;
    return (stored as ViewBy) || defaultViewBy;
  };
  const [viewBy, setViewByState] = useState<ViewBy>(getInitialViewBy);

  // EVENTS: provider-managed (uncontrolled) events map
  const [events, setEvents] = useState<Record<string, TCalendarEvent[]>>(initialEvents ?? {});
  // keep events in sync if parent changes initialEvents prop
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(initialEvents ?? {});
  }, [initialEvents]);

  // selectedEvent: provider-managed (uncontrolled) selectedEvent
  const [selectedEvent, setSelectedEvent] = useState<TCalendarEvent | null>(null);
  useEffect(() => {
    // if parent controls selectedEvent, mirror it into internal for consistency
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedEvent !== undefined) setSelectedEvent(selectedEvent);
  }, [selectedEvent]);

  // Controlled / uncontrolled pattern for selected
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(selectedDate);
  useEffect(() => {
    // if parent controls selected, mirror it into internal for consistency
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedDate !== undefined) setInternalSelectedDate(selectedDate);
  }, [selectedDate]);

  const selectedValue = selectedDate !== undefined ? selectedDate : internalSelectedDate;

  const setSelectedValue = React.useCallback(
    (date: Date | undefined) => {
      if (setSelectedDate) setSelectedDate(date);
      else setInternalSelectedDate(date);
      setSelectedEvent(null);
    },
    [setSelectedDate]
  );

  // Controlled / uncontrolled pattern for month
  const [internalMonth, setInternalMonth] = useState<Date | undefined>(month);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (month !== undefined) setInternalMonth(month);
  }, [month]);
  const monthValue = month !== undefined ? month : internalMonth;
  const defaultSetMonth = React.useCallback((d: Date) => setInternalMonth(d), []);
  const setMonthValue = setMonth ?? defaultSetMonth;

  // Sync month with selectedDate
  useEffect(() => {
    if (selectedValue) {
      setMonthValue(new Date(selectedValue.getFullYear(), selectedValue.getMonth(), 1));
    }
  }, [selectedValue, setMonthValue]);

  // Panels controlled/uncontrolled
  const [internalShowLeft, setInternalShowLeft] = useState<boolean>(showLeftPanel ?? true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (showLeftPanel !== undefined) setInternalShowLeft(showLeftPanel);
  }, [showLeftPanel]);
  const showLeftValue = showLeftPanel !== undefined ? showLeftPanel : internalShowLeft;
  const setShowLeftValue = setShowLeftPanel ?? setInternalShowLeft;

  const [internalShowRight, setInternalShowRight] = useState<boolean>(showRightPanel ?? true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (showRightPanel !== undefined) setInternalShowRight(showRightPanel);
  }, [showRightPanel]);
  const showRightValue = showRightPanel !== undefined ? showRightPanel : internalShowRight;
  const setShowRightValue = setShowRightPanel ?? setInternalShowRight;

  // Input Toggle State
  const [isInputToggled, setIsInputToggled] = useState<boolean>(false);
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);

  // Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handler for viewBy with persistent storage
  const setViewByAndStore = React.useCallback(
    (v: ViewBy) => {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(storageKeyViewBy, v);
      } catch {
        // ignore
      }
      setViewByState(v);
      setSelectedEvent(null);
    },
    [storageKeyViewBy]
  );

  // Memoize the context value to avoid downstream re-renders when not necessary
  const value = useMemo<CalendarProviderState>(() => {
    return {
      viewBy,
      setViewBy: setViewByAndStore,
      selectedDate: selectedValue,
      setSelectedDate: setSelectedValue,
      month: monthValue,
      setMonth: setMonthValue,
      showLeftPanel: showLeftValue,
      setShowLeftPanel: setShowLeftValue,
      showRightPanel: showRightValue,
      setShowRightPanel: setShowRightValue,
      selectedEvent,
      setSelectedEvent,
      events,
      setEvents,
      isInputToggled,
      setIsInputToggled,
      startDateTime,
      setStartDateTime,
      endDateTime,
      setEndDateTime,
      isLoading,
      setIsLoading,
    };
    // Note: intentionally include handlers and state pieces; they are stable via useEvent/useState
  }, [
    viewBy,
    setViewByAndStore,
    selectedValue,
    setSelectedValue,
    monthValue,
    setMonthValue,
    showLeftValue,
    setShowLeftValue,
    showRightValue,
    setShowRightValue,
    selectedEvent,
    setSelectedEvent,
    events,
    setEvents,
    isInputToggled,
    setIsInputToggled,
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,
    isLoading,
    setIsLoading,
  ]);

  return (
    <CalendarProviderContext.Provider {...props} value={value}>
      {children}
    </CalendarProviderContext.Provider>
  );
}

/* Convenience hooks for consumers — small wrappers around useContext for easier access. */

/** Events hook — returns the events map and setter. */
// eslint-disable-next-line react-refresh/only-export-components
export const useEvents = () => {
  const { selectedEvent, setSelectedEvent, events, setEvents } =
    useContext(CalendarProviderContext);
  return { selectedEvent, setSelectedEvent, events, setEvents };
};

/** ViewBy hook — read and update current view (day/week/month/year). */
// eslint-disable-next-line react-refresh/only-export-components
export const useViewBy = () => {
  const { viewBy, setViewBy } = useContext(CalendarProviderContext);
  return { viewBy, setViewBy };
};

/** Selected date hook — works with controlled or uncontrolled provider usage. */
// eslint-disable-next-line react-refresh/only-export-components
export const useSelectedDate = () => {
  const { selectedDate, setSelectedDate } = useContext(CalendarProviderContext);
  return { selectedDate, setSelectedDate };
};

/** Month hook — read and update current month. */
// eslint-disable-next-line react-refresh/only-export-components
export const useMonth = () => {
  const { month, setMonth } = useContext(CalendarProviderContext);
  return { month, setMonth };
};

/** Panels hook — left/right panel visibility and setters. */
// eslint-disable-next-line react-refresh/only-export-components
export const usePanels = () => {
  const { showLeftPanel, setShowLeftPanel, showRightPanel, setShowRightPanel } =
    useContext(CalendarProviderContext);
  return { showLeftPanel, setShowLeftPanel, showRightPanel, setShowRightPanel };
};

/** Input toggle hook — read and update input toggle state. */
// eslint-disable-next-line react-refresh/only-export-components
export const useNewEvent = () => {
  const {
    isInputToggled,
    setIsInputToggled,
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,
  } = useContext(CalendarProviderContext);
  return {
    isInputToggled,
    setIsInputToggled,
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,
  };
};

/** Loading hook — read and update loading state. */
// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = () => {
  const { isLoading, setIsLoading } = useContext(CalendarProviderContext);
  return { isLoading, setIsLoading };
};
