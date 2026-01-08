/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import { WireDbFull, WireEntryUnhashed } from "./Wire";
import { fulltextToLines, parseEntry, setPriority } from "./Parser";
import { Entry } from "./Entry";

export type PriorityOperations = "topqueue" | "up1" | "down1" | "bury";

/** Reorder the specified task in the store. This may cause other tasks to also be reordered.*/
export function reorderTask(
  store: WireDbFull,
  id: string,
  operation: PriorityOperations,
): WireEntryUnhashed[] {
  switch (operation) {
    case "topqueue":
      return moveTaskToEnd(store, id, Math.min, -1);
      break;
    case "bury":
      return moveTaskToEnd(store, id, Math.max, 1);
      break;
    case "down1":
      return moveTaskPast(store, id, 1);
      break;
    case "up1":
      return moveTaskPast(store, id, -1);
      break;
    default:
      throw new Error(`Operation ${operation} not yet implemented.`);
      break;
  }
}

/** Move task to either beginning or end of task list.
 *
 * @param store All task entries.
 * @param id ID of task to move to beginning or end.
 * @param reducer Function to find lowest or highest ordering index of tasks.
 * @param modifier Amount to add to task priority to set it to end of list.
 *
 * @returns The task to modify.
 */
function moveTaskToEnd(
  store: WireDbFull,
  id: string,
  reducer: (accum: number, value: number) => number,
  modifier: number,
): WireEntryUnhashed[] {
  const entryPriorities = Object.values(store.entries).map(
    (entry) => parseEntry(fulltextToLines(entry.fulltext)).summary.priority,
  );
  // We wrap the reducer in a binary function here because reduce actually passes in more than
  // two arguments. A function like Math.min will catch those spare args and do the wrong thing
  // with them.
  const targetValue = entryPriorities.reduce((x, y) => reducer(x, y));
  const newPriority = targetValue + modifier;

  const entryToChange = store.entries[id];

  if (!entryToChange) {
    throw new Error(`Unable to find ${id} in entries.`);
  }

  entryToChange.fulltext = setPriority(entryToChange.fulltext, newPriority);
  return [entryToChange];
}

/** Moves the specified task past the one adjacent to it and collapses their priorities to be sequential.
 *
 * @param store Full task store.
 * @param id ID of task to move past the next task.
 * @param collapseDirection 1 if pushing task to higher priority number, -1 if pushing task to lower priority number.
 *
 * @returns All the tasks to modify.
 */
function moveTaskPast(
  store: WireDbFull,
  id: string,
  collapseDirection: number,
): WireEntryUnhashed[] {
  const byPriorities = Object.values(store.entries).map((entry) =>
    parseEntry(fulltextToLines(entry.fulltext)),
  );

  const sorter =
    collapseDirection > 0
      ? (a: Entry, b: Entry) => a.summary.priority - b.summary.priority
      : (a: Entry, b: Entry) => b.summary.priority - a.summary.priority;
  byPriorities.sort(sorter);

  const myIndex = byPriorities.findIndex((entry) => entry.summary.id === id);
  if (typeof myIndex === "undefined" || myIndex == byPriorities.length - 1) {
    // Either I'm not in the list or I'm already at the end; nothing to do here.
    return [];
  }

  const me = byPriorities[myIndex];
  const neighbor = byPriorities[myIndex + 1];

  let myNewPriority = neighbor.summary.priority;
  let neighborNewPriority = me.summary.priority;

  // Reset priorities to drag them as close to 0 as possible.
  if (
    (myNewPriority < 0 && neighborNewPriority > 0) ||
    (myNewPriority > 0 && neighborNewPriority < 0)
  ) {
    neighborNewPriority = 0;
  }
  myNewPriority = neighborNewPriority + collapseDirection;

  return [
    {
      id: me.summary.id,
      fulltext: setPriority(me.fulltext, myNewPriority),
    },
    {
      id: neighbor.summary.id,
      fulltext: setPriority(neighbor.fulltext, neighborNewPriority),
    },
  ];
}
