import { useState } from "react";

export const LanguageOption = ({lang, onStateChanged}) => {
    const [selected, setSelected] = useState(false);

    const switchSelection = () => {
        setSelected(!selected);
        onStateChanged(lang);
    };

    return (<button onClick={switchSelection} className={`selectable-btn ${selected ? 'selected' : ''}`}>{lang}</button>)
};