/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import "react";
import React from "react";
import { useCallback } from "react";

import { Entry, TodoStatus } from "../orgdata/Entry";
import { CheckboxStatus, setCheckboxStatus } from "../orgdata/Parser";
import { DetailBody } from "./DetailBody";
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
  const onSetCheckLine = useCallback(
    (bodyLine: number, status: CheckboxStatus) => {
      const bodyLines = entry.summary.body.split("\n");
      bodyLines[bodyLine] = setCheckboxStatus(bodyLines[bodyLine], status);
      onReplaceBody(entry, bodyLines.join("\n"));
    },
    [entry, onReplaceBody],
  );

  return (
    <div className="dialog-background">
      <div className="detail-view">
        <button onClick={onDismiss}>X</button>
        <TodoLine entry={entry} onToggleTodo={onToggleTodo} />
        <div className="headline">{entry.summary.headline}</div>
        <div className="taskId">{entry.summary.id}</div>
        {entry.summary.deadline && (
          <div className="deadline">
            Deadline: {formatDeadline(entry.summary.deadline)}
          </div>
        )}
        <DetailBody
          entry={entry}
          onSetCheckLine={(line: number, status: CheckboxStatus) =>
            onSetCheckLine(line, status)
          }
        />
      </div>
    </div>
  );
};
