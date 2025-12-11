import type { TCalendarEvent } from '@/types/Calendar';

export interface EventLayout {
  width: number; // percentage 0-100
  left: number; // percentage 0-100
}

/**
 * Calculates the layout for a list of events, handling overlaps.
 * Returns a map of event ID to layout properties (width, left).
 */
export function layoutEvents(events: TCalendarEvent[]): Record<string, EventLayout> {
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.start || !b.start) return 0;
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    const durationA = (a.end?.getTime() ?? 0) - a.start.getTime();
    const durationB = (b.end?.getTime() ?? 0) - b.start.getTime();
    return durationB - durationA;
  });

  const layoutMap: Record<string, EventLayout> = {};
  if (sortedEvents.length === 0) return layoutMap;

  const clusters: TCalendarEvent[][] = [];
  let currentCluster: TCalendarEvent[] = [];
  let clusterEnd = -1;

  for (const event of sortedEvents) {
    const eventStart = event.start?.getTime() ?? 0;
    const eventEnd = event.end?.getTime() ?? 0;

    if (currentCluster.length === 0) {
      currentCluster.push(event);
      clusterEnd = eventEnd;
      continue;
    }

    if (eventStart < clusterEnd) {
      currentCluster.push(event);
      if (eventEnd > clusterEnd) {
        clusterEnd = eventEnd;
      }
    } else {
      clusters.push(currentCluster);
      currentCluster = [event];
      clusterEnd = eventEnd;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  for (const cluster of clusters) {
    layoutCluster(cluster, layoutMap);
  }

  return layoutMap;
}

/**
 * Layouts a single cluster of overlapping events.
 * Uses a "column packing" strategy.
 */
function layoutCluster(cluster: TCalendarEvent[], layoutMap: Record<string, EventLayout>) {
  const columns: TCalendarEvent[][] = [];

  for (const event of cluster) {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const lastEventInColumn = column[column.length - 1];

      if ((event.start?.getTime() ?? 0) >= (lastEventInColumn.end?.getTime() ?? 0)) {
        column.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([event]);
    }
  }

  const numColumns = columns.length;
  const width = 100 / numColumns;

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    for (const event of column) {
      layoutMap[event.id] = {
        width: width,
        left: i * width,
      };
    }
  }
}
