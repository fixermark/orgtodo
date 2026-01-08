/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

/* Handlers for web requests */

import express from 'express';

import {TasksResolution, WireEntry} from './orgdata/Wire';

import {connection, fulltextToEntry, addTask, replaceDb, upsertTodo} from './db/Db';

/** Handle fetching the tasks table state */
export async function handleTasksGet(req: express.Request, res: express.Response): Promise<void> {

  console.log("*****");
  console.log(`Request /tasks: ${req.query.resolution}`);

  let resolution: TasksResolution = "full";
  if (req.query.resolution) {
    resolution = req.query.resolution as TasksResolution;
  }

  let dbModifiedMsec = 0;

  const db = await connection();

  const meta = await db.all('SELECT epochUpdateMsecs from meta where id=1');

  if (meta.length) {
    dbModifiedMsec = meta[0].epochUpdateMsecs;
  }

  const response: any = {
    epochUpdateMsecs: dbModifiedMsec,
  };

  if (resolution == "update") {
    res.json(response);
    return;
  }

  if (resolution == "summary") {
    const entries = await db.all('SELECT id, hash, epochUpdateMsecs from tasks');
    response.summaries = entries.map((entry) => {
      return {
	id: entry.id,
	hash: entry.hash,
	epochUpdateMsecs: entry.epochUpdateMsecs,
      };
    });

  } else {  // full and all other values
    console.log("Retrieving FULL data");
    const entries = await db.all('SELECT id, hash, epochUpdateMsecs, fulltext from tasks');
    console.log(`Entry count: ${entries.length}`);
    response.entries = {};
    for (const entry of entries) {
      response.entries[entry.id] = {
	id: entry.id,
	hash: entry.hash,
	epochUpdateMsecs: entry.epochUpdateMsecs,
	fulltext: entry.fulltext,
      };
    }
  }
  res.json(response);
}

/** Handle a post to a task with a specific ID. */
export async function handleTaskPost(req: express.Request, res: express.Response): Promise<void> {

  const task = JSON.parse(req.body) as WireEntry;

  const now = new Date().valueOf();

  const oldHash = req.query.oldhash;

  const maybeWireEntry = await upsertTodo(task, now, oldHash as string | undefined);

  if (maybeWireEntry) {
    console.warn(`Entry ${maybeWireEntry.id}: Hash of ${maybeWireEntry.hash} does not match ${oldHash}; sending 409.`);
    // old hash didn't align with the currently-stored hash value so the upsert was rejected.
    // 409 conflict this change with a copy of the in-database entry.
    res.status(409).json(maybeWireEntry);
    return;
  }

  res.sendStatus(200);
}

/** Handle replacing all tasks with a new list of tasks. */
export async function handleTaskPut(req: express.Request, res: express.Response): Promise<void> {
  // TDOO: augment this to take a previous modification timestamp so we can check CONFLICT
  // on full replace.
  console.log("Replacing full DB with new DB...");
  const db = JSON.parse(req.body);

  replaceDb(db);

  res.sendStatus(200);
}

/** Handle creating a new task. */
export async function handleNewTask(req: express.Request, res: express.Response): Promise<void> {
  const entry = fulltextToEntry(req.body);

  await addTask(entry);

  res.sendStatus(200);
}
