/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import express from 'express';
import path from 'path';
import 'process';

const server = express();
server.use(express.text({type: "*/*"}));

const frontendJsPath = path.resolve(__dirname, '.');
const frontendPublicPath = path.resolve(__dirname, '../public');

server.use(express.static((frontendJsPath)));

server.use("/public", express.static((frontendPublicPath)));

server.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public/index.html"));
});

const MAYBE_PORT = Number(process.env.PORT);

const PORT = isNaN(MAYBE_PORT) ? 8000 : MAYBE_PORT;

server.listen(PORT);
