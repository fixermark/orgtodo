/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import React from "react";
import "react";

import { useState, useCallback, useEffect } from "react";

import { WireEntry } from "../orgdata/Wire";

export interface OrgImporterProps {
  storeEntries: WireEntry[];
  onReplaceEntries(newText: string): void;
  onCloseDialog(): void;
}

export const OrgImporter: React.FC<OrgImporterProps> = ({
  storeEntries,
  onReplaceEntries,
  onCloseDialog,
}) => {
  const [importText, setImportText] = useState<string>("");

  useEffect(() => {
    const newText = storeEntries.reduce(
      (newText, entry) => newText + "\n" + entry.fulltext,
      "",
    );
    setImportText(newText);
  }, []);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setImportText(event.target.value),
    [setImportText],
  );

  const onSubmit = useCallback(() => {
    onReplaceEntries(importText);
    onCloseDialog();
  }, [importText, onReplaceEntries]);

  return (
    <div className="dialog-background">
      <div className="dialog-foreground v-flex-container">
        <div className="flex-row">
          <button onClick={onCloseDialog}>X</button>
        </div>
        <div className="flex-row">
          <button onClick={onSubmit}>Submit</button>
        </div>
        <div className="flex-row flex-last-item">
          <textarea value={importText} onChange={onChange} />
        </div>
      </div>
    </div>
  );
};
