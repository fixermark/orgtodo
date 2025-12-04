/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {parse} from "../orgdata/Parser";
import {Entry, TodoStatus} from "../orgdata/Entry";
import {OrgImporter} from "./OrgImporter";
import 'react';

import {useEffect, useState, useCallback} from 'react';

/** Compute class name for the TODO line */
function todoClassName(entry: Entry): string {
  return `todoline ${entry.summary.todo === TodoStatus.DONE ? "todo-done" : "todo-todo"}`;
}

/** Compute  text for the TODO line */
function todoText(entry: Entry): string {
  return entry.summary.todo === TodoStatus.DONE ? "DONE" : "TODO";
}

export const App = () => {

  const [entries, setEntries] = useState<Entry[]>([]);

  const [showOrgImporter, setShowOrgImporter] = useState<boolean>(false);

  const onRefreshEntries = useCallback(() => {
    const fetchData = async () => {
      const response = await fetch('/tasks');
      if (!response.ok) {
	throw new Error(`Failed to fetch: ${response.status}`);
      }
      setEntries((await response.json()) as Entry[]);
      setShowOrgImporter(false);
    };

    fetchData();
  }, [setEntries, setShowOrgImporter]);

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

  const onTopqueue = useCallback((id: string) => {
    const topqueue = async () => {
      const response = await fetch(`/tasks/${id}?priority=topqueue`, {method: 'POST'});
      if (!response.ok) {
	throw new Error(`Failed to topqueue: ${response.status}`);
      }
      onRefreshEntries();
    };

    topqueue();
  }, [onRefreshEntries]);

  const onClickShowOrgImporter = useCallback(() => setShowOrgImporter(true), [setShowOrgImporter]);

  useEffect(() => {
    onRefreshEntries();
  }, []);


  return (
    <div>
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
            <div className="fulltext"><pre>{entry.summary.body}</pre></div>
	    <div className="buttonPanel">
              <button onClick={() => onTopqueue(entry.summary.id)}>&#x219F;</button>
            </div>
	  </div>
	)}
      </div>
      <div>
	<button onClick={onClickShowOrgImporter}>Import from org</button>
      </div>
      <div>
	{showOrgImporter && <OrgImporter onRefreshEntries={onRefreshEntries}/>}
      </div>
    </div>
  );
}

