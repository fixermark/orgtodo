/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import "react";
import React, { useState } from "react";
import { jsDatetimeToOrg } from "../orgdata/Date";

/** Format a date into a deadline display */
export function formatDeadline(deadline: Date): string {
  if (!deadline.getHours() && !deadline.getMinutes()) {
    return deadline.toDateString();
  }
  return deadline.toString();
}

export type ToggleableEditDateProps = {
  date: Date | undefined;
  onChangeDate: (text: string) => void;
  validate: (text: string) => string | null;
};

/** Date display that can be clicked on to edit its contents. */
export const ToggleableEditDate: React.FC<ToggleableEditDateProps> = ({
  date,
  onChangeDate,
  validate,
}) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(date ? jsDatetimeToOrg(date) : "");
  const [error, setError] = useState<string | null>(null);

  const handleTextClick = () => {
    setEditing(true);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null);
  };

  const handleSetClick = () => {
    const validationResult = validate(inputValue);
    if (validationResult) {
      setError(validationResult);
    } else {
      onChangeDate(inputValue);
      setEditing(false);
      setError(null);
    }
  };

  return (
    <div className="toggleable-edit-date">
      {editing ? (
	<>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
          />
          <button onClick={handleSetClick}>Set</button>
	  <button onClick={() => setEditing(false)}>Cancel</button>
          {error && <div className="error">{error}</div>}
        </>
      ) : (
        <span onClick={handleTextClick} >
          {date ? formatDeadline(date) : "none"}
        </span>
      )}
    </div>
  );
};
