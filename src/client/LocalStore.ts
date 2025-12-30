import 'react';
import {useState, useEffect} from 'react';

import {TodoUpdate, handleUpdate} from '../orgdata/Updates';
import {WireDbFull, WireEntry} from '../orgdata/Wire';
import {hashForText} from '../orgdata/Hash';
import {Entry} from '../orgdata/Entry';
import {parse} from '../orgdata/Parser';
const LOCAL_STORE_KEY = "tasks";

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

/** update the store after fetching a hash */
async function updateStore(updateTime: number, entries: Entry[], setStore: (store: WireDbFull) => void) {

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
    debugger;
    if (store.epochUpdateMsecs === 0) {
      // TODO: ideally, skip loading if local store completely empty and just get full dump.
      setStore(loadStore());
      // TODO: sync local store against remote store.
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
	  entry.hash = await hashForText(entry.fulltext);
	  entry.epochUpdateMsecs=timestamp;
	  store.entries[entry.id] = entry;
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


      updateStore(updateTime, entries, setStore);
    },
  };
}

