// Handlers for web requests

import express from 'express';

import {TasksResolution, WireDbFull, WireEntry} from './orgdata/Wire';
import {TodoStatus} from './orgdata/Entry';

import {parseEntry} from './orgdata/Parser';

import {connection, fulltextToEntry, topqueue, bury, setTodoStatus, bumpPriority, PriorityBump, addTask, replaceDb} from './db/Db';

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

/** Handle a request to set TODO state of a task. */
async function handleSetTaskTodo(req: express.Request, res: express.Response): Promise<void> {
  let todoStatus = TodoStatus.NONE;
  switch (req.query.todo) {
    case "todo":
      todoStatus = TodoStatus.TODO;
      break;
    case "done":
      todoStatus=TodoStatus.DONE;
      break;
  }

  setTodoStatus(req.params.taskid, todoStatus);
  res.sendStatus(200);
}

/** Handle a request to change priority of a task. */
async function handleChangeTaskPriority(req: express.Request, res: express.Response): Promise<void> {
  switch (req.query.priority) {
    case "topqueue":
      await topqueue(req.params.taskid);
      break;
    case "bury":
      await bury(req.params.taskid);
      break;
    case "up1":
      await bumpPriority(req.params.taskid, PriorityBump.HIGHER);
      break;
    case "down1":
      await bumpPriority(req.params.taskid, PriorityBump.LOWER);
      break;
    default:
      res.status(400).send(`Unrecognized priority parameter ${req.query.priority}`);
      return;
  }


  res.sendStatus(200);

}

/** Handle a post to a task with a specific ID. */
export async function handleTaskPost(req: express.Request, res: express.Response): Promise<void> {

  if (req.query.todo) {
    await handleSetTaskTodo(req, res);
    return;
  }

  if (req.query.priority) {
    await handleChangeTaskPriority(req, res);
    return;
  }

  res.status(400).send("One of 'priority' or 'todo' parameter required");
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
