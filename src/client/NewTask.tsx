import "react";
import {useState, useCallback} from "react";
import React from "react";

export interface NewTaskProps {
  onRefreshEntries(): void;
}

export const NewTask: React.FC<NewTaskProps> = ({onRefreshEntries}) => {
  const [headlineText, setHeadlineText] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");

  const onChangeHeadlineText = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setHeadlineText(event.target.value), [setHeadlineText]);
  const onChangeBodyText = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => setBodyText(event.target.value), [setBodyText]);

  const onSubmit = useCallback(() => {
    const sendNewTask = async () => {
      const fulltext = `* ${headlineText}\n${bodyText}\n`;
      const response = await fetch("/tasks", {
	method: 'POST',
	headers: {
	  'Content-Type': 'text/plain',
	},
	body: fulltext,
      });

      if (!response.ok) {
	throw new Error(`Failed to create new task: ${response.status}`);
      }

      onRefreshEntries();
    };

    sendNewTask();
  }, [headlineText, bodyText]);

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
