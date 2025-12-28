/** Parser for org headlines */

import {Entry, EntryProperties, newId, TodoStatus} from './Entry';

export type OptionalEntryProps = Partial<EntryProperties>;

enum ParseFSM {
  SEEKING_HEADLINE=1,
  SCANNIG_HEADLINE=2,
}

const HEADLINE_PATTERN = /^\*+ (TODO |DONE )?(.*)\n/;

export const DATETIME_PATTERN = /((\d{4})-(\d{2})-(\d{2})) (Mon|Tue|Wed|Thu|Fri|Sat|Sun)( ((\d{2}):(\d{2})))?/;

export enum DatetimeFields {
  DATE=1,
  YEAR=2,
  MONTH=3,
  DAY=4,
  DOW=5,
  SPACED_TIME=6,
  TIME=7,
  HOUR=8,
  MINUTE=9
}

export const DEADLINE_PATTERN = new RegExp(`^DEADLINE: <(${DATETIME_PATTERN.source})>`);

const PROPERTIES_PATTERN = /^:PROPERTIES:\n/;
const PROPERTY_PATTERN = /^:([-_A-Za-z0-9]+): +(.*)\n/;
const DRAWER_PATTERN = /^:([-_A-Za-z0-9]+):\n/;
const END_PATTERN = /^:END:\n/;

const DAY_OF_WEEK_ORG_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Convert an Org datetime string into a JavaScript datetime. Return undefined if not a valid datetime. */
export function orgDatetimeToJs(orgDt: string): Date | undefined {
  const result = DATETIME_PATTERN.exec(orgDt);

  if (!result) {
    return undefined;
  }

  const year = parseInt(result[DatetimeFields.YEAR]);
  const month = parseInt(result[DatetimeFields.MONTH]);
  const day = parseInt(result[DatetimeFields.DAY]);

  let hour = 0;
  let minute = 0;

  if (result[DatetimeFields.HOUR] !== undefined) {
    hour = parseInt(result[DatetimeFields.HOUR]);
    minute = parseInt(result[DatetimeFields.MINUTE]);
  }

  return new Date(year, month - 1, day, hour, minute);
}

/** Convert a Date object to an org datetime. */
export function jsDatetimeToOrg(jsDt: Date): string {
  const dateString = (`${jsDt.getFullYear()}-${(jsDt.getMonth() + 1).toString().padStart(2, '0')}-` +
    `${jsDt.getDate().toString().padStart(2, '0')} ${DAY_OF_WEEK_ORG_NAMES[jsDt.getDay()]}`);

  if (!jsDt.getHours() && !jsDt.getMinutes()) {
    return dateString;
  }

  return dateString + ` ${jsDt.getHours().toString().padStart(2, '0')}:${jsDt.getMinutes().toString().padStart(2, '0')}`;
}

/** Split out full text into individual lines */
export function fulltextToLines(fulltext: string): string[] {
  const result = fulltext.split("\n").map((line: string) => line + "\n");
  result[result.length - 1] = result[result.length - 1].slice(0,-1);

  return result;
}

/** Return true if the given line is a headline. */
function isHeadline(line: string): boolean {
  return HEADLINE_PATTERN.test(line);
}

/** Get the ID in the entry content, or return undefined if none set. */
function getEntryId(content: string[], firstLine: number = 1): string | undefined {
  if (content.length < 4) {
    return undefined;
  }

  if (content[firstLine] != ":PROPERTIES:\n") {
    console.log("No PROPERTIES while scanning ID.");
    return undefined;
  }
  for (var i = firstLine + 1; i < content.length; i++) {
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
    const lines = fulltextToLines(entry.fulltext);
    setProperty(lines, "TimeTrackerPriority", priority.toString());
    entry.fulltext = lines.join("");
    priority++;
  }
}

/** Mutate content to insert a :PROPERTIES: :END: block with the specified property in it */
function insertProperty(content: string[], name: string, value: string) {
  content.splice(1,0, ":PROPERTIES:\n", `:${name}:       ${value}\n`, ":END:\n");
}

/** Change the content string to add the property or replace the existing one. */
function setProperty(content: string[], name: string, value: string) {

  let i = 1;
  let propertiesDrawerFound = false;
  // Find start of properties
  for (; i < content.length; i++) {
    if (PROPERTIES_PATTERN.test(content[i])) {
      propertiesDrawerFound = true;
      break;
    }
  }

  if (!propertiesDrawerFound) {
    insertProperty(content, name, value);
    return;
  }

  const pattern = new RegExp(`^:${name}: +(.*)\n`);

  // content began with properties; scan for specific property
  for (; i < content.length; i++) {
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
export function setPriority(fulltext: string, value: number): string {
  let content = fulltextToLines(fulltext);
  setProperty(content, "TimeTrackerPriority", value.toString());
  return content.join("");
}

/** Set the TODO status on the specified fulltext. */
export function setTodoStatus(fulltext: string, value: TodoStatus): string {
  let content = fulltextToLines(fulltext);

  let statusString = "";
  switch(value) {
    case TodoStatus.TODO:
      statusString = "TODO";
      break;
    case TodoStatus.DONE:
      statusString = "DONE";
      break;
  }

  const headlineMatcher = /(\*+) +(TODO |DONE )? *(.*)\n/;
  const updated = content[0].replace(headlineMatcher, `$1 ${statusString} $3\n`);
  content[0] = updated;

  return content.join("");
}

/** Parse out the deadline from the full text, or return undefined if it is absent. */
export function getDeadline(fulltext: string[]): Date | undefined {
  if (fulltext.length < 2) {
    return undefined;
  }
  const deadlineMatch = DEADLINE_PATTERN.exec(fulltext[1]);
  if (!deadlineMatch) {
    return undefined;
  }
  return orgDatetimeToJs(deadlineMatch[1]);
}

/** Build one entry from a list of the text lines in the entry. */
export function parseEntry(content: string[]): Entry {
  console.log("Parsing entry...");
  if (!content.length) {
    throw new Error("Cannot parse entry: no lines to parse.");
  }

  let firstBodyLine = 1;

  const headlineParse = HEADLINE_PATTERN.exec(content[0]);
  if (!headlineParse) {
    throw new Error(`Headline '${content[0]}' was malformed.`);
  }
  const headline = headlineParse[2];
  let todoState = TodoStatus.NONE;
  if (headlineParse[1]) {
    if (headlineParse[1] == "DONE ") {
      todoState = TodoStatus.DONE;
    }
    if (headlineParse[1] == "TODO ") {
      todoState = TodoStatus.TODO;
    }
  }

  const deadline = getDeadline(content);
  console.log(deadline ? `deadline found: ${deadline}` : `no deadline found in ${content[1]}`);

  if(deadline) {
    firstBodyLine++;
  }

  let entryId = getEntryId(content, firstBodyLine);
  if (!entryId) {
    console.log("No entry ID found; adding one...");
    entryId = newId();
    setProperty(content, "ID", entryId);
  } else {
    console.log("Entry ID recognized.");
  }

  // parse body
  let parsingDrawer = false;
  let priority: number | undefined = undefined;
  let bodyLines = [];
  for (let i = firstBodyLine; i < content.length; i++) {
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
      headline: headline,
      deadline: deadline,
      todo: todoState,
      body: bodyLines.join(""),
      priority: priority === undefined ? -1 : priority,
    },
    fulltext: content.join(""),
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
