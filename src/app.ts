/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import express from 'express';
import path from 'path';
import 'process';
import { readEntries, replaceEntries, topqueue, ViewSort} from './db/Db';
import { checkAndMigrate } from './db/Migrate';
import { parse } from './orgdata/Parser';
import { handleTasksGet, handleTaskPost, handleTaskPut, handleNewTask } from './handlers';

const server = express();
server.use(express.text({type: "*/*"}));

const frontendJsPath = path.resolve(__dirname, '.');
const frontendPublicPath = path.resolve(__dirname, '../public');



server.use(express.static((frontendJsPath)));

server.use("/public", express.static((frontendPublicPath)));

server.get("/tasks", handleTasksGet);

server.post("/tasks/:taskid", handleTaskPost);

server.post("/tasks", express.text(), handleNewTask);

server.put("/tasks", handleTaskPut);

// async (req, res) => {
//   const entries = parse(req.body);

//   replaceEntries(entries);

//   res.sendStatus(200);
// });

server.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public/index.html"));
});


const MAYBE_PORT = Number(process.env.PORT);

const PORT = isNaN(MAYBE_PORT) ? 8000 : MAYBE_PORT;

checkAndMigrate().then(() => {
  server.listen(PORT);
},
  (err: any) => {console.error(`Failure to set up database: ${err}`);}
);
