/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {fulltextToLines, parse, getDeadline} from "../orgdata/Parser";
import {Entry, TodoStatus} from "../orgdata/Entry";
import {OrgImporter} from "./OrgImporter";
import {NewTask } from "./NewTask";
import 'react';
import {withErrorBoundary, useErrorBoundary} from 'react-use-error-boundary';

import {useEffect, useState, useCallback} from 'react';

type PriorityOperations = "topqueue" | "up1" | "down1" | "bury";

/** Compute class name for the TODO line */
function todoClassName(entry: Entry): string {
  return `todoline ${entry.summary.todo === TodoStatus.DONE ? "todo-done" : "todo-todo"}`;
}

/** Marshalls the JSON over the wire properly into an Entry object. */
function marshallEntryJson(entry: any): Entry {
  entry.summary.deadline = getDeadline(entry.fulltext);
  return entry as Entry;
}

function formatDeadline(deadline: Date): string {
  if (!deadline.getHours() && !deadline.getMinutes()) {
    return deadline.toDateString();
  }
  return deadline.toString();
}

/** Compute  text for the TODO line */
function todoText(entry: Entry): string {
  return entry.summary.todo === TodoStatus.DONE ? "DONE" : "TODO";
}

function messageForError(err: unknown): string | undefined {
  if (typeof err === "undefined") {
    return undefined;
  }
  return (err as Error).message;
}

export const App = () => {

  const [error, resetError] = useErrorBoundary(
    (error, errorInfo) => console.error(error));

  const [entries, setEntries] = useState<Entry[]>([]);

  const [showOrgImporter, setShowOrgImporter] = useState<boolean>(false);

  const [showNewTask, setShowNewTask] = useState<boolean>(false);

  const onRefreshEntries = useCallback(() => {
    const fetchData = async () => {
      const response = await fetch('/tasks');
      if (!response.ok) {
	throw new Error(`Failed to fetch: ${response.status}`);
      }
      setEntries((await response.json()).map((entry: any) => marshallEntryJson(entry)));
      setShowOrgImporter(false);
      setShowNewTask(false);
    };

    fetchData();
  }, [setEntries, setShowOrgImporter, setShowNewTask]);

  const onToggleTodo = useCallback((id: string, newValue: TodoStatus) => {
    const toggleTodo = async () => {
      const todoString = newValue == TodoStatus.TODO ? "todo" : "done";
      const response = await fetch(`/tasks/${id}?todo=${todoString}`, {method: 'POST'});
      if (!response.ok) {
	throw new Error(`Failed to update todo: ${response.status}`);
      }
      console.log("Refreshing entries after toggling todo...");
      onRefreshEntries();
    };

    toggleTodo();
  }, [onRefreshEntries]);

  const onSetPriority = useCallback((id: string, operation: PriorityOperations) => {
    const setPriority = async () => {
      const response = await fetch(`/tasks/${id}?priority=${operation}`, {method: 'POST'});
      if (!response.ok) {
	throw new Error(`Failed to set priority: ${response.status}`);
      }
      onRefreshEntries();
    };

    setPriority();
  }, [onRefreshEntries]);

  const onClickShowOrgImporter = useCallback(() => setShowOrgImporter(!showOrgImporter), [showOrgImporter, setShowOrgImporter]);
  const onClickShowNewTask = useCallback(() => setShowNewTask(!showNewTask), [showNewTask, setShowNewTask]);

  useEffect(() => {
    onRefreshEntries();
  }, []);


  const errMsg = messageForError(error);

  return (
    <div>
      { errMsg && <div className="error-banner">
		  {errMsg} <button onClick={resetError}>X</button>
		  </div>
      }
      <div className="chips">
	{!entries.length ? "No entries." : entries.map((entry) =>
	  <div className="chip">
	    <div
              className={todoClassName(entry)}
              onClick={() => onToggleTodo(entry.summary.id, entry.summary.todo === TodoStatus.DONE ? TodoStatus.TODO : TodoStatus.DONE)}>
              {todoText(entry)}
            </div>
            <div className="headline">{entry.summary.headline}</div>
	    <div className="taskId">{entry.summary.id}</div>
	    {entry.summary.deadline && <div className="deadline">Deadline: {formatDeadline(entry.summary.deadline)}</div>}
            <div className="fulltext"><pre>{entry.summary.body}</pre></div>
	    <div className="buttonPanel">
              <button onClick={() => onSetPriority(entry.summary.id, "topqueue")}>&#x219F;</button>
              <button onClick={() => onSetPriority(entry.summary.id, "up1")}>&#x2191;</button>
              <button onClick={() => onSetPriority(entry.summary.id, "down1")}>&#x2193;</button>
              <button onClick={() => onSetPriority(entry.summary.id, "bury")}>&#x21A1;</button>
            </div>
	  </div>
	)}
      </div>
      <div>
	<button onClick={onClickShowNewTask}>New Task</button>
      </div>
      <div>
	<button onClick={onClickShowOrgImporter}>Import from org</button>
      </div>
      <div>
	{showOrgImporter && <OrgImporter onRefreshEntries={onRefreshEntries}/>}
      </div>
      <div>
	{showNewTask && <NewTask onRefreshEntries={onRefreshEntries}/>}
      </div>
    </div>
  );
}

