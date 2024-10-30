const formatFractionalPart = (num, divider) => {
    const lastDigit = (num % divider).toString()[0];

    return lastDigit === '0' ? '' : (',' + lastDigit);
};

export const formatedNumericValue = (num) => {
    if (num < 1000) return num.toString();
    
    return Math.floor(num / 1000).toString() + formatFractionalPart(num, 1000) + 'K';
};

let gitHubEmojisBuffer = null;

export const getGitHubEmojiImage = async (emoji) => {
    if (gitHubEmojisBuffer === null)
        await fetch('https://api.github.com/emojis', {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json'
            }
        }).then(data => data.json()).then(obj => gitHubEmojisBuffer = obj).catch(console.error);
    
    if (gitHubEmojisBuffer === null)
        return undefined;

    return emoji in gitHubEmojisBuffer ? gitHubEmojisBuffer[emoji] : undefined;
};

export const setVisibility = (visibility) => visibility ? '' : 'invisible';

export const parseDescription = async description => {
  const parts = description.split(':');
  const newDescription = [];
  let lock = false;

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];

    if (!lock) {
      let image = await getGitHubEmojiImage(part);

      if (image) {
        newDescription.push(<img src={image} className='emoji' key={image+description}/>);
        lock = true;
        continue;
      }
    }

    let addSemicolon = !lock && i !== parts.length - 1 && (i !== 0 || part !== '');

    newDescription.push(part + (addSemicolon ? ':' : ''));
    lock = false;
  }

  return newDescription;
}
