import "react";
import React from "react";

import {Entry, TodoStatus} from "../orgdata/Entry";
import {DetailBody} from './DetailBody';
import {TodoLine} from "./TodoLine";

export function formatDeadline(deadline: Date): string {
  if (!deadline.getHours() && !deadline.getMinutes()) {
    return deadline.toDateString();
  }
  return deadline.toString();
}

export interface DetailViewProps {
  entry: Entry;
  onToggleTodo(id: string, newValue: TodoStatus): void;
  onDismiss(): void;
}

/** A detail view of a single TODO item */
export const DetailView: React.FC<DetailViewProps> = ({entry, onToggleTodo, onDismiss}) => {
  return (
    <div className="dialog-background">
      <div className="detail-view">
	<button onClick={onDismiss}>X</button>
	<TodoLine entry={entry} onToggleTodo={onToggleTodo} />
        <div className="headline">{entry.summary.headline}</div>
        <div className="taskId">{entry.summary.id}</div>
        {entry.summary.deadline && <div className="deadline">Deadline: {formatDeadline(entry.summary.deadline)}</div>}
        <DetailBody entry={entry} onToggleCheckLine={(id: string, line: number) => {}} />
      </div>
    </div>
  );
};
