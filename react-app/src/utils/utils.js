const formatFractionalPart = (num, divider) => {
    const lastDigit = (num % divider).toString()[0];

    return lastDigit === '0' ? '' : (',' + lastDigit);
};

export const formatedNumericValue = (num) => {
    if (num < 1000) return num.toString();
    
    return Math.floor(num / 1000).toString() + formatFractionalPart(num, 1000) + 'K';
};

export const setVisibility = (visibility) => visibility ? '' : 'invisible';

export const nullOrUndefined = (obj) => {
  return obj === null || obj === undefined;
};
