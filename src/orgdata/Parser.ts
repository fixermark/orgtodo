/** Parser for org headlines */

import {Entry, EntryProperties, newId} from './Entry';

export type OptionalEntryProps = Partial<EntryProperties>;

enum ParseFSM {
  SEEKING_HEADLINE=1,
  SCANNIG_HEADLINE=2,
}

const HEADLINE_PATTERN = /^\*+ (.*)/;

const ID_PATTERN = /^:ID: +(.*)\n/;
const PROPERTIES_PATTERN = /^:PROPERTIES:\n/;
const DRAWER_PATTERN = /^:[-_A-Za-z0-9]+:\n/;
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
    return undefined;
  }
  for (var i = 2; i < content.length; i++) {
    const test = ID_PATTERN.exec(content[i]);
    if (test) {
      return test[1];
    }
    if (END_PATTERN.test(content[i])) {
      return undefined;
    }
  }
  return undefined;
}

/** Mutate content to insert a :PROPERTIES: :END: block with ID in it */
function insertEntryId(content: string[], id: string) {
  content.splice(1,0, ":PROPERTIES:\n", `:ID:       ${id}\n`, ":END:\n");
}

/** Change the content string to add the ID or replace the existing one. */
function setEntryId(content: string[], id: string) {
  if (content.length < 4 || !PROPERTIES_PATTERN.test(content[1])) {
    insertEntryId(content, id);
    return;
  }
  // content began with properties; scan for ID
  for (let i = 2; i < content.length; i++) {
    if (ID_PATTERN.test(content[i])) {
      content[i] = `:ID:       ${id}\n`;
      return;
    }
    if (END_PATTERN.test(content[i])) {
      // No ID property was found; add one
      content.splice(i, 0, `:ID:       ${id}\n`);
      return;
    }
  }
  // fell off the end without finding :END:. Malformed entry; fix it up.
  content.push(`:ID:       ${id}\n`);
  content.push(":END:\n");
}

/** Build one entry from a list of the text lines in the entry. */
export function parseEntry(content: string[]): Entry {
  if (!content.length) {
    throw new Error("Cannot parse entry: no lines to parse.");
  }

  let entryId = getEntryId(content);
  if (!entryId) {
    entryId = newId();
    setEntryId(content, entryId);
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

  return entries;
}
