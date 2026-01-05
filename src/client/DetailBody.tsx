import "react";
import React from "react";

import {Entry} from "../orgdata/Entry";

export interface DetailBodyProps {
  entry: Entry;
  onToggleCheckLine(id: string, line: number): void;  //< line is indexed from start of body (first body line: line 0)
}

export const DetailBody: React.FC<DetailBodyProps> = ({entry, onToggleCheckLine}) => {
  const lines = entry.summary.body.split("\n");
  return (
    <div className="detail-body">
      {lines.map((line: string) => <div className="detail-line">{line}</div>)}
    </div>
  );
};
