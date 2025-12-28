/** Formats for data on-wire */

/** Summary of an entry, suitable for determining whether it's synced across local and db */
export interface WireEntrySummary {
  id: string;
  hash: string;
  epochUpdateMsecs: number;
}

/** Full wire entry, storable to db */
export interface WireEntry extends WireEntrySummary {
  fulltext: string;
}

/** State needed to determine if db is synchronized */
export interface WireDbUpdate {
  epochUpdateMsecs: number;
}

/** State needed to sync local and remote DB when out of date */
export interface WireDbSummary extends WireDbUpdate {
  summaries: WireEntrySummary[];
}

/** Full database state */
export interface WireDbFull extends WireDbUpdate {
  entries: Record<string, WireEntry>;
}

/** Request full entries for specific entry IDs */
export interface FullEntryRequest {
  ids: string[];
}



