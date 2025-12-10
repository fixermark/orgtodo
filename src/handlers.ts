// Handlers for web requests

import express from 'express';

import {TodoStatus} from './orgdata/Entry';

import {parseEntry} from './orgdata/Parser';

import {fulltextToEntry, topqueue, bury, setTodoStatus, bumpPriority, PriorityBump, addTask} from './db/Db';

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

/** Handle creating a new task. */
export async function handleNewTask(req: express.Request, res: express.Response): Promise<void> {
  const entry = fulltextToEntry(req.body);

  await addTask(entry);

  res.sendStatus(200);
}
