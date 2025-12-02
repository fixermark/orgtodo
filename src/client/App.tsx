/*
 * Copyright 2025 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {parse} from "../orgdata/Parser";
import {Entry} from "../orgdata/Entry";
import {OrgImporter} from "./OrgImporter";
import 'react';

import {useEffect, useState, useCallback} from 'react';

export const App = () => {

  const [entries, setEntries] = useState<Entry[]>([]);

  const [showOrgImporter, setShowOrgImporter] = useState<boolean>(false);

  const onRefreshEntries = useCallback(() => {
    const fetchData = async () => {
      const response = await fetch('/tasks');
      if (!response.ok) {
	throw new Error(`Failed to fetch: {response.status}`);
      }
      setEntries((await response.json()) as Entry[]);
      setShowOrgImporter(false);
    };

    fetchData();
  }, [setEntries, setShowOrgImporter]);

  const onClickShowOrgImporter = useCallback(() => setShowOrgImporter(true), [setShowOrgImporter]);

  useEffect(() => {
    onRefreshEntries();
  }, []);

  return (
    <div>
      <div className="chips">
	{!entries.length ? "No entries." : entries.map((entry) =>
	  <div className="chip">
            <div className="headline">{entry.summary.headline}</div>
	    <div className="taskId">{entry.summary.id}</div>
            <div className="fulltext"><pre>{entry.summary.body}</pre></div>
	  </div>
	)}
      </div>
      <div>
	<button onClick={onClickShowOrgImporter}>Import from org</button>
      </div>
      <div>
	{showOrgImporter && <OrgImporter onRefreshEntries={onRefreshEntries}/>}
      </div>
    </div>
  );
}

