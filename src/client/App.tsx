/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {fulltextToLines, parse, parseEntry, getDeadline, setPriority} from "../orgdata/Parser";
import {Entry, TodoStatus} from "../orgdata/Entry";
import {WireEntry} from '../orgdata/Wire';
import {OrgImporter} from "./OrgImporter";
import {NewTask} from "./NewTask";
import {ChangeBug} from "./ChangeBug";
import {DetailView, formatDeadline} from "./DetailView";
import {TodoLine} from "./TodoLine";
import {
  newTodo,
  todoStatusUpdate,
  PriorityOperations,
  todoPriorityUpdate,
  todoReplaceBody
} from "../orgdata/Updates";
import 'react';
import {withErrorBoundary, useErrorBoundary} from 'react-use-error-boundary';

import {useEffect, useState, useCallback} from 'react';
import {useLocalStore, findMinPriority} from './LocalStore';

type SortColumn = "priority" | "deadline";


/** Marshalls the JSON over the wire properly into an Entry object. */
function marshallEntryJson(entry: any): Entry {
  entry.summary.deadline = getDeadline(entry.fulltext);
  return entry as Entry;
}


function messageForError(err: unknown): string | undefined {
  if (typeof err === "undefined") {
    return undefined;
  }
  return (err as Error).message;
}

/** Convert local store values to the individual entires */
function localStoreToEntries(storeEntries: WireEntry[], sortBy: SortColumn, hideDone: boolean): Entry[] {
  let entries = storeEntries.map((entry) => parseEntry(fulltextToLines(entry.fulltext)));

  if (hideDone) {
    entries = entries.filter((entry) => entry.summary.todo !== TodoStatus.DONE);
  }

  let sortFn = (a: Entry, b: Entry) => (a.summary.priority - b.summary.priority);

  if (sortBy === "deadline") {
    // Sort by deadline unless no deadline, then sort by priority
    sortFn = (a: Entry, b: Entry) => {
      if (!a.summary.deadline && !b.summary.deadline) {
	return a.summary.priority - b.summary.priority;
      } else if (!a.summary.deadline) {
	return 1;
      } else if (!b.summary.deadline) {
	return -1;
      }
      return (a.summary.deadline.valueOf() - b.summary.deadline.valueOf());
    }
  }

  entries.sort(sortFn);

  return entries;

}

export const App = () => {

  const localStore = useLocalStore();

  const [error, resetError] = useErrorBoundary(
    (error, errorInfo) => console.error(error));

  const [sortBy, setSortBy] = useState<SortColumn>("priority");

  const [hideDone, setHideDone] = useState<boolean>(false);

  const [showOrgImporter, setShowOrgImporter] = useState<boolean>(false);

  const [showNewTask, setShowNewTask] = useState<boolean>(false);

  const [detailEntryId, setDetailEntryId] = useState<string | null>(null);

  const entries = localStoreToEntries(Object.values(localStore.store.entries), sortBy, hideDone);

  const onToggleSortBy = useCallback(() => {
    const newSortBy = sortBy === "priority" ? "deadline" : "priority";
    setSortBy(newSortBy);
  }, [sortBy, setSortBy, hideDone, setHideDone]);

  const onToggleHideDone = useCallback(() => {
    const newHideDone = !hideDone;
    setHideDone(newHideDone);
  }, [hideDone, setHideDone]);

  const onToggleTodo = useCallback((id: string, newValue: TodoStatus) => {
    localStore.updateTask(todoStatusUpdate(id, newValue));
  }, [localStore]);

  const onSetPriority = useCallback((id: string, operation: PriorityOperations) => {
    localStore.updateTask(todoPriorityUpdate(id, operation));
  }, [localStore]);

  const onNewTask = useCallback((headlineText: string, bodyText: string) => {
    const entry = parseEntry(fulltextToLines(`* ${headlineText}\n${bodyText}`));

    let minPriority = findMinPriority(localStore.store);

    if (minPriority === Infinity) {
      minPriority = 1;
    }

    entry.fulltext = setPriority(entry.fulltext, minPriority - 1);
    entry.summary.priority = minPriority - 1;

    localStore.updateTask(newTodo(entry));
  }, [localStore]);

  const onReplaceBody = useCallback((entry: Entry, newBody: string) => {
  localStore.updateTask(todoReplaceBody(entry.summary.id, newBody));
  }, [localStore]);

  const onReplaceEntries = useCallback((newEntries: string) =>
    localStore.replaceTasks(newEntries), [localStore]);

  const onClickShowOrgImporter = useCallback(() => setShowOrgImporter(!showOrgImporter), [showOrgImporter, setShowOrgImporter]);
  const onClickShowNewTask = useCallback(() => setShowNewTask(!showNewTask), [showNewTask, setShowNewTask]);

  const errMsg = messageForError(error);

  let detailEntry: Entry | undefined = undefined;

  if (detailEntryId) {
    detailEntry = entries.find((entry) => entry.summary.id === detailEntryId);
  }

  return (
    <div>
      {detailEntry && <DetailView
			entry={detailEntry}
			onToggleTodo={onToggleTodo}
			onReplaceBody={onReplaceBody}
			onDismiss={() => setDetailEntryId(null)} />}
      <ChangeBug count={localStore.connections}/>
      { errMsg && <div className="error-banner">
		  {errMsg} <button onClick={resetError}>X</button>
		  </div>
      }
      <div><button onClick={onToggleSortBy}>Sorting by {sortBy}</button></div>
      <div><input type="checkbox" id="hideDone" onClick={onToggleHideDone} checked={hideDone} /><label htmlFor="hideDone">Hide Done</label></div>
      <div>
	{showNewTask && <NewTask onNewTask={onNewTask} onCloseDialog={() => setShowNewTask(false)} />}
      </div>
      <div>
	<button onClick={onClickShowNewTask}>New Task</button>
      </div>
      <div>
	<button onClick={onClickShowOrgImporter}>Import from org</button>
      </div>
      <div className="chips">
	{!entries.length ? "No entries." : entries.map((entry) =>
	  <div className="chip">
	    <TodoLine entry={entry} onToggleTodo={onToggleTodo} />
	    <div onClick={() => setDetailEntryId(entry.summary.id)}>
              <div className="headline">{entry.summary.headline}</div>
	      <div className="taskId">{entry.summary.id}</div>
	      {entry.summary.deadline && <div className="deadline">Deadline: {formatDeadline(entry.summary.deadline)}</div>}
              <div className="fulltext"><pre>{entry.summary.body}</pre></div>
            </div>
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
	{showOrgImporter && <OrgImporter storeEntries={Object.values(localStore.store.entries)} onReplaceEntries={onReplaceEntries}/>}
      </div>
    </div>
  );
}

