import * as React from 'react';

import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type IconSlotProps = React.HTMLAttributes<HTMLSpanElement> & {
  children?: React.ReactNode;
};

export const StartIcon: React.FC<IconSlotProps> = ({ children, ...props }) => {
  // marker component - Input will extract and render this content in the proper slot
  return <span {...props}>{children}</span>;
};

export const EndIcon: React.FC<IconSlotProps> = ({ children, ...props }) => {
  // marker component - Input will extract and render this content in the proper slot
  return <span {...props}>{children}</span>;
};

type InputProps = React.ComponentProps<'input'> & {
  containerClassName?: string;
  children?: React.ReactNode;
  /**
   * show a builtin clear (X) button at the end of the input
   */
  clearable?: boolean;
  /**
   * show a builtin search icon; 'start' | 'end'
   */
  searchPosition?: 'start' | 'end';
  /**
   * optional callback when clear is activated
   */
  onClear?: () => void;
  /**
   * focus the input when it mounts
   */
  autofocus?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      containerClassName,
      children,
      clearable,
      searchPosition,
      onClear,
      autofocus,
      ...props
    },
    ref
  ) => {
    const childrenArray = React.Children.toArray(children);

    const startChild = childrenArray.find(
      (c) => React.isValidElement(c) && c.type === StartIcon
    ) as React.ReactElement<IconSlotProps> | undefined;

    const endChild = childrenArray.find((c) => React.isValidElement(c) && c.type === EndIcon) as
      | React.ReactElement<IconSlotProps>
      | undefined;

    // internal ref so we can focus / clear programmatically, and also forward ref
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = (el: HTMLInputElement | null) => {
      internalRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    // preserve user-provided onFocus and ensure input content is selected on focus
    const userOnFocus = props.onFocus;
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      userOnFocus?.(e);
      // schedule selection to avoid race conditions with focus/animation
      setTimeout(() => internalRef.current?.select(), 0);
    };

    // if autofocus prop set, ensure the input is focused when mounted
    React.useEffect(() => {
      if (autofocus && internalRef.current) {
        // small timeout to avoid race with animations / mount ordering
        const t = setTimeout(() => internalRef.current?.focus(), 0);
        return () => clearTimeout(t);
      }
    }, [autofocus]);

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        // try to call controlled onChange with empty value, if provided
        const onChange = props.onChange;
        if (typeof onChange === 'function') {
          // synthesize an event-like object
          onChange({
            target: { value: '' } as EventTarget & HTMLInputElement,
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }
      // clear the native value and focus
      if (internalRef.current) {
        internalRef.current.value = '';
        internalRef.current.focus();
        // dispatch input event in case consumers rely on native events
        const ev = new Event('input', { bubbles: true });
        internalRef.current.dispatchEvent(ev);
      }
    };

    const showStartSearch = searchPosition === 'start';
    const showEndSearch = searchPosition === 'end';

    const inputClass = cn(
      'file:text-foreground',
      'placeholder:text-muted-foreground',
      'selection:bg-primary',
      'selection:text-primary-foreground',
      'dark:bg-input/30',
      'h-9',
      'w-full',
      'min-w-0',
      'bg-transparent',
      'py-1',
      'text-base',
      'shadow-none',
      'transition-[color,box-shadow]',
      'outline-none',
      'file:inline-flex',
      'file:h-7',
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium',
      'disabled:pointer-events-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'md:text-sm',
      'focus-visible:none',
      'aria-invalid:ring-destructive/20',
      'dark:aria-invalid:ring-destructive/40',
      'aria-invalid:border-destructive',
      // adjust padding when icons present
      startChild || showStartSearch ? 'pl-9' : 'px-3',
      endChild || showEndSearch || clearable ? 'pr-9' : undefined,
      className
    );

    return (
      <div className={cn('relative flex w-full items-center', containerClassName)}>
        {/* Start icon: either user-provided StartIcon child, or builtin search */}
        {startChild && (
          <span
            className={cn(
              'absolute top-0 bottom-0 left-2 flex items-center',
              'text-muted-foreground pointer-events-auto'
            )}
            {...(startChild.props || {})}
          >
            {startChild.props?.children}
          </span>
        )}

        {!startChild && showStartSearch && (
          <span className="text-muted-foreground pointer-events-none absolute top-0 bottom-0 left-2 flex items-center">
            <Search className="h-4 w-4" />
          </span>
        )}

        <input
          ref={setRefs}
          type={type}
          {...props}
          onFocus={handleFocus}
          data-slot="input"
          className={inputClass}
          autoComplete="off"
          data-lpignore="true"
          data-gramm="false"
        />

        {/* End icon: user-provided EndIcon, builtin search, or clear button */}
        {endChild && (
          <span
            className={cn(
              'absolute top-0 right-2 bottom-0 flex items-center',
              'text-muted-foreground pointer-events-auto'
            )}
            {...(endChild.props || {})}
          >
            {endChild.props?.children}
          </span>
        )}

        {!endChild && showEndSearch && (
          <span className="text-muted-foreground pointer-events-none absolute top-0 right-2 bottom-0 flex items-center">
            <Search className="h-4 w-4" />
          </span>
        )}

        {!endChild && clearable && (
          <button
            type="button"
            onClick={handleClear}
            // prevent the button from receiving keyboard focus
            tabIndex={-1}
            // prevent mouse down from moving focus to the button
            onMouseDown={(e) => e.preventDefault()}
            className="text-muted-foreground absolute top-0 right-2 bottom-0 flex items-center p-1 focus:ring-0 focus:outline-none"
            aria-label="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
