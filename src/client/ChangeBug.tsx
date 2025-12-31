import "react";
import React from "react";

export interface ChangeBugProps {
  count: number;
}

/** Little indicator for network activity. */
export const ChangeBug: React.FC<ChangeBugProps> = ({count}) => {
  return count == 0 ? null : <div className="Changebug">{count}</div>;
}
