/** Parser for org headlines */

import {Entry, EntryProperties, newId} from './Entry';

export type OptionalEntryProps = Partial<EntryProperties>;

enum ParseFSM {
  SEEKING_HEADLINE=1,
  SCANNIG_HEADLINE=2,
}

const HEADLINE_PATTERN = /^\*+ (.*)/;

const PROPERTIES_PATTERN = /^:PROPERTIES:\n/;
const PROPERTY_PATTERN = /^:([-_A-Za-z0-9]+): +(.*)\n/;
const DRAWER_PATTERN = /^:([-_A-Za-z0-9]+):\n/;
const END_PATTERN = /^:END:\n/;

function isHeadline(line: string): boolean {
  return HEADLINE_PATTERN.test(line);
}

/** Get the ID in the entry content, or return undefined if none set. */
function getEntryId(content: string[]): string | undefined {
  if (content.length < 4) {
    return undefined;
  }

  if (content[1] != ":PROPERTIES:\n") {
    console.log("No PROPERTIES while scanning ID.");
    return undefined;
  }
  for (var i = 2; i < content.length; i++) {
    console.log(`Scanning ${i} - ${content[i]}...`);
    const test = /^:ID: +(.*)\n/.exec(content[i]);
    if (test) {
      console.log("ID found!");
      return test[1];
    }

    if (END_PATTERN.test(content[i])) {
      console.log("Oops, end pattern, no ID");
      return undefined;
    }
  }
  return undefined;
}

/** Sort elements by priority, then renumber priority from 1 to N. */
function sortAndFixPriority(entries: Entry[]) {
  entries.sort((a, b) => a.summary.priority - b.summary.priority);
  let priority = 1;
  for (const entry of entries) {
    entry.summary.priority = priority;
    setProperty(entry.fulltext, "TimeTrackerPriority", priority.toString());
    priority++;
  }
}

/** Mutate content to insert a :PROPERTIES: :END: block with the specified property in it */
function insertProperty(content: string[], name: string, value: string) {
  content.splice(1,0, ":PROPERTIES:\n", `:${name}:       ${value}\n`, ":END:\n");
}

/** Change the content string to add the property or replace the existing one. */
function setProperty(content: string[], name: string, value: string) {

  if (content.length < 4 || !PROPERTIES_PATTERN.test(content[1])) {
    insertProperty(content, name, value);
    return;
  }
  const pattern = new RegExp(`^:${name}: +(.*)\n`);

  // content began with properties; scan for specific property
  for (let i = 2; i < content.length; i++) {
    if (pattern.test(content[i])) {
      content[i] = `:${name}:       ${value}\n`;
      return;
    }
    if (END_PATTERN.test(content[i])) {
      // No property was found; add one
      content.splice(i, 0, `:${name}:       ${value}\n`);
      return;
    }
  }
  // fell off the end without finding :END:. Malformed entry; fix it up.
  content.push(`:${name}:       ${value}\n`);
  content.push(":END:\n");
}

/** Set the priority on the specified fulltext. */
export function setPriority(content: string[], value: number) {
  setProperty(content, "TimeTrackerPriority", value.toString());
}

/** Build one entry from a list of the text lines in the entry. */
export function parseEntry(content: string[]): Entry {
  console.log("Parsing entry...");
  if (!content.length) {
    throw new Error("Cannot parse entry: no lines to parse.");
  }

  let priority: number | undefined = undefined;
  let entryId = getEntryId(content);
  if (!entryId) {
    console.log("No entry ID found; adding one...");
    entryId = newId();
    setProperty(content, "ID", entryId);
  } else {
    console.log("Entry ID recognized.");
  }

  // parse body
  let parsingDrawer = false;
  let bodyLines = [];
  for (let i = 1; i < content.length; i++) {
    if (!parsingDrawer) {
      if (DRAWER_PATTERN.test(content[i])) {
	parsingDrawer = true;
	continue;
      }
      bodyLines.push(content[i]);
    } else {
      if (END_PATTERN.test(content[i])) {
	parsingDrawer = false;
	continue;
      }
      const propertyTest = PROPERTY_PATTERN.exec(content[i]);
      if (propertyTest) {
	if (propertyTest[1] == "TimeTrackerPriority") {
	  console.log("TimeTrackerPriority recognized!");
	  priority = parseInt(propertyTest[2]);
	}
      }
    }
  }

  if (content.length > 2 && (content[content.length - 1] == "\n") && (content[content.length - 2] == "\n")) {
    // content ends with \n\n; trim it a bit
    content.pop();
  }

  return {
    summary: {
      id: entryId,
      headline: HEADLINE_PATTERN.exec(content[0].trim())![1],
      body: bodyLines.join(""),
      priority: priority === undefined ? -1 : priority,
    },
    fulltext: content,
  };
}

/** Build a list of entries from an incoming text. */
export function parse(contentString: string): Entry[] {

  const content = contentString.split("\n").map((x) => x + "\n");

  let entries: Entry[] = [];
  let currentBodyPieces: string[] = [];
  let prefixBodyPieces: string[] = [];

  let currentState = ParseFSM.SEEKING_HEADLINE;

  for (const line of content) {
    if (line === undefined) {
      continue;
    }
    switch (currentState) {
      case ParseFSM.SEEKING_HEADLINE:
	if (!isHeadline(line)) {
	  prefixBodyPieces.push(line);
	} else {
	  currentBodyPieces.push(line);
	  currentState = ParseFSM.SCANNIG_HEADLINE;
	}
	break;
      case ParseFSM.SCANNIG_HEADLINE:
	if (!isHeadline(line)) {
	  currentBodyPieces.push(line);
	} else {
	  entries.push(parseEntry(currentBodyPieces));
	  currentBodyPieces = [line];
	}
	break;
    }
  }
  entries.push(parseEntry(currentBodyPieces));

  sortAndFixPriority(entries);

  return entries;
}
