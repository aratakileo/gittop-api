import { noSkipFindAll } from "../utils/regex";
import { nullOrUndefined as isNullOrUndefined } from "../utils/utils";
import { useState, useEffect } from 'react';

let emojis = null;

const getEmoji = async emoji => {
    if (emojis === null)
        await fetch('https://api.github.com/emojis', {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json'
            }
        }).then(data => data.json()).then(gitEmojis => emojis = gitEmojis).catch(console.error);
    
    if (isNullOrUndefined(emojis) || !(emoji in emojis))
        return undefined;

    return emojis[emoji];
};

const parserRegex = /(?<emoji>:([a-zA-Z0-9_]+):)|(?<url>(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g;

const parseText = async (text, emojiClassName) => {
    const newText = [];

    for (let match of noSkipFindAll(parserRegex, text)) {
        if (match.group === 'emoji') {
            let emoji = await getEmoji(match.groups[1]);

            if (emoji) {
                newText.push(<img src={emoji} className={emojiClassName} key={`${match.group}:${match.start}:${match.end}:${text}`}/>);
                continue;
            }
        } else if (match.group === 'url') {
            const href = /^http(s)?:\/\/.+$/.test(match.text) ? match.text : ('https://' + match.text);

            newText.push(<a href={href} key={`${match.text} of ${text}`}>{match.text}</a>);
            continue;
        }

        newText.push(match.text);
    }

    return newText;
};

export const InteractableText = ({text, className='', emojiClassName='emoji'}) => {
    const [renderText, setText] = useState(text);

    const applyParsedText = async () => {
        setText(await parseText(text, emojiClassName));
    };

    useEffect(() => {
        applyParsedText();
    }, []);

    return (<p className={className}>{renderText}</p>);
};