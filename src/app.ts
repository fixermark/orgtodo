/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import express from 'express';
import path from 'path';
import 'process';
import { readEntries, replaceEntries, topqueue} from './db/Db';
import { parse } from './orgdata/Parser';

const server = express();
server.use(express.text({type: "*/*"}));

const frontendJsPath = path.resolve(__dirname, '.');
const frontendPublicPath = path.resolve(__dirname, '../public');

server.use(express.static((frontendJsPath)));

server.use("/public", express.static((frontendPublicPath)));

server.post("/tasks/:taskid", async (req,res) => {
  if (!req.query.priority) {
    res.status(400).send("'priority' parameter required");
    return
  }
  if (req.query.priority !== "topqueue") {
    res.status(400).send(`Unrecognized priority parameter ${req.query.priority}`);
    return
  }

  await topqueue(req.params.taskid);

  res.sendStatus(200);
});

server.get("/tasks", async (req, res) => {
  const entries = await readEntries();

  res.json(entries);
});

server.put("/tasks", express.text(), async (req, res) => {
  const entries = parse(req.body);

  replaceEntries(entries);

  res.sendStatus(200);
});

server.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public/index.html"));
});


const MAYBE_PORT = Number(process.env.PORT);

const PORT = isNaN(MAYBE_PORT) ? 8000 : MAYBE_PORT;

server.listen(PORT);
