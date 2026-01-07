import "react";
import {useState, useCallback} from "react";
import React from "react";

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

  return (
    <div className="dialog-background">
      <div className="dialog-foreground v-flex-container">
	<div className="flex-row">
	  <button onClick={onCloseDialog}>X</button>
	</div>
	<div className="flex-row">
	  <button onClick={onSubmit}>New Task</button>
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
