import {WireDbFull, WireEntry} from './Wire';
import {fulltextToLines, parseEntry, setPriority} from './Parser';

export type PriorityOperations = "topqueue" | "up1" | "down1" | "bury";


/** Reorder the specified task in the store. This may cause other tasks to also be reordered.*/
export function reorderTask(store: WireDbFull, id: string, operation: PriorityOperations): WireEntry[]{
  switch(operation) {
    case "topqueue":
      return moveTaskToEnd(store, id, Math.min, -1);
      break;
    case "bury":
      return moveTaskToEnd(store, id, Math.max, 1);
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
  modifier: number
): WireEntry[] {
  const entryPriorities = Object.values(store.entries).map((entry) => parseEntry(fulltextToLines(entry.fulltext)).summary.priority);
  // We wrap the reducer in a binary function here because reduce actually passes in more than
  // two arguments. A function like Math.min will catch those spare args and do the wrong thing
  // with them.
  const targetValue = entryPriorities.reduce((x,y) => reducer(x,y));
  const newPriority = targetValue + modifier;

  const entryToChange = store.entries[id];

  if (!entryToChange) {
    throw new Error(`Unable to find ${id} in entries.`);
  }

  entryToChange.fulltext = setPriority(entryToChange.fulltext, newPriority);
  return [entryToChange];
}
