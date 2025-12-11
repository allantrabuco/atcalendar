import type { Modifier } from '@dnd-kit/core';
import type { RefObject } from 'react';

export const restrictToTable = (tableRef: RefObject<HTMLElement | null>): Modifier => {
  return ({ transform, draggingNodeRect }) => {
    const tableRect = tableRef.current?.getBoundingClientRect();
    if (!draggingNodeRect || !tableRect) {
      return transform;
    }

    const minX = tableRect.left - draggingNodeRect.left;
    const minY = tableRect.top - draggingNodeRect.top;
    const maxX = tableRect.right - draggingNodeRect.right;
    const maxY = tableRect.bottom - draggingNodeRect.bottom;

    let x = transform.x;
    let y = transform.y;

    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    if (y < minY) y = minY;
    if (y > maxY) y = maxY;

    return { ...transform, x, y };
  };
};
