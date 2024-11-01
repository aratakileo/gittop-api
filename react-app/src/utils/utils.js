const formatFractionalPart = (num, divider) => {
    const lastDigit = (num % divider).toString()[0];

    return lastDigit === '0' ? '' : (',' + lastDigit);
};

export const formatedNumericValue = (num) => {
    if (num < 1000) return num.toString();
    
    return Math.floor(num / 1000).toString() + formatFractionalPart(num, 1000) + 'K';
};

export const applyVisibility = (className, visibility) => visibility ? className : `${className} invisible`;

export const isNullOrUndefined = obj => {
  return obj === null || obj === undefined;
};

export const requireValue = obj => {
  if (obj === null)
    throw Error('value is null');

  if (obj === undefined)
    throw Error('value is undefined');

  return obj;
};

export const len = obj => {
  requireValue(obj);

  if (obj.length !== undefined)
    return obj.length;

  return Object.getOwnPropertyNames(obj).length + Object.getOwnPropertySymbols(obj).length;
};

export const isEmpty = obj => {
  if (isNullOrUndefined(obj))
    return true;

  return len(obj) === 0;
};
