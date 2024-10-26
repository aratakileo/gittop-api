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
    setInterval(callback, ms);
}
