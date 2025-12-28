import 'react';
import {useState, useEffect} from 'react';

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
  updateTask: (id: string, taskData: string) => void;
  replaceTasks: (tasks: string) => void;
  // TODO delete task
}

export function useLocalStore(): LocalStore {
  const [store, setStore] = useState<WireDbFull>({
    epochUpdateMsecs: 0,
    entries: {},
  });

  useEffect(() => {
    if (!store) {
      // TODO: ideally, skip loading if local store completely empty and just get full dump.
      setStore(loadStore());
      // TODO: sync local store against remote store.
    }
  }, []);

  return {
    store: store,
    updateTask: (id: string, taskData: string) => {
      // TODO: get current hash of task before updating (or 0 if task missing).
      let entry = store.entries[id];
      if (!entry) {
	entry = {
	  id: id,
	  hash: "",
	  epochUpdateMsecs: new Date().valueOf(),
	  fulltext: taskData
	};
	store.entries[id]=entry;
      }
      entry.fulltext = taskData;
      async function update() {
	entry.hash = await hashForText(entry.fulltext);
	setStore(store);
	saveStore(store);
	// TODO: queue task to send to server with previous hash.
      }
      update();
    },
    replaceTasks: (tasks: string) => {
      const entries = parse(tasks);
      const updateTime = new Date().valueOf();


      updateStore(updateTime, entries, setStore);
    },
  };
}

