export const findAll = (regex, text) => {
    const groups = [];

    for (let match of text.matchAll(regex)) {
        let currentMatchStart = match.index;

        for (let groupName in match.groups) {
            let groupText = match.groups[groupName];

            if (groupText) {
                const subGroups = [];

                let i = 0;

                while (match[i]) {
                    subGroups.push(match[i]);
                    i++;
                }

                if (subGroups.length > 1 && subGroups[0] === subGroups[1])
                    subGroups.splice(0, 1);

                groups.push({
                    group: groupName,
                    text: groupText,
                    start: currentMatchStart,
                    end: currentMatchStart + groupText.length,
                    groups: subGroups
                });
            }
        }
    }

    return groups;
};

export const noSkipFindAll = (regex, text, notDefinedGroupName='other') => {
    /*
    * Unlike the findall implementation, there are no skipped substrings in this implementation. 
    * Anything that was not found using the specified regular expression will be declared as found, 
    * under the group name specified in the `notDefinedGroupName` variable
    */

    const matches = findAll(regex, text);

    if (matches.length === 0)
        return [{
            group: notDefinedGroupName,
            text: text,
            start: 0,
            end: text.length,
            groups: [text]
        }];

    var lastSegmentEnd = 0;
    var currentMatchStart = 0;

    const groups = [];

    const tryPushOtherGroup = (calledAfterLoop=false) => {
        if (lastSegmentEnd === currentMatchStart) return;

        let groupText;
        
        if (calledAfterLoop) {
            groupText = text.slice(lastSegmentEnd);

            if (groupText === '') return;
        } else groupText = text.slice(lastSegmentEnd, currentMatchStart);

        let segmentEnd = lastSegmentEnd + groupText.length;

        groups.push({
            group: notDefinedGroupName,
            text: groupText,
            start: lastSegmentEnd,
            end: segmentEnd,
            groups: [groupText]
        });

        lastSegmentEnd = segmentEnd;
    };

    for (let match of matches) {
        currentMatchStart = match.start;

        tryPushOtherGroup();
        groups.push(match);

        lastSegmentEnd = match.end;
    }

    tryPushOtherGroup(true);

    return groups;
};
