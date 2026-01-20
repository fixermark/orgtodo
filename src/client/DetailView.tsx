/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import "react";
import React from "react";
import { useCallback, useState } from "react";

import { Entry, TodoStatus } from "../orgdata/Entry";
import { CheckboxStatus, setCheckboxStatus, setDeadline } from "../orgdata/Parser";
import { isValidDate, orgDatetimeToJs } from "../orgdata/Date";
import { DetailBody } from "./DetailBody";
import { EditTextBlob } from "./EditTextBlob";
import { TodoLine } from "./TodoLine";
import { ToggleableEditDate } from "./ToggleableEditDate";

/** Validates string is a deadline. Returns null if it is, an error message if it is not. */
function validateDeadline(text: string): string | null {
  if (!text) {
    return null;
  }
  if (!isValidDate(text)) {
    return "Must be a valid datetime of the form YYYY-MM-DD";
  }
  return null;
}

export interface DetailViewProps {
  entry: Entry;
  onToggleTodo(id: string, newValue: TodoStatus): void;
  onReplaceBody(entry: Entry, newBody: string): void;
  onSetDeadline(entry: Entry, newDeadline: Date | null): void;
  onDismiss(): void;
}

/** A detail view of a single TODO item */
export const DetailView: React.FC<DetailViewProps> = ({
  entry,
  onToggleTodo,
  onReplaceBody,
  onSetDeadline,
  onDismiss,
}) => {
  const [editDetailView, setEditDetailView] = useState<boolean>(false);

  const onSetCheckLine = useCallback(
    (bodyLine: number, status: CheckboxStatus) => {
      const bodyLines = entry.summary.body.split("\n");
      bodyLines[bodyLine] = setCheckboxStatus(bodyLines[bodyLine], status);
      onReplaceBody(entry, bodyLines.join("\n"));
    },
    [entry, onReplaceBody],
  );

  const onSaveBodyEdits = useCallback(
    (newBody: string) => {
      onReplaceBody(entry, newBody);
      setEditDetailView(false);
    },
    [entry, onReplaceBody, setEditDetailView],
  );

  const updateDeadline=useCallback((text: string) => {
    const orgDt = text ? orgDatetimeToJs(text) : null;
    if (orgDt===undefined) {
      throw new Error(`Unable to parse ${text}`);
    }
    onSetDeadline(entry, orgDt);
  }, [entry, onSetDeadline]);


  return (
    <div className="dialog-background">
      <div className="detail-view v-flex-container">
        <div className="flex-row">
          <button onClick={onDismiss}>X</button>
        </div>
        <div className="flex-row">
          <TodoLine entry={entry} onToggleTodo={onToggleTodo} />
        </div>
        <div className="headline flex-row">{entry.summary.headline}</div>
        <div className="taskId flex-row">{entry.summary.id}</div>
	<div className="deadline flex-row">
	  Deadline: <ToggleableEditDate
			  date={entry.summary.deadline || undefined}
			  onChangeDate={updateDeadline}
			  validate={validateDeadline} />
	</div>
        {!editDetailView && (
          <>
            <div className="flex-row">
              <button onClick={() => setEditDetailView(true)}>Edit</button>
            </div>

            <DetailBody
              entry={entry}
              onSetCheckLine={(line: number, status: CheckboxStatus) =>
                onSetCheckLine(line, status)
              }
            />
          </>
        )}
        {editDetailView && (
          <EditTextBlob
            text={entry.summary.body}
            onSaveEdits={onSaveBodyEdits}
            onCancel={() => setEditDetailView(false)}
          />
        )}
      </div>
    </div>
  );
};
