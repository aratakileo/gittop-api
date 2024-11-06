import { useState } from "react";

export const SelectableButton = ({text, onClick, selected}) => {
    const [textValue, setText] = useState(text);

    return (<button onClick={() => onClick(setText)} className={`selectable-btn ${selected ? 'selected' : ''}`}>{textValue}</button>)
};