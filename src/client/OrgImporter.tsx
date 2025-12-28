
import React from "react";
import "react";

import {useState, useCallback, useEffect} from "react";

import {Entry} from '../orgdata/Entry';

export interface OrgImporterProps {
  onRefreshEntries(): void;
}

export const OrgImporter: React.FC<OrgImporterProps> = ({onRefreshEntries}) => {
  const [importText, setImportText] = useState<string>("");

  useEffect(() => {
    const getEntries = async () => {
      const response = await fetch("/tasks?showDone=true");
      if (!response.ok) {
	throw new Error(`Failed to fetch: ${response.status}`);
      }
      const entries = (await response.json()) as Entry[];
      setImportText(entries.map((entry) => entry.fulltext.join("")).join(""));
    };
    getEntries();
  }, []);

  const onChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(event.target.value),
    [setImportText]);

  const onSubmit = useCallback(() => {
    const sendState = async () => {
      await fetch("/tasks", {
	method: 'PUT',
	headers: {
	  'Content-Type': 'text/plain',
	},
	body: importText,
      });

      onRefreshEntries();
    };

    sendState();
  }, [importText, onRefreshEntries]);

  return (
    <div>
      <textarea value={importText} onChange={onChange} rows={5} cols={50} />
      <button onClick={onSubmit}>Submit</button>
    </div>
  );


}
