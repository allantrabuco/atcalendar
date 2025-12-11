/* eslint-disable react-hooks/immutability */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '../ui/button';
import Calendar from '../ui/calendar';
import { Input } from '../ui/input';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DateInputProps = {
  datetime?: Date;
  onDateChange?: (d: Date) => void;
  dateReadonly?: boolean;
  showTime?: boolean;
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const pad2 = (s: string) => s.padStart(2, '0');
const toNumber = (s: string) => parseInt(s || '', 10);
const daysInMonth = (year: number, month: number) =>
  // month 1..12
  new Date(year, month, 0).getDate();

/**
 * DateInput
 *
 * - Keeps last-valid values for restoring when a field is left empty.
 * - Uses useEffectEvent for event callbacks that may be called from outside React lifecycle
 *   (keeps stable identity but reads latest state).
 * - Keeps behaviour and public API unchanged.
 */
const DateInput: React.FC<DateInputProps> = ({
  datetime,
  onDateChange,
  dateReadonly = false,
  showTime = false,
}) => {
  const initial = datetime ?? new Date();
  // animation variants for showing/hiding the time inputs
  const timeVariants = {
    hidden: { opacity: 0, height: 0, scale: 0.98 },
    visible: { opacity: 1, height: 'auto', scale: 1 },
  };

  // calendar popover state + helpers
  const [calendarOpen, setCalendarOpen] = useState(false);

  const openCalendar = () => {
    setCalendarOpen(true);
    // keep input focused when popover opens
    // setTimeout(() => {
    //   dayRef.current?.focus()
    //   dayRef.current?.select()
    // }, 0)
  };

  const handleCalendarSelect = (d: Date) => {
    const sd = pad2(String(d.getDate()));
    const sm = pad2(String(d.getMonth() + 1));
    const sy = String(d.getFullYear());
    setConfirmed('day', sd);
    setConfirmed('month', sm);
    setConfirmed('year', sy);
    lastValidDayRef.current = sd;
    lastValidMonthRef.current = sm;
    lastValidYearRef.current = sy;
    notifyIfValid(sd, sm, sy, hour, minute);
    setCalendarOpen(false);
    // restore focus to the input that should retain focus
    setTimeout(() => {
      dayRef.current?.focus();
      dayRef.current?.select();
    }, 0);
  };

  const [day, setDay] = useState(() => pad2(String(initial.getDate())));
  const [month, setMonth] = useState(() => pad2(String(initial.getMonth() + 1)));
  const [year, setYear] = useState(() => String(initial.getFullYear()));
  const [hour, setHour] = useState(() => pad2(String(initial.getHours())));
  const [minute, setMinute] = useState(() => pad2(String(initial.getMinutes())));

  const dayRef = useRef<HTMLInputElement | null>(null);
  const monthRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);
  const hourRef = useRef<HTMLInputElement | null>(null);
  const minuteRef = useRef<HTMLInputElement | null>(null);

  const lastValidDayRef = useRef<string>(pad2(String(initial.getDate())));
  const lastValidMonthRef = useRef<string>(pad2(String(initial.getMonth() + 1)));
  const lastValidYearRef = useRef<string>(String(initial.getFullYear()));
  const lastValidHourRef = useRef<string>(pad2(String(initial.getHours())));
  const lastValidMinuteRef = useRef<string>(pad2(String(initial.getMinutes())));

  // sync when parent updates datetime
  useEffect(() => {
    const d = datetime ?? new Date();
    const sd = pad2(String(d.getDate()));
    const sm = pad2(String(d.getMonth() + 1));
    const sy = String(d.getFullYear());
    const sh = pad2(String(d.getHours()));
    const smi = pad2(String(d.getMinutes()));
    setDay(sd);
    setMonth(sm);
    setYear(sy);
    setHour(sh);
    setMinute(smi);
    lastValidDayRef.current = sd;
    lastValidMonthRef.current = sm;
    lastValidYearRef.current = sy;
    lastValidHourRef.current = sh;
    lastValidMinuteRef.current = smi;
  }, [datetime]);

  // small helpers
  const onlyDigits = useCallback((v: string) => v.replace(/\D/g, ''), []);
  const getMaxDaysForCurrent = useCallback(
    (useYearIfMissing = true) => {
      const m = toNumber(month);
      const y = toNumber(year);
      if (Number.isNaN(m) || m < 1 || m > 12) return 31;
      const useYear = Number.isNaN(y) && useYearIfMissing ? new Date().getFullYear() : y;
      return daysInMonth(useYear, m);
    },
    [month, year]
  );

  // composeDate memo-style function (reads current state)
  const composeDate = useCallback(
    (d = day, mo = month, y = year, h = hour, mi = minute) => {
      const dd = clamp(toNumber(d) || 1, 1, 31);
      const mm = clamp(toNumber(mo) || 1, 1, 12);
      const yy = clamp(Number(y) || new Date().getFullYear(), 0, 9999);
      const hh = clamp(toNumber(h) || 0, 0, 23);
      const mii = clamp(toNumber(mi) || 0, 0, 59);
      return new Date(yy, mm - 1, dd, hh, mii);
    },
    [day, month, year, hour, minute]
  );

  // notifyIfValid used across UI and external components (useEffectEvent to keep stable identity)
  // notifyIfValid used across UI and external components
  const notifyIfValid = useCallback(
    (d = day, mo = month, y = year, h = hour, mi = minute) => {
      const mm = toNumber(mo);
      const yy = toNumber(y);
      const dd = toNumber(d);
      if (Number.isNaN(mm) || mm < 1 || mm > 12) return;
      const useYear = Number.isNaN(yy) ? new Date().getFullYear() : yy;
      const max = daysInMonth(useYear, mm);
      if (Number.isNaN(dd) || dd < 1 || dd > max) return;

      const hh = toNumber(h);
      const mii = toNumber(mi);
      const useHour = Number.isNaN(hh) ? 0 : clamp(hh, 0, 23);
      const useMinute = Number.isNaN(mii) ? 0 : clamp(mii, 0, 59);

      onDateChange?.(new Date(useYear, mm - 1, dd, useHour, useMinute));
    },
    [day, month, year, hour, minute, onDateChange]
  );

  // helpers to set confirmed values and update last-valid refs
  const setConfirmed = useCallback(
    (field: 'day' | 'month' | 'year' | 'hour' | 'minute', value: string) => {
      switch (field) {
        case 'day':
          setDay(value);
          lastValidDayRef.current = value;
          break;
        case 'month':
          setMonth(value);
          lastValidMonthRef.current = value;
          break;
        case 'year':
          setYear(value);
          lastValidYearRef.current = value;
          break;
        case 'hour':
          setHour(value);
          lastValidHourRef.current = value;
          break;
        case 'minute':
          setMinute(value);
          lastValidMinuteRef.current = value;
          break;
      }
    },
    []
  );

  // generic change handler for inputs (allows empty while typing)
  const handleChange = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<string>>,
      maxLen: number,
      nextRef?: React.RefObject<HTMLInputElement | null>
    ) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const val = onlyDigits(raw).slice(0, maxLen);
        setter(val);
        if (val.length === maxLen && nextRef?.current) {
          setTimeout(() => {
            nextRef.current?.focus();
            nextRef.current?.select();
          }, 0);
        }
      },
    [onlyDigits]
  );

  // paste handling — stable identity with useEffectEvent
  // paste handling
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text').trim();
      if (!text) return;

      const dtMatch = text.match(
        /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2}))?$/
      );
      if (dtMatch) {
        e.preventDefault();
        const [, d, mo, y, h, mi] = dtMatch;
        const sd = pad2(onlyDigits(d).slice(0, 2) || '01');
        const sm = pad2(onlyDigits(mo).slice(0, 2) || '01');
        const sy = onlyDigits(y).slice(0, 4) || String(new Date().getFullYear());
        const sh = pad2(onlyDigits(h || '').slice(0, 2) || '00');
        const smin = pad2(onlyDigits(mi || '').slice(0, 2) || '00');
        setDay(sd);
        setMonth(sm);
        setYear(sy);
        if (showTime) {
          setHour(sh);
          setMinute(smin);
        }
        lastValidDayRef.current = sd;
        lastValidMonthRef.current = sm;
        lastValidYearRef.current = sy;
        lastValidHourRef.current = sh;
        lastValidMinuteRef.current = smin;
        setTimeout(() => {
          if (showTime) minuteRef.current?.focus();
          else yearRef.current?.focus();
          notifyIfValid(sd, sm, sy, sh, smin);
        }, 0);
        return;
      }

      const pm = text.match(/^(\d{2})(\d{2})(\d{2,4})$/);
      if (pm) {
        e.preventDefault();
        const [, d, mo, y] = pm;
        const sd = pad2(d.slice(0, 2));
        const sm = pad2(mo.slice(0, 2));
        const sy = y.slice(0, 4);
        setDay(sd);
        setMonth(sm);
        setYear(sy);
        lastValidDayRef.current = sd;
        lastValidMonthRef.current = sm;
        lastValidYearRef.current = sy;
        setTimeout(() => {
          yearRef.current?.focus();
          notifyIfValid(sd, sm, sy);
        }, 0);
      }
    },
    [notifyIfValid, onlyDigits, showTime]
  );

  // onBlur / normalization logic (stable identity)
  // onBlur / normalization logic
  const handleBlurPad = useCallback(
    (which: 'day' | 'month' | 'year' | 'hour' | 'minute') => {
      const curYear = toNumber(year);
      const effectiveYear = Number.isNaN(curYear) ? new Date().getFullYear() : curYear;
      const curMonth = toNumber(month);

      if (which === 'day') {
        if (day === '') {
          setDay(lastValidDayRef.current);
          notifyIfValid(lastValidDayRef.current, month, String(effectiveYear), hour, minute);
          return;
        }
        const n = toNumber(day);
        if (Number.isNaN(n)) {
          setDay(lastValidDayRef.current);
          notifyIfValid(lastValidDayRef.current, month, String(effectiveYear), hour, minute);
          return;
        }
        if (!Number.isNaN(curMonth) && curMonth >= 1 && curMonth <= 12) {
          const max = daysInMonth(effectiveYear, curMonth);
          let corrected = n;
          if (n < 1) corrected = 1;
          if (n > max) corrected = max;
          const sd = pad2(String(corrected));
          setConfirmed('day', sd);
          notifyIfValid(sd, month, String(effectiveYear), hour, minute);
        } else {
          const sd = pad2(String(clamp(n, 1, 31)));
          setConfirmed('day', sd);
          notifyIfValid(sd, month, String(effectiveYear), hour, minute);
        }
        return;
      }

      if (which === 'month') {
        if (month === '') {
          setMonth(lastValidMonthRef.current);
          const maxForRestored = daysInMonth(effectiveYear, toNumber(lastValidMonthRef.current));
          const d = toNumber(day);
          if (Number.isNaN(d) || d < 1) setDay(pad2('01'));
          else if (d > maxForRestored) setDay(pad2(String(maxForRestored)));
          notifyIfValid(day, lastValidMonthRef.current, String(effectiveYear), hour, minute);
          return;
        }
        const m = toNumber(month);
        if (Number.isNaN(m) || m < 1 || m > 12) {
          const sm = pad2('12');
          setConfirmed('month', sm);
          lastValidMonthRef.current = sm;
          const maxForDec = daysInMonth(effectiveYear, 12);
          const d = toNumber(day);
          if (Number.isNaN(d) || d < 1) setDay(pad2('01'));
          else if (d > maxForDec) setDay(pad2(String(maxForDec)));
          notifyIfValid(day, sm, String(effectiveYear), hour, minute);
          return;
        }
        const sm = pad2(String(m));
        const max = daysInMonth(effectiveYear, m);
        const d = toNumber(day);
        if (!Number.isNaN(d) && (d < 1 || d > max)) setDay(pad2(String(max)));
        setConfirmed('month', sm);
        notifyIfValid(day, sm, String(effectiveYear), hour, minute);
        return;
      }

      if (which === 'year') {
        if (year === '') {
          setYear(lastValidYearRef.current);
          notifyIfValid(day, month, lastValidYearRef.current, hour, minute);
          return;
        }
        const y = onlyDigits(year).slice(0, 4) || String(new Date().getFullYear());
        setConfirmed('year', y);
        const m = toNumber(month);
        const d = toNumber(day);
        if (!Number.isNaN(m) && m >= 1 && m <= 12 && !Number.isNaN(d)) {
          const max = daysInMonth(parseInt(y, 10), m);
          if (d < 1) setDay(pad2('01'));
          else if (d > max) setDay(pad2(String(max)));
        }
        notifyIfValid(day, month, y, hour, minute);
        return;
      }

      if (which === 'hour') {
        if (!showTime) return;
        if (hour === '') {
          setHour(lastValidHourRef.current);
          notifyIfValid(day, month, year, lastValidHourRef.current, minute);
          return;
        }
        const h = toNumber(hour);
        if (Number.isNaN(h)) {
          setHour(lastValidHourRef.current);
          notifyIfValid(day, month, year, lastValidHourRef.current, minute);
          return;
        }
        const sh = pad2(String(clamp(h, 0, 23)));
        setConfirmed('hour', sh);
        notifyIfValid(day, month, year, sh, minute);
        return;
      }

      if (which === 'minute') {
        if (!showTime) return;
        if (minute === '') {
          setMinute(lastValidMinuteRef.current);
          notifyIfValid(day, month, year, hour, lastValidMinuteRef.current);
          return;
        }
        const mi = toNumber(minute);
        if (Number.isNaN(mi)) {
          setMinute(lastValidMinuteRef.current);
          notifyIfValid(day, month, year, hour, lastValidMinuteRef.current);
          return;
        }
        const smi = pad2(String(clamp(mi, 0, 59)));
        setConfirmed('minute', smi);
        notifyIfValid(day, month, year, hour, smi);
        return;
      }
    },
    [day, month, year, hour, minute, notifyIfValid, onlyDigits, setConfirmed, showTime]
  );

  // arrow adjustments (stable identity)
  const adjustField = useCallback(
    (which: 'day' | 'month' | 'year' | 'hour' | 'minute', delta: number) => {
      if (which === 'day') {
        const max = getMaxDaysForCurrent();
        const current = toNumber(day);
        let next = Number.isNaN(current) ? (delta > 0 ? 1 : max) : current + delta;
        if (next < 1) next = max;
        if (next > max) next = 1;
        const sd = pad2(String(next));
        setConfirmed('day', sd);
        setTimeout(() => {
          dayRef.current?.focus();
          dayRef.current?.select();
          notifyIfValid(sd, month, year, hour, minute);
        }, 0);
        return;
      }
      if (which === 'month') {
        const current = toNumber(month);
        let next = Number.isNaN(current) ? (delta > 0 ? 1 : 12) : current + delta;
        if (next < 1) next = 12;
        if (next > 12) next = 1;
        const sm = pad2(String(next));
        setConfirmed('month', sm);
        setTimeout(() => {
          const max = getMaxDaysForCurrent();
          const d = toNumber(day);
          if (!Number.isNaN(d) && (d < 1 || d > max)) setDay(pad2(String(max)));
          monthRef.current?.focus();
          monthRef.current?.select();
          notifyIfValid(day, sm, year, hour, minute);
        }, 0);
        return;
      }
      if (which === 'year') {
        const current = toNumber(year);
        const base = Number.isNaN(current) ? new Date().getFullYear() : current;
        let next = base + delta;
        next = clamp(next, 0, 9999);
        const sy = String(next);
        setConfirmed('year', sy);
        setTimeout(() => {
          const max = getMaxDaysForCurrent();
          const d = toNumber(day);
          if (!Number.isNaN(d) && (d < 1 || d > max)) setDay(pad2(String(max)));
          yearRef.current?.focus();
          yearRef.current?.select();
          notifyIfValid(day, month, sy, hour, minute);
        }, 0);
        return;
      }
      if (which === 'hour') {
        const current = toNumber(hour);
        let next = Number.isNaN(current) ? (delta > 0 ? 0 : 23) : current + delta;
        if (next < 0) next = 23;
        if (next > 23) next = 0;
        const sh = pad2(String(next));
        setConfirmed('hour', sh);
        setTimeout(() => {
          hourRef.current?.focus();
          hourRef.current?.select();
          notifyIfValid(day, month, year, sh, minute);
        }, 0);
        return;
      }
      if (which === 'minute') {
        const current = toNumber(minute);
        let next = Number.isNaN(current) ? (delta > 0 ? 0 : 59) : current + delta;
        if (next < 0) next = 59;
        if (next > 59) next = 0;
        const smi = pad2(String(next));
        setConfirmed('minute', smi);
        setTimeout(() => {
          minuteRef.current?.focus();
          minuteRef.current?.select();
          notifyIfValid(day, month, year, hour, smi);
        }, 0);
        return;
      }
    },
    [day, month, year, hour, minute, getMaxDaysForCurrent, notifyIfValid, setConfirmed]
  );

  // keyboard navigation
  const handleKeyDown = useCallback(
    (
      prevRef?: React.RefObject<HTMLInputElement | null>,
      prevSetter?: React.Dispatch<React.SetStateAction<string>>
    ) =>
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        const t = e.currentTarget;
        const selStart = t.selectionStart ?? 0;
        const selEnd = t.selectionEnd ?? 0;

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const delta = e.key === 'ArrowUp' ? 1 : -1;
          if (t === dayRef.current) adjustField('day', delta);
          else if (t === monthRef.current) adjustField('month', delta);
          else if (t === yearRef.current) adjustField('year', delta);
          else if (showTime && t === hourRef.current) adjustField('hour', delta);
          else if (showTime && t === minuteRef.current) adjustField('minute', delta);
          return;
        }

        if (e.key === 'Backspace' && selStart === 0 && prevRef?.current) {
          e.preventDefault();
          prevRef.current.focus();
          if (prevSetter) prevSetter((s) => s.slice(0, -1));
          return;
        }

        if (e.key === 'ArrowLeft' && selStart === 0 && prevRef?.current) {
          e.preventDefault();
          prevRef.current.focus();
          return;
        }

        if (e.key === 'ArrowRight' && selEnd === (t.value?.length ?? 0)) {
          if (t === dayRef.current && monthRef.current) {
            monthRef.current.focus();
            monthRef.current.select();
            e.preventDefault();
          } else if (t === monthRef.current && yearRef.current) {
            yearRef.current.focus();
            yearRef.current.select();
            e.preventDefault();
          } else if (t === yearRef.current && showTime && hourRef.current) {
            hourRef.current.focus();
            hourRef.current.select();
            e.preventDefault();
          } else if (showTime && t === hourRef.current && minuteRef.current) {
            minuteRef.current.focus();
            minuteRef.current.select();
            e.preventDefault();
          }
        }
      },
    [adjustField, showTime]
  );

  // input IDs for accessibility if needed
  const idBase = useId();

  return (
    <div
      className="inline-flex items-center select-none"
      role="group"
      aria-labelledby={`${idBase}-label`}
    >
      <div
        className="inline-flex items-center select-none"
        role="group"
        aria-labelledby={`${idBase}-label`}
      >
        <Input
          ref={dayRef}
          id={`${idBase}-day`}
          inputMode="numeric"
          pattern="\\d*"
          value={day}
          onChange={handleChange(setDay, 2, monthRef)}
          onBlur={() => handleBlurPad('day')}
          onKeyDown={handleKeyDown(undefined, undefined)}
          onPaste={handlePaste}
          aria-label="Day"
          maxLength={2}
          className="m-0 h-6 w-5 p-0 text-center"
          disabled={dateReadonly}
        />
        <span className="relative -top-px px-0.5">/</span>
        <Input
          ref={monthRef}
          id={`${idBase}-month`}
          inputMode="numeric"
          pattern="\\d*"
          value={month}
          onChange={handleChange(setMonth, 2, yearRef)}
          onBlur={() => handleBlurPad('month')}
          onKeyDown={handleKeyDown(dayRef, setDay)}
          onPaste={handlePaste}
          aria-label="Month"
          maxLength={2}
          className="m-0 h-6 w-5 p-0 text-center"
          disabled={dateReadonly}
        />
        <span className="relative -top-px px-0.5">/</span>
        <Input
          ref={yearRef}
          id={`${idBase}-year`}
          inputMode="numeric"
          pattern="\\d*"
          value={year}
          onChange={handleChange(setYear, 4, showTime ? hourRef : undefined)}
          onBlur={() => handleBlurPad('year')}
          onKeyDown={handleKeyDown(monthRef, setMonth)}
          onPaste={handlePaste}
          aria-label="Year"
          maxLength={4}
          className="m-0 h-6 w-10 p-0 text-center"
          disabled={dateReadonly}
        />
      </div>

      {/* calendar popover */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            tabIndex={-1}
            variant="ghost"
            className="text-muted-foreground hover:bg-muted/30 mx-0 inline-flex h-1 w-1 items-center justify-center rounded text-xs"
            aria-label="Open calendar"
            onClick={(e) => {
              e.preventDefault();
              if (!dateReadonly) openCalendar();
            }}
            disabled={dateReadonly}
          >
            <ChevronDown className="h-1 w-1" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0" align="start" showArrow={false}>
          <div className="p-0">
            <Calendar
              selected={composeDate()}
              onSelect={handleCalendarSelect}
              mode="single"
              required
            />
          </div>
        </PopoverContent>
      </Popover>

      <AnimatePresence initial={false}>
        {showTime && (
          <motion.div
            key="time-fields"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={timeVariants}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="flex items-center overflow-hidden"
          >
            <span className="relative -top-px px-0.5"> </span>
            <Input
              ref={hourRef}
              id={`${idBase}-hour`}
              inputMode="numeric"
              pattern="\\d*"
              value={hour}
              onChange={handleChange(setHour, 2, minuteRef)}
              onBlur={() => handleBlurPad('hour')}
              onKeyDown={handleKeyDown(yearRef, setYear)}
              onPaste={handlePaste}
              aria-label="Hour"
              maxLength={2}
              className="m-0 h-6 w-5 p-0 text-center"
            />
            <span className="relative -top-px px-0.5">:</span>
            <Input
              ref={minuteRef}
              id={`${idBase}-minute`}
              inputMode="numeric"
              pattern="\\d*"
              value={minute}
              onChange={handleChange(setMinute, 2)}
              onBlur={() => handleBlurPad('minute')}
              onKeyDown={handleKeyDown(hourRef, setHour)}
              onPaste={handlePaste}
              aria-label="Minute"
              maxLength={2}
              className="m-0 h-6 w-5 p-0 text-center"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateInput;
