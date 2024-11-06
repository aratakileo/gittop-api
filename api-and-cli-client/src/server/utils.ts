import {PathLike, readFileSync} from "fs";
import {Result} from '../utils';

export const readFileAndGetOrThrow = (filePath: PathLike, err_message: string) => {
    try {
        return readFileSync(filePath, 'utf8').replace(/^[\n\t]+|[\n\t]+$/g, '');
    } catch {
        throw Error(err_message);
    }
}

export const runImmediatelyAndThenEvery = (callback: () => void, ms: number) => {
    callback();
    return setInterval(callback, ms);
}

export const normalizeRepositoryObject = (repo: any) => (repo ? {
        id: repo.id,
        name: repo.name,
        stars: repo.stars,
        description: repo.description,
        lang: repo.lang,
        owner: {
            id: repo.owner_id,
            username: repo.owner_username
        },
        url: `https://github.com/${repo.owner_username}/${repo.name}`
} : repo);

export class RepositorySign {
    public readonly name: string | null
    public readonly id: number | null

    public constructor(repo_name_or_id: string) {
        const repo_id = parseInt(repo_name_or_id);

        if (isNaN(Number(repo_name_or_id))) {
            this.name = repo_name_or_id;
            this.id = null;
        } else {
            this.id = repo_id;
            this.name = null;
        }
    }

    public get isById() {
        return this.id !== null;
    }

    public toString() {
        return 'repository with ' + (this.isById ? `id '${this.id}'` : `name '${this.name}'`);
    }
}

export const parseSysArgFlags = (expectedFlags: any) => {
    const values = new Map<string, any>();

    for (const arg of process.argv.slice(2)) {
        if (arg[0] !== '-')
            return Result.errOf(`expected '-' at start of argument '${arg}'`);

        if (!arg.includes('='))
            return Result.errOf(`expected '=' in argument '${arg}'`);

        const sepIndex = arg.indexOf('=');
        const argKey = arg.slice(1, sepIndex);

        if (!(argKey in expectedFlags))
            return Result.errOf(`unexpected argument with name '${argKey}'`);

        const notParsedValue = arg.slice(sepIndex + 1);

        if (notParsedValue === '')
            return Result.errOf(`empty value of argument '${arg}'`);

        const expectedType = expectedFlags[argKey];

        if (['false', 'true', 'no', 'yes', 'on', 'off'].includes(notParsedValue)) {
            if (expectedType !== 'bool')
                return Result.errOf(`expected type '${expectedType}' for argument '${argKey}' but got 'bool'`);

            values.set(argKey, ['true', 'yes', 'on'].includes(notParsedValue));
            continue;
        }

        if (Number.isInteger(notParsedValue)) {
            if (expectedType !== 'int')
                return Result.errOf(`expected type '${expectedType}' for argument '${argKey}' but got 'int'`);

            values.set(argKey, Number(notParsedValue));
            continue;
        }

        return Result.errOf(`invalid value of argument '${arg}'`);
    };

    return Result.ok(Object.freeze(Object.fromEntries(values)));
}

export const getValueOrDefault = (obj: any, key: string, _default: any) => key in obj ? obj[key] : _default;

export const getNamedFilterSubQuery = (columnName: string, comparableValues: any[]) => {
    if (comparableValues.length === 0)
        return ({
            query: 'true',
            values: []
        });
    
    return ({
        query: `LOWER(IFNULL(${columnName}, 'n/a')) IN (?)`,
        values: [comparableValues.map(str => str.toLowerCase())]
    });
};
