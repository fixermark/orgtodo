/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {Entry, TodoStatus} from "../orgdata/Entry";
import {WireDbFull, WireEntry} from '../orgdata/Wire';
import {
  fulltextToLines,
  parse,
  parseEntry,
  setPriority,
  setTodoStatus as parseSetTodoStatus
} from "../orgdata/Parser";
import * as sqlite from "sqlite";
import { Database } from "sqlite3";
import * as fs from "fs";

const DB_PATH = "/var/tasks.db";

const YEAR_2100_IN_MSEC = 4102444800000;

enum Priority {
  TOP = 1,
  BOTTOM,
}

export enum PriorityBump {
  HIGHER=1,
  LOWER,
}

export enum ViewSort {
  BY_PRIORITY=1,
  BY_DEADLINE,
}

export const TASK_COLUMN_NAMES = ['id', 'hash', 'epochUpdateMsecs', 'fulltext'];



/** Create an empty `tasks` table. */
export async function initTables(db: sqlite.Database) {
  // in db, deadline is Javascript-style msec since Epoch
    await db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      hash TEXT,
      epochUpdateMsecs INTEGER,
      fulltext TEXT
    )`);
    await db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY,
      epochUpdateMsecs INTEGER
    )`);
}

/** Get a connection to the database, creating the database if necessary. */
export async function connection(): Promise<sqlite.Database> {
  if (!fs.existsSync(DB_PATH)) {
    console.log("Creating new database and tasks table.");
    const db = await sqlite.open({filename: DB_PATH, driver: Database});
    await initTables(db);
  }

  return await sqlite.open({filename: DB_PATH, driver: Database});
}


/** Parse the full text of an entry into the entry. */
export function fulltextToEntry(fulltext: string): Entry {
  return parseEntry(fulltextToLines(fulltext));
}

/** Get all Entry from the database. */
export async function readEntries(sort: ViewSort = ViewSort.BY_PRIORITY, showDone: boolean): Promise<Entry[]> {
  const db = await connection();
  console.log(`showDone: ${showDone}`);
  const whereClause = showDone ? "" : "WHERE done <> TRUE";

  const ordering = sort === ViewSort.BY_PRIORITY ? 'priority' : `IFNULL(deadline, ${YEAR_2100_IN_MSEC})`;

  console.log(`Ordering by ${ordering}`);

  const query = `SELECT * FROM tasks ${whereClause} ORDER BY ${ordering} ASC`;

  console.log(`Query: ${query}`);

  const rows = await db.all(query);

  console.log(`Todos: ${rows.map((row) => row.done)}`);

  return rows.map((row) => fulltextToEntry(row.fulltext));
}

/** Replace full DB state with new state. */
export async function replaceDb(wireDb: WireDbFull): Promise<void> {
  const db = await connection();

  await db.run("DELETE FROM tasks");

  await db.run("DELETE FROM meta");

  await db.run("INSERT INTO meta (id, epochUpdateMsecs) VALUES (1, ?)", wireDb.epochUpdateMsecs);

  for (const entry of Object.values(wireDb.entries)) {
    await db.run("INSERT INTO tasks (id, fulltext, hash, epochUpdateMsecs) VALUES (?,?,?,?)", [
      entry.id,
      entry.fulltext,
      entry.hash,
      entry.epochUpdateMsecs,
    ]);
  }
}

/** Upsert TODO item into the DB if the expected hash is missing or matches existing hash.
 *
 * @param entry The entry to change or add
 * @param timestampMsecs Timestamp this change is being added in.
 * @param hash Hash from the client of the entry that was modified. There is a conflict
 *   if this does not match the current hash.
 * @returns Undefined on success. On conflict, returns the existing conflicted WireEntry.
 */
export async function upsertTodo(
  entry: WireEntry,
  timestampMsecs: number,
  hash: string | undefined
): Promise<WireEntry | undefined> {
  const db = await connection();

  const existing = await db.all('SELECT id, hash, epochUpdateMsecs, fulltext FROM tasks WHERE id=?', entry.id);

  if (existing.length) {
    if (hash && hash !== existing[0].hash) {
      // Conflict detected.
      return {
	id: existing[0].id,
	hash: existing[0].hash,
	epochUpdateMsecs: existing[0].epochUpdateMsecs,
	fulltext: existing[0].fulltext,
      };
    }
  }

  await db.run('INSERT OR REPLACE INTO tasks (id, hash, epochUpdateMsecs, fulltext) VALUES (?,?,?,?)', [
    entry.id,
    entry.hash,
    timestampMsecs,
    entry.fulltext,
  ]);
  await db.run('INSERT OR REPLACE INTO meta (id, epochUpdateMsecs) VALUES (1, ?)', [timestampMsecs]);

  return undefined;
}

/** Replace all entries in the database. */
export async function replaceEntries(entries: Entry[]): Promise<void> {
  const db = await connection();

  await db.run("DELETE from tasks");

  for (const entry of entries) {
    const deadline = entry.summary.deadline ? entry.summary.deadline.getTime() : "NULL";
    await db.run("INSERT INTO tasks (id, done, priority, deadline, fulltext) VALUES (?,?,?,?,?)", [
      entry.summary.id,
      entry.summary.todo === TodoStatus.DONE,
      entry.summary.priority,
      deadline,
      entry.fulltext
    ]);
  }
}

