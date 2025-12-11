import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Check, ChevronDown } from 'lucide-react';

import { Button } from '../ui/button';
import { useViewBy } from './Provider';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

// Define allowed view types used across the component.
type ViewBy = 'day' | 'week' | 'month' | 'year';
const timeRanges: ViewBy[] = ['day', 'week', 'month', 'year'];

/**
 * ViewBy
 *
 * Responsive control that switches between a compact dropdown on small screens
 * and a segmented button group on larger screens.
 *
 * - Uses React 19's useEffectEvent to provide a stable resize handler identity.
 * - Memoizes derived values and subtrees to avoid unnecessary re-renders.
 */
const ViewByBar: React.FC = () => {
  const { viewBy, setViewBy } = useViewBy();

  // Track whether the viewport is considered "small" for responsive UI.
  const [isSmall, setIsSmall] = useState<boolean>(() => {
    // Initialize from current window width (safe in browser environments).
    return typeof window !== 'undefined' ? window.innerWidth <= 930 : false;
  });

  // Stable resize handler
  const handleResize = useCallback(() => {
    setIsSmall(window.innerWidth <= 930);
  }, []);

  // Attach/detach resize listener. The handler identity from useEvent is stable so
  // it's safe to include in dependencies.
  useEffect(() => {
    // Run once to ensure initial state is accurate? No, useState initializer handles it.
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Capitalized label for the trigger/button text derived from viewBy.
  const currentLabel = useMemo(() => viewBy.charAt(0).toUpperCase() + viewBy.slice(1), [viewBy]);

  // Memoized dropdown subtree to avoid rebuilding when unrelated state changes.
  const dropdown = useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default-rounded" size="sm" className="px-2" aria-label="Change view">
            {currentLabel}
            <span className="ml-0">
              <ChevronDown />
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          className="z-50 w-30 rounded border border-(--color-sidebar-border) bg-(--left-background) p-2 text-sm font-extralight"
        >
          {timeRanges.map((range) => (
            <DropdownMenuItem
              key={range}
              onClick={() => setViewBy(range)}
              className="focus:bg--primary focused-menu-item flex cursor-pointer items-center justify-between py-1 focus:text-white"
            >
              {viewBy === range ? (
                <Check className="check-icon stroke-foreground mr-2 h-4 w-4" />
              ) : (
                <span className="mr-2 w-4" />
              )}
              <span className="flex-1">{range.charAt(0).toUpperCase() + range.slice(1)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [currentLabel, viewBy, setViewBy]
  );

  // Memoized button group for larger screens.
  const buttonGroup = useMemo(
    () => (
      <div className="hover:bg-accent hover:text-foreground flex items-center gap-0 rounded text-(--button-group-text-default-colour)">
        {timeRanges.map((range, idx) => (
          <div
            key={range}
            className={
              idx < timeRanges.length - 1 && [timeRanges[idx], timeRanges[idx + 1]].includes(viewBy)
                ? 'border-r border-transparent'
                : idx < timeRanges.length - 1
                  ? 'border-r border-r-(--button-group-separator)'
                  : ''
            }
          >
            <Button
              variant={viewBy === range ? 'default-rounded' : 'ghost'}
              size="menu"
              onClick={() => setViewBy(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          </div>
        ))}
      </div>
    ),
    [viewBy, setViewBy]
  );

  // Choose appropriate UI based on viewport size.
  return isSmall ? dropdown : buttonGroup;
};

export default memo(ViewByBar);
