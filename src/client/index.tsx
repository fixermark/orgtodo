/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const container = document.getElementById("root")!;
createRoot(container).render(<App />);
