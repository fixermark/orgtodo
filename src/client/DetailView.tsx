/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import "react";
import React from "react";
import { useCallback, useState } from "react";

import { Entry, TodoStatus } from "../orgdata/Entry";
import { CheckboxStatus, setCheckboxStatus } from "../orgdata/Parser";
import { DetailBody } from "./DetailBody";
import { EditTextBlob } from "./EditTextBlob";
import { TodoLine } from "./TodoLine";

export function formatDeadline(deadline: Date): string {
  if (!deadline.getHours() && !deadline.getMinutes()) {
    return deadline.toDateString();
  }
  return deadline.toString();
}

export interface DetailViewProps {
  entry: Entry;
  onToggleTodo(id: string, newValue: TodoStatus): void;
  onReplaceBody(entry: Entry, newBody: string): void;
  onDismiss(): void;
}

/** A detail view of a single TODO item */
export const DetailView: React.FC<DetailViewProps> = ({
  entry,
  onToggleTodo,
  onReplaceBody,
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

  const onSaveBodyEdits = useCallback((newBody: string) => {
    onReplaceBody(entry, newBody);
    setEditDetailView(false);
  }, [entry, onReplaceBody, setEditDetailView]);

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
        {entry.summary.deadline && (
          <div className="deadline flex-row">
            Deadline: {formatDeadline(entry.summary.deadline)}
          </div>
        )}
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
