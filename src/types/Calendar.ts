export type EventType =
  | 'birthday'
  | 'holiday'
  | 'meeting'
  | 'other'
  | 'personal'
  | 'reminder'
  | 'task'
  | 'work';

export interface IEvent {
  id: number | string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  type?: string;
  colour?: string;
}

// replace TCalendarEvent so start/end are Date
export type TCalendarEvent = Omit<IEvent, 'start' | 'end'> & {
  start: Date;
  end: Date;
  duration?: number;
  slot?: number;
  allDay?: boolean;
};

export interface CalendarCellProps {
  year: number;
  month: string;
  day: string;
  hour: number;
  slot: number;
  events: TCalendarEvent[];
  scheduledEvents: Record<string, TCalendarEvent[]>;
  children?: React.ReactNode;
  columnSize: number;
  layout?: Record<string, { width: number; left: number }>;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export type TDragOverCell = {
  year: number;
  month: string;
  day: number;
  hour: number;
  slot: number;
};

export type TAddEventDialog = {
  open: boolean;
  onClose: () => void;
  // onAdd: (title: string, duration: number, color: string) => void;
  // year: number;
  // month: number;
  // day: number;
  hour: number;
  slot: number;
};
