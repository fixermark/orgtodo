/** Synchronization to remote todo database */

import {WireDbFull, WireEntry} from '../orgdata/Wire';

interface OutgoingMessage {
  entry?: WireEntry;
  store?: WireDbFull;
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
    return connectionId;
  }

  endOutgoing(id: number) {
    delete this.outgoings[id];
  }

  /** Send the entry, using its old hash to check for intermediary server-side changes. */
  async send(entry: WireEntry, oldHash: string | undefined): Promise<void> {
    const connectionId = this.logOutgoing({entry: entry});

    // TDOO: conflict detection: send hash also, if set.
    try {
      const result = await fetch(`/tasks/${entry.id}`, {
	method: 'POST',
	headers: {
	  "Content-Type": "application/json",
	},
	body: JSON.stringify(entry),
      });

      if (!result.ok) {
	// TODO 409 conflict resolution
	throw new Error(`Error sending update to server: ${result.status}`);
      }
    } finally {
      this.endOutgoing(connectionId);
    }
  }

  /** Replace the entire remote store with a new value */
  async replaceRemoteStore(store: WireDbFull): Promise<void> {
    const connectionId = this.logOutgoing({store: store});
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
