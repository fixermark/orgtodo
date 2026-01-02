/** Synchronization to remote todo database */

import {WireDbFull, WireEntry} from '../orgdata/Wire';

interface OutgoingMessage {
  entry?: WireEntry;
  store?: WireDbFull;
}

/** Debug function for testing */
function sleep(msec: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, msec));
}

export class RemoteStore {
  nextId: number = 1;
  outgoings: Record<number, OutgoingMessage> = {};

  /** Count outgoing messages */
  count(): number {
    return Object.keys(this.outgoings).length;
  }

  /** Log an outgoing message */
  logOutgoing(outgoing: OutgoingMessage): number {
    const connectionId = this.nextId;
    this.nextId += 1;
    this.outgoings[connectionId] = outgoing;

    window.onbeforeunload = this.blockUnload;

    return connectionId;
  }

  endOutgoing(id: number) {
    delete this.outgoings[id];

    if (!Object.values(this.outgoings).length) {
      window.onbeforeunload = null;
    }
  }

  /** Block unloading the page. */
  blockUnload() {
    return "Database is not synchronized with local TODO changes yet. Are you sure you want to leave?";
  }

  /** Send the entry, using its old hash to check for intermediary server-side changes. */
  async send(entry: WireEntry, oldHash: string | undefined, updateCount: (newCount: number) => void): Promise<void> {
    const connectionId = this.logOutgoing({entry: entry});
    updateCount(this.count());

    // TDOO: conflict detection: send hash also, if set.
    const hashFragment = oldHash ? `?oldhash=${oldHash}` : "";
    try {
      const result = await fetch(`/tasks/${entry.id}${hashFragment}`, {
	method: 'POST',
	headers: {
	  "Content-Type": "application/json",
	},
	body: JSON.stringify(entry),
      });

      if (!result.ok) {
	if (result.status === 409) {
	  // TODO(markt) Better 409 handling; this should trigger a conflict resolve flow.
	  alert("409 CONFLICT on updating TODO element. Reload page to get latest state.");
	  return;
	}
	// TODO 409 conflict resolution
	throw new Error(`Error sending update to server: ${result.status}`);
      }
    } finally {
      // Uncomment this line to test behavior in high-latency connections
      // await sleep(3000);
      this.endOutgoing(connectionId);
      updateCount(this.count());
    }
  }

  /** Replace the entire remote store with a new value */
  async replaceRemoteStore(store: WireDbFull, updateCount: (newCount: number) => void): Promise<void> {
    const connectionId = this.logOutgoing({store: store});
    updateCount(this.count());
    try {
      const response = await fetch("/tasks", {
	method: "PUT",
	headers: {
	  "Content-Type": "application/json",
	},
	body: JSON.stringify(store),
      });
      if (!response.ok) {
	throw new Error(`Unable to sync db to server. Status: ${response.status}`);
      }
    } finally {
      this.endOutgoing(connectionId);
      updateCount(this.count());
    }
  }
}

let REMOTE_STORE: RemoteStore | undefined = undefined;

/** Access remote store singleton. */
export function remoteStore(): RemoteStore {
  if (!REMOTE_STORE) {
    REMOTE_STORE = new RemoteStore();
  }

  return REMOTE_STORE;
}
