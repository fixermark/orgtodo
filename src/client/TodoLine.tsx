import "react";
import React from "react";

import {Entry, TodoStatus} from "../orgdata/Entry";

/** Compute class name for the TODO line */
function todoClassName(entry: Entry): string {
  return `todoline ${entry.summary.todo === TodoStatus.DONE ? "todo-done" : "todo-todo"}`;
}

/** Compute text for the TODO line */
function todoText(entry: Entry): string {
  return entry.summary.todo === TodoStatus.DONE ? "DONE" : "TODO";
}

export interface TodoLineProps {
  entry: Entry;
  onToggleTodo(id: string, newValue: TodoStatus): void;
}

/** The TODO / DONE line */
export const TodoLine: React.FC<TodoLineProps> = ({entry, onToggleTodo}) => {
  return (
    <div
           className={todoClassName(entry)}
           onClick={() => onToggleTodo(entry.summary.id, entry.summary.todo === TodoStatus.DONE ? TodoStatus.TODO : TodoStatus.DONE)}>
           {todoText(entry)}
    </div>
  );

};
