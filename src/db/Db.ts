/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {Entry} from "../orgdata/Entry";
import {parse, parseEntry} from "../orgdata/Parser";
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
      fulltext STRING
    )`);
  }

  return await sqlite.open({filename: DB_PATH, driver: Database});
}

/** Get all Entry from the database. */
export async function readEntries(): Promise<Entry[]> {
  const db = await connection();

  const rows = await db.all('SELECT * from tasks');

  return rows.map((row) => parseEntry(row.fulltext.split("\n").map((line: string) => line + "\n")));
}

/** Replace all entries in the database. */
export async function replaceEntries(entries: Entry[]): Promise<void> {
  const db = await connection();

  await db.run("DELETE from tasks");

  for (const entry of entries) {
    await db.run("INSERT INTO tasks (id, fulltext) VALUES (?,?)", [entry.summary.id, entry.fulltext]);
  }
}
