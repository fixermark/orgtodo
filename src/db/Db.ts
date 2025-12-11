/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {Entry, TodoStatus} from "../orgdata/Entry";
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

enum Priority {
  TOP = 1,
  BOTTOM,
}

export enum PriorityBump {
  HIGHER=1,
  LOWER,
}

/** Get a connection to the database, creating the database if necessary. */
async function connection(): Promise<sqlite.Database> {
  if (!fs.existsSync(DB_PATH)) {
    console.log("Creating new database and tasks table.");
    const db = await sqlite.open({filename: DB_PATH, driver: Database});
    await db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id STRING PRIMARY KEY,
      priority INT,
      fulltext STRING
    )`);
  }

  return await sqlite.open({filename: DB_PATH, driver: Database});
}


/** Parse the full text of an entry into the entry. */
export function fulltextToEntry(fulltext: string): Entry {
  return parseEntry(fulltextToLines(fulltext));
}

/** Get all Entry from the database. */
export async function readEntries(): Promise<Entry[]> {
  const db = await connection();

  const rows = await db.all('SELECT * FROM tasks ORDER BY priority ASC');

  return rows.map((row) => fulltextToEntry(row.fulltext));
}

/** Replace all entries in the database. */
export async function replaceEntries(entries: Entry[]): Promise<void> {
  const db = await connection();

  await db.run("DELETE from tasks");

  for (const entry of entries) {
    await db.run("INSERT INTO tasks (id, priority, fulltext) VALUES (?,?,?)", [entry.summary.id, entry.summary.priority, entry.fulltext.join("")]);
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

  setPriority(entry.fulltext, topPriority - 1);

  await db.run("UPDATE tasks SET priority=?, fulltext=? WHERE ID=?", [topPriority - 1, entry.fulltext.join(""), entryId]);
}

/** Move the specified entry to the bottom of the priority queue. */
export async function bury(entryId: string): Promise<void> {
  const db = await connection();

  const entryText = (await db.get("SELECT fulltext FROM tasks WHERE id=?", [entryId])).fulltext;

  const bottomPriority = await getPriority(db, Priority.BOTTOM);
  console.log(`bottomPriority is ${bottomPriority}`);

  const entry = fulltextToEntry(entryText);

  setPriority(entry.fulltext, bottomPriority + 1);

  await db.run("UPDATE tasks SET priority=?, fulltext=? WHERE ID=?", [bottomPriority + 1, entry.fulltext.join(""), entryId]);
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

  const entryLines = fulltextToLines(entry.fulltext);
  const neighborLines = fulltextToLines(neighbor.fulltext);
  setPriority(entryLines, newEntryPriority);
  setPriority(neighborLines, newNeighborPriority);

  await db.run("UPDATE tasks SET priority=?, fulltext=? where id=?", [newEntryPriority, entryLines.join(""), entry.id]);
  await db.run("UPDATE tasks SET priority=?, fulltext=? where id=?", [newNeighborPriority, neighborLines.join(""), neighbor.id]);
}


/** Set Status of TODO on task */
export async function setTodoStatus(entryId: string, status: TodoStatus): Promise<void> {
  const db = await connection();

  const entryText = (await db.get("SELECT fulltext FROM tasks WHERE id=?", [entryId])).fulltext;

  const entry = fulltextToEntry(entryText);

  parseSetTodoStatus(entry.fulltext, status);

  await db.run("UPDATE tasks SET fulltext=? WHERE ID=?", [entry.fulltext.join(""), entryId]);
}

/** Add new entry at topqueue location. */
export async function addTask(entry: Entry): Promise<void> {
  const db = await connection();

  const topPriority = await getPriority(db, Priority.TOP);

  const newPriority = topPriority - 1;

  setPriority(entry.fulltext, newPriority);

  await db.run("INSERT INTO tasks (id, priority, fulltext) VALUES (?,?,?)", [entry.summary.id, newPriority, entry.fulltext.join("")]);

}
