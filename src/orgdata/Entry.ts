import {v4 as uuidv4} from 'uuid';

/** Org entries */

export enum TodoStatus {
  NONE = 1,
  TODO,
  DONE,
};

/** Properties that summarize an entry */
export interface EntryProperties {
  id: string;
  todo: TodoStatus;
  headline: string;
  deadline: Date | undefined;
  priority: number;
  firstBodyLine: number;  //< First line (0-index) of the body
  body: string;
}


/** A single Entry in the time tracker and its summary */
export interface Entry {
  summary: EntryProperties;
  fulltext: string; //< The full text of the entry, including headline.
}

export function newId(): string {
  // randomUUID only available in secure environments. Fall back to non-crypto UUID if not available.
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return uuidv4();
}

