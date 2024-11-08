import { Result } from "./utils";

export enum ValueType {
    ANY,
    BOOL,
    INT,
    UINT
};

export const defineValueType = (value: string) => {
    if (/^[-+]?\d+$/g.test(value)) 
        return value.startsWith('-') ? ValueType.INT : ValueType.UINT;

    if (['false', 'true', 'no', 'yes', 'on', 'off'].includes(value))
        return ValueType.BOOL;

    return ValueType.ANY;
};

export const isInt = (value: string) => [ValueType.INT, ValueType.UINT].includes(defineValueType(value));

export const parseValue = (value: string, valueType: ValueType) => {
    if (value.length === 0)
        return undefined;

    switch (valueType) {
        case ValueType.ANY:
            return value;
        case ValueType.BOOL:
            return defineValueType(value) === ValueType.BOOL ? ['true', 'yes', 'on'].includes(value) : undefined;
        case ValueType.INT:
            return isInt(value) ? Number(value) : undefined;
        case ValueType.UINT:
            return defineValueType(value) === ValueType.UINT ? Number(value) : undefined;
    }
};

interface ExpectedFlags {
    [key: string]: ValueType
}

export const parseFlags = (flags: string[], expectedFlags: ExpectedFlags) => {
    const values = new Map<string, any>();

    for (const flag of flags) {
        if (!flag.includes('='))
            return Result.errOf(`expected '=' in argument '${flag}'`);

        const sepIndex = flag.indexOf('=');
        const argKey = flag.slice(0, sepIndex);

        if (!(argKey in expectedFlags))
            return Result.errOf(`unexpected argument with name '${argKey}'`);

        const notParsedValue = flag.slice(sepIndex + 1);

        if (notParsedValue === '')
            return Result.errOf(`empty value of argument '${flag}'`);

        const expectedType = expectedFlags[argKey];
        const parsedValue = parseValue(notParsedValue, expectedType);

        if (parsedValue === undefined)
            return Result.errOf(`expected type '${ValueType[expectedType]}' for argument '${argKey}' but got '${ValueType[defineValueType(notParsedValue)]}'`);

        values.set(argKey, parsedValue);
    };

    return Result.ok(Object.freeze(Object.fromEntries(values)));
};