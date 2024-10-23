export function requireNotNull<T>(value: T) {
    if (value === null || value === undefined)
        throw Error('values is null');

    return value;
}