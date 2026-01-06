import "react";
import React from "react";
import {JSX} from "react";

import {Entry} from "../orgdata/Entry";
import {CheckboxStatus, checkboxStatus, checkboxCopy} from "../orgdata/Parser";

export interface DetailBodyProps {
  entry: Entry;
  onSetCheckLine(line: number, status: CheckboxStatus): void;  //< line is indexed from start of body (first body line: line 0)
}

export const DetailBody: React.FC<DetailBodyProps> = ({entry, onSetCheckLine}) => {
  const lines = entry.summary.body.split("\n");
  return (
    <div className="detail-body">
      {lines.map((line: string, idx: number) => detailLine(line, idx, onSetCheckLine))}
    </div>
  );
};

function detailLine(line: string, index: number, onSetCheckLine: (line: number, status: CheckboxStatus) => void): JSX.Element {

  const status = checkboxStatus(line);
  if (status === "none") {
    return <div className="detail-line">{line}</div>;
  }

  return <div className="detail-line"><input type="checkbox" checked={status==="checked"} onClick={() => onSetCheckLine(index, status==="checked" ? "unchecked" : "checked")}/>{checkboxCopy(line)}</div>;
}
