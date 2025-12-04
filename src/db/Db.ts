/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {Entry, TodoStatus} from "../orgdata/Entry";
import {parse, parseEntry, setPriority, setTodoStatus as parseSetTodoStatus} from "../orgdata/Parser";
import * as sqlite from "sqlite";
import { Database } from "sqlite3";
import * as fs from "fs";

const DB_PATH = "/var/tasks.db";

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
  return parseEntry(fulltext.split("\n").map((line: string) => line + "\n"));
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

/** Move the specified entry to the top of the priority queue. */
export async function topqueue(entryId: string): Promise<void> {
  const db = await connection();

  const entryText = (await db.get("SELECT fulltext FROM tasks WHERE id=?", [entryId])).fulltext;

  const topPriority = (await db.get("SELECT priority FROM tasks ORDER BY priority ASC LIMIT 1")).priority;

  const entry = fulltextToEntry(entryText);

  setPriority(entry.fulltext, topPriority - 1);

  await db.run("UPDATE tasks SET priority=?, fulltext=? WHERE ID=?", [topPriority - 1, entry.fulltext.join(""), entryId]);
}

/** Set status of TODO on task */
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

  const topPriority = (await db.get("SELECT priority FROM tasks ORDER BY priority ASC LIMIT 1")).priority;

  const newPriority = topPriority - 1;

  setPriority(entry.fulltext, newPriority);

  await db.run("INSERT INTO tasks (id, priority, fulltext) VALUES (?,?,?)", [entry.summary.id, newPriority, entry.fulltext.join("")]);

}
