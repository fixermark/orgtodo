import 'react';
import {useState, useEffect} from 'react';

import {TodoUpdate, handleUpdate} from '../orgdata/Updates';
import {TasksResolution, WireDbUpdate, WireDbSummary, WireDbFull, WireEntry} from '../orgdata/Wire';
import {hashForText} from '../orgdata/Hash';
import {Entry} from '../orgdata/Entry';
import {parse} from '../orgdata/Parser';
const LOCAL_STORE_KEY = "tasks";


/** return true if there is state in the store. */
function checkStore(): boolean {
  return !!localStorage.getItem(LOCAL_STORE_KEY);
}

/** Load store from local wire, if possible */
function loadStore(): WireDbFull {
  const store = localStorage.getItem(LOCAL_STORE_KEY);
  if (!store) {
    return {
      epochUpdateMsecs: 0,
      entries: {},
    };
  }

  return JSON.parse(store) as WireDbFull;
}

/** Save the store to local wire */
function saveStore(store: WireDbFull) {
  localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
}

/** Fetch the db state at a particular resolution. */
async function fetchDb(resolution: TasksResolution): Promise<any> {
  const response = await fetch(`/tasks?resolution=${resolution}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get db: ${response.status}`);
  }

  return response.json();
}

async function fetchDbUpdate(): Promise<WireDbUpdate> {
  return await fetchDb("update") as WireDbUpdate;
}

async function fetchDbSummary(): Promise<WireDbSummary> {
  return await fetchDb("summary") as WireDbSummary;
}

async function fetchDbFull(): Promise<WireDbFull> {
  return await fetchDb("full") as WireDbFull;
}

/** Update the store with a full set of entries and replace server state. */
async function updateStore(updateTime: number, entries: Entry[], setStore: (store: WireDbFull) => void): Promise<void> {

  const newEntries: Record<string, WireEntry> = {};
  for (const entry of entries) {
    newEntries[entry.summary.id] = {
      id: entry.summary.id,
      hash: await hashForText(entry.fulltext),
      epochUpdateMsecs: updateTime,
      fulltext: entry.fulltext,
    };
  }

  const newStore = {
    epochUpdateMsecs: updateTime,
    entries: newEntries,
  };

  setStore(newStore);
  saveStore(newStore);
  const response = await fetch("/tasks", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newStore),
  });
  if (!response.ok) {
    throw new Error(`Unable to sync db to server. Status: ${response.status}`);
  }
}


/** The local store and functions to manipulate it */
export interface LocalStore {
  store: WireDbFull;
  updateTask: (update: TodoUpdate) => void;
  replaceTasks: (tasks: string) => void;
  // TODO delete task
}

export function useLocalStore(): LocalStore {
  const [store, setStore] = useState<WireDbFull>({
    epochUpdateMsecs: 0,
    entries: {},
  });

  useEffect(() => {
    console.log("Loading from local store...");

    async function loadFullDb(): Promise<void> {
      const fullDb = await fetchDbFull();
      setStore(fullDb);
      saveStore(fullDb);
    }

    if (store.epochUpdateMsecs === 0) {
      if (checkStore()) {
	setStore(loadStore());
	// TODO: Confirm against DB that store is up to date.
      } else {
	console.log("No local DB present. Fetching full store from server...");
	loadFullDb();
      }
    }
  }, []);

  return {
    store: store,
    updateTask: (update: TodoUpdate) => {
      // TODO: get current hash of task before updating (or 0 if task missing).
      const entriesToUpdate = handleUpdate(update, store);

      async function asyncUpdate() {
	const timestamp = new Date().valueOf();
	for (const entry of entriesToUpdate) {
	  const newEntry = {
	    id: entry.id,
	    fulltext: entry.fulltext,
	    hash: await hashForText(entry.fulltext),
	    epochUpdateMsecs: timestamp,
	  };
	  store.entries[entry.id] = newEntry;
	}
	const newStore = {
	  epochUpdateMsecs: timestamp,
          entries: store.entries,
        };

	setStore(newStore);
	saveStore(newStore);
	// TODO: queue task to send to server with previous hash.
      }
      asyncUpdate();
    },
    replaceTasks: (tasks: string) => {
      const entries = parse(tasks);
      const updateTime = new Date().valueOf();

      // TODO: track updateStore requires network activity
      updateStore(updateTime, entries, setStore);
    },
  };
}

