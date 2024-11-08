import {existsSync, PathLike, readFileSync} from "fs";
import { isInt } from "../parseUtil";

export const readFileAndGetOrThrow = (filePath: PathLike, err_message: string) => {
    try {
        return readFileSync(filePath, 'utf8').replace(/^[\n\t]+|[\n\t]+$/g, '');
    } catch {
        throw Error(err_message);
    }
};

export const readFileAndGetOrElse = (filePath: PathLike, elseText: string) => {
    if (existsSync(filePath))
        return readFileSync(filePath, 'utf8').replace(/^[\n\t]+|[\n\t]+$/g, '');

    return elseText;
};

export const runImmediatelyAndThenEvery = (callback: () => void, ms: number) => {
    callback();
    return setInterval(callback, ms);
};

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
        if (isInt(repo_name_or_id)) {
            this.id = Number(repo_name_or_id);
            this.name = null;
        } else {
            this.name = repo_name_or_id;
            this.id = null;
        }
    }

    public get isById() {
        return this.id !== null;
    }

    public toString() {
        return 'repository with ' + (this.isById ? `id '${this.id}'` : `name '${this.name}'`);
    }
}

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
