import { CELL_HEIGHT } from './constants';

// Types for snapToQuarterHour
export type Transform = {
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
};

export type SnapTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

export type TSnapToQuarterHour = (args: {
  transform?: Transform | null;
  columnSize: number;
  getScrollCorrection?: () => { x: number; y: number };
}) => SnapTransform;

const snapToQuarterHour: TSnapToQuarterHour = ({ transform, columnSize, getScrollCorrection }) => {
  if (!transform) {
    // Return a default transform if not provided
    return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  }

  const correction = getScrollCorrection ? getScrollCorrection() : { x: 0, y: 0 };

  // We want to snap to the grid which might have moved by `correction.y`.
  // The grid lines are at `k * CELL_HEIGHT - correction.y`.
  // So we want `y_snapped + correction.y` to be a multiple of CELL_HEIGHT.
  const y = Math.round((transform.y + correction.y) / CELL_HEIGHT) * CELL_HEIGHT - correction.y;

  return {
    ...transform,
    x: Math.round(transform.x / columnSize) * columnSize,
    y,
    scaleX: transform.scaleX ?? 1,
    scaleY: transform.scaleY ?? 1,
  };
};

export default snapToQuarterHour;
