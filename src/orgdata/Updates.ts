/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

/** Acceptable updates to TODO items */

import { TodoStatus, Entry } from "./Entry";
import { WireDbFull, WireEntryUnhashed } from "./Wire";
import { replaceBody, setTodoStatus, setDeadline } from "./Parser";

import { PriorityOperations as PriorityOperationsReordering } from "./Reordering";
import { reorderTask } from "./Reordering";

export type PriorityOperations = PriorityOperationsReordering;

export type UpdateType = "newTodo" | "todoValue" | "priority" | "replaceBody" | "setDeadline";

export interface TodoUpdate {
  type: UpdateType;
  properties: any;
}

export function newTodo(entry: Entry): TodoUpdate {
  return {
    type: "newTodo",
    properties: { id: entry.summary.id, fulltext: entry.fulltext },
  };
}

export function todoStatusUpdate(id: string, status: TodoStatus): TodoUpdate {
  return {
    type: "todoValue",
    properties: { id: id, status: status },
  };
}

export function todoPriorityUpdate(
  id: string,
  operation: PriorityOperations,
): TodoUpdate {
  return {
    type: "priority",
    properties: { id: id, operation: operation },
  };
}

export function todoReplaceBody(id: string, newBody: string): TodoUpdate {
  return {
    type: "replaceBody",
    properties: { id: id, newBody: newBody },
  };
}

export function todoSetDeadline(id: string, newDeadline: Date | null): TodoUpdate {
  return {
    type: "setDeadline",
    properties: { id: id, deadline: newDeadline },
  };
}

/** Handle the update by mutating one or more entries. */
export function handleUpdate(
  update: TodoUpdate,
  store: WireDbFull,
): WireEntryUnhashed[] {
  switch (update.type) {
    case "newTodo":
      return [
        { id: update.properties.id, fulltext: update.properties.fulltext },
      ];
    case "todoValue":
      // eslint-disable-next-line no-case-declarations
      let entry = store.entries[update.properties.id];
      if (!entry) {
        throw new Error("No entry with id ${id}");
      }

      entry.fulltext = setTodoStatus(entry.fulltext, update.properties.status);
      return [entry];
      break;
    case "priority":
      return reorderTask(
        store,
        update.properties.id,
        update.properties.operation,
      );
      break;
    case "replaceBody":
      entry = store.entries[update.properties.id];
      entry.fulltext = replaceBody(entry.fulltext, update.properties.newBody);
      return [entry];
      break;
    case "setDeadline":
      entry = store.entries[update.properties.id];
      entry.fulltext = setDeadline(entry.fulltext, update.properties.deadline);
      return [entry];
      break;
    default:
      throw new Error(`unknown update type ${update.type}`);
      break;
  }
}
