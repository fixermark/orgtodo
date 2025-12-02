/** Org entries */

/** Properties that summarize an entry */
export interface EntryProperties {
  id: string;
  headline: string;
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

