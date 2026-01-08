/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import "react";
import {useState, useCallback} from "react";
import React from "react";

import {checkboxStatus, setCheckboxStatus} from "../orgdata/Parser";

export interface NewTaskProps {
  onNewTask(headline: string, body: string): void;
  onCloseDialog(): void;
}

export const NewTask: React.FC<NewTaskProps> = ({onNewTask, onCloseDialog}) => {
  const [headlineText, setHeadlineText] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");

  const onChangeHeadlineText = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setHeadlineText(event.target.value), [setHeadlineText]);
  const onChangeBodyText = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => setBodyText(event.target.value), [setBodyText]);

  const onSubmit = useCallback(() => {
    onNewTask(headlineText, bodyText);
    onCloseDialog();
  }, [headlineText, bodyText, onNewTask, onCloseDialog]);

  const onAddCheckboxes = useCallback(() => {
    setBodyText(modifyCheckboxes(bodyText, true));
  }, [bodyText, setBodyText]);

  const onRemoveCheckboxes = useCallback(() => {
    setBodyText(modifyCheckboxes(bodyText, false));
  }, [bodyText, setBodyText]);

  return (
    <div className="dialog-background">
      <div className="dialog-foreground v-flex-container">
	<div className="flex-row">
	  <button onClick={onCloseDialog}>X</button>
	</div>
	<div className="flex-row">
	  <button onClick={onSubmit}>Create New Task</button>
	  <button onClick={onAddCheckboxes}>Add Checkboxes</button>
	  <button onClick={onRemoveCheckboxes}>Remove Checkboxes</button>
	</div>
	<div className="flex-row">
	  <label htmlFor="headline">Headline:</label>
	  <input type="text" id="headline" value={headlineText} name="headline" onChange={onChangeHeadlineText}/>
	</div>
	<div className="flex-row flex-last-item new-task-body">
	  <textarea value={bodyText} onChange={onChangeBodyText} />
	</div>
      </div>
    </div>);
};

/** Add or remove checkboxes from the input text. */
function modifyCheckboxes(bodyText: string, adding: boolean): string {
  let lines = bodyText.split("\n");

  lines = lines.map((line) => {
    if (adding && checkboxStatus(line) === "none") {
      return setCheckboxStatus(line, "unchecked");
    } else if (!adding && checkboxStatus(line) !== "none") {
      return setCheckboxStatus(line, "none");
    } return line;
  });

  return lines.join("\n");
}
