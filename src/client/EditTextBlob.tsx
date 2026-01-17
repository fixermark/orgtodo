/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import "react";
import React, { useState } from "react";

export type EditTextBlobProps = {
  text: string;
  onSaveEdits: (newText: string) => void;
  onCancel: () => void;
};

/** Edit a generic text blob and save edits. */
export const EditTextBlob: React.FC<EditTextBlobProps> = ({ text, onSaveEdits, onCancel }) => {
  const [value, setValue] = useState<string>(text);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSave = () => {
    onSaveEdits(value);
  };

  return (
    <>
      <div className="flex-row">
	<button onClick={handleSave}>Save Changes</button>
	<button onClick={onCancel}>Cancel Changes</button>
      </div>
      <div className="flex-row flex-last-item">
	<textarea
          value={value}
          onChange={handleChange}
	/>
      </div>
    </>
  );
};

