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
  body: string;
}


/** A single Entry in the time tracker and its summary */
export interface Entry {
  summary: EntryProperties;
  fulltext: string; //< The full text of the entry, including headline.
}

export function newId(): string {
  return crypto.randomUUID();
}

