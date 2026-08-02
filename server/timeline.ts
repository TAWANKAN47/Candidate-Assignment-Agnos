import type { TimelineItem } from "../lib/session";

const maxTimelineItems = 20;
const dedupeMs = 3_000;
const neverDedupe = new Set<TimelineItem["field"]>(["status", "submit", "clear"]);

export function addOrUpdateTimeline(timeline: TimelineItem[], item: TimelineItem, now = Date.now()) {
  const latest = timeline[0];
  if (
    item.field &&
    !neverDedupe.has(item.field) &&
    latest?.field === item.field &&
    latest.text === item.text &&
    now - Date.parse(latest.at) <= dedupeMs
  ) {
    latest.at = item.at;
    return timeline.slice(0, maxTimelineItems);
  }
  return [item, ...timeline].slice(0, maxTimelineItems);
}

export const timelineLimit = maxTimelineItems;
