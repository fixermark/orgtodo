
import React from "react";
import "react";

import {useState, useCallback, useEffect} from "react";

import {WireEntry} from '../orgdata/Wire';

import {Entry} from '../orgdata/Entry';

export interface OrgImporterProps {
  storeEntries: WireEntry[];
  onReplaceEntries(newText: string): void;
}

export const OrgImporter: React.FC<OrgImporterProps> = ({storeEntries, onReplaceEntries}) => {
  const [importText, setImportText] = useState<string>("");

  useEffect(() => {
    const newText = storeEntries.reduce((newText, entry) => newText + "\n" + entry.fulltext, "");
    setImportText(newText);
  }, []);

  const onChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(event.target.value),
    [setImportText]);

  const onSubmit = useCallback(() => {
    onReplaceEntries(importText);
  }, [importText, onReplaceEntries]);

  return (
    <div>
      <textarea value={importText} onChange={onChange} rows={5} cols={50} />
      <button onClick={onSubmit}>Submit</button>
    </div>
  );


}
