import * as React from 'react';

import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';

const getWeekdayLabel = (date: Date, localeCode: string) => {
  const formatter = new Intl.DateTimeFormat(localeCode, { weekday: 'short' });
  const label = formatter.format(date);
  return label.length > 3 ? label.slice(0, 3) : label;
};
const localeCode = 'en-GB';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const defaultClassNames = getDefaultClassNames();

  // create components override that makes day buttons non-focusable and keeps valid table structure
  const safeDayComponents = {
    Day: (
      dayProps: React.HTMLAttributes<HTMLDivElement> & {
        disabled?: boolean;
        onClick?: React.MouseEventHandler<HTMLDivElement>;
        onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
        onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
        onFocus?: React.FocusEventHandler<HTMLDivElement>;
        onBlur?: React.FocusEventHandler<HTMLDivElement>;
        onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
      }
    ) => {
      // The Day component is rendered inside a <tr> by DayPicker.
      // Returning a <div> directly caused the "div cannot be child of tr" hydration error.
      // Render a <td> (valid child of <tr>) and place the interactive element inside it.
      // Use a non-<button> interactive wrapper (role="button") to avoid nested <button> issues.
      const {
        children,
        className,
        onClick,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        onKeyDown,
        disabled,
        style,
        'aria-label': ariaLabel,
        // keep other data-/aria- props for the <td>
        ...restForTd
      } = dayProps;

      return (
        <td {...restForTd} role="gridcell" style={style} className="p-0 align-top">
          <div
            className={className}
            role="button"
            tabIndex={-1} // keep out of tab order so calendar doesn't steal focus
            aria-disabled={disabled}
            aria-label={ariaLabel}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              // prevent unexpected focus side-effects while still forwarding the handler
              e.preventDefault();
              onFocus?.(e);
            }}
            onBlur={onBlur}
          >
            {children}
          </div>
        </td>
      );
    },
    ...components, // preserve any other overrides passed in props
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatWeekdayName: (date: Date) => getWeekdayLabel(date, localeCode),
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'long' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('flex gap-4 flex-col md:flex-row relative', defaultClassNames.months),
        month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
        nav: cn(
          'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between z-20',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex items-center justify-center h-(--cell-size) w-full',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn('relative rounded-md cursor-pointer', defaultClassNames.dropdown_root),
        dropdown: cn('absolute bg-popover inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
          defaultClassNames.caption_label
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none',
          defaultClassNames.weekday
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        week_number_header: cn('select-none w-(--cell-size)', defaultClassNames.week_number_header),
        week_number: cn(
          'text-[0.8rem] select-none text-muted-foreground',
          defaultClassNames.week_number
        ),
        day: cn(
          'relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-md'
            : '[&:first-child[data-selected=true]_button]:rounded-l-md',
          defaultClassNames.day
        ),
        today: cn(
          'text-accent-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside
        ),
        disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
          }

          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
          }

          return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
        },
        ...safeDayComponents,
      }}
      weekStartsOn={1} // Monday as the first day of the week
      // fixedWeeks
      defaultMonth={new Date()}
      startMonth={new Date(2024, 12)}
      endMonth={new Date(2101, 0)}
      {...props}
    />
  );
}

export default Calendar;
