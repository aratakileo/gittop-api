import {PathLike, readFileSync} from "fs";

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

        if (isNaN(repo_id)) {
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