/** Get topmost or bottommost priority in the database */
async function getPriority(db: sqlite.Database, priority: Priority) {
  try {
    return (await db.get(`SELECT priority FROM tasks ORDER BY priority ${priority===Priority.TOP ? "ASC" : "DESC"} LIMIT 1`)).priority;
  } catch(e) {
    console.warn(`Error fetching priority: ${e}`);
    // If we catch an error here, just send back 0.
    return 1;
  }
}

/** Move the specified entry to the top of the priority queue. */
export async function topqueue(entryId: string): Promise<void> {
  console.log("Trying to topqueue...");
  const db = await connection();

  const entryText = (await db.get("SELECT fulltext FROM tasks WHERE id=?", [entryId])).fulltext;

  const topPriority = await getPriority(db, Priority.TOP);
  console.log(`topPriority is ${topPriority}`);

  const entry = fulltextToEntry(entryText);

  entry.fulltext = setPriority(entry.fulltext, topPriority - 1);

  await db.run("UPDATE tasks SET priority=?, fulltext=? WHERE ID=?", [topPriority - 1, entry.fulltext, entryId]);
}

/** Move the specified entry to the bottom of the priority queue. */
export async function bury(entryId: string): Promise<void> {
  const db = await connection();

  const entryText = (await db.get("SELECT fulltext FROM tasks WHERE id=?", [entryId])).fulltext;

  const bottomPriority = await getPriority(db, Priority.BOTTOM);
  console.log(`bottomPriority is ${bottomPriority}`);

  const entry = fulltextToEntry(entryText);

  entry.fulltext = setPriority(entry.fulltext, bottomPriority + 1);

  await db.run("UPDATE tasks SET priority=?, fulltext=? WHERE ID=?", [bottomPriority + 1, entry.fulltext, entryId]);
}

function swapAndCollapsePriorities(first: number, second: number): [number, number] {
  if (first < 0 && second > 0) {
    first = 0;
    second = 1;
  } else if (second < 0 && first > 0) {
    second = 0;
    first = 1;
  }
  else if (first < 0) {
    if (first < second) {
      first = second - 1;
    } else {
      second = first - 1;
    }
  } else {  // first > 0
    if (first < second) {
      second = first + 1;
    } else {
      first = second + 1;
    }
  }

  return [second, first];
}

/** Bump priority (move higher or move lower) */
export async function bumpPriority(entryId: string, direction: PriorityBump): Promise<void> {
  const db = await connection();
  const entryPriority = (await db.get("SELECT priority FROM tasks WHERE id=?", [entryId])).priority;

  const tweakDirection = direction == PriorityBump.LOWER ? "ASC" : "DESC";
  const tweakComparison = direction == PriorityBump.LOWER ? ">=" : "<=";

  const entryAndNeighbor = (await db.all(`SELECT id, priority, fulltext FROM tasks WHERE priority ${tweakComparison} ? ORDER BY priority ${tweakDirection} LIMIT 2`, [entryPriority]));

  if (entryAndNeighbor.length === 1) {
    // There was no other entry higher / lower than this one; we're already sorted.
    return;
  }

  if (entryAndNeighbor.length !== 2) {
    throw Error(`Expected 2 values for entry and neighbor, saw ${entryAndNeighbor.length}`);
  }

  const [entry, neighbor] = entryAndNeighbor;

  const [newEntryPriority, newNeighborPriority] = swapAndCollapsePriorities(entry.priority, neighbor.priority);

  const updatedEntry = setPriority(entry.fulltext, newEntryPriority);
  const updatedNeighbor = setPriority(neighbor.fulltext, newNeighborPriority);

  await db.run("UPDATE tasks SET priority=?, fulltext=? where id=?", [newEntryPriority, updatedEntry, entry.id]);
  await db.run("UPDATE tasks SET priority=?, fulltext=? where id=?", [newNeighborPriority, updatedNeighbor, neighbor.id]);
}


/** Set Status of TODO on task */
export async function setTodoStatus(entryId: string, status: TodoStatus): Promise<void> {
  const db = await connection();

  const entryText = (await db.get("SELECT fulltext FROM tasks WHERE id=?", [entryId])).fulltext;

  const entry = fulltextToEntry(entryText);

  entry.fulltext = parseSetTodoStatus(entry.fulltext, status);

  console.log(`Setting id ${entryId} to status ${status === TodoStatus.DONE}`);

  await db.run("UPDATE tasks SET done=?, fulltext=? WHERE ID=?", [status === TodoStatus.DONE, entry.fulltext, entryId]);
}

/** Add new entry at topqueue location. */
export async function addTask(entry: Entry): Promise<void> {
  const db = await connection();

  const topPriority = await getPriority(db, Priority.TOP);

  const newPriority = topPriority - 1;

  setPriority(entry.fulltext, newPriority);

  const deadline = entry.summary.deadline ? entry.summary.deadline.getTime() : "NULL";
  await db.run("INSERT INTO tasks (id, done, priority, deadline, fulltext) VALUES (?,?,?,?,?)", [
    entry.summary.id,
    entry.summary.todo === TodoStatus.DONE,
    newPriority,
    deadline,
    entry.fulltext
  ]);

}
