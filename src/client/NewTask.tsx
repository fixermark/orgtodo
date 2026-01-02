import "react";
import {useState, useCallback} from "react";
import React from "react";

export interface NewTaskProps {
  onNewTask(headline: string, body: string): void;
}

export const NewTask: React.FC<NewTaskProps> = ({onNewTask}) => {
  const [headlineText, setHeadlineText] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");

  const onChangeHeadlineText = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setHeadlineText(event.target.value), [setHeadlineText]);
  const onChangeBodyText = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => setBodyText(event.target.value), [setBodyText]);

  const onSubmit = useCallback(() => {
  onNewTask(headlineText, bodyText);
  }, [headlineText, bodyText, onNewTask]);

  return (
    <div>
      <div>
	<label htmlFor="headline">Headline:</label>
	<input type="text" id="headline" value={headlineText} name="headline" onChange={onChangeHeadlineText}/>
      </div>
      <div>
	<textarea value={bodyText} onChange={onChangeBodyText} rows={5} cols={50} />
      </div>
      <button onClick={onSubmit}>New Task</button>
    </div>);
};
