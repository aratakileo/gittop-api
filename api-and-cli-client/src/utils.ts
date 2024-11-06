import https from "https";
import http from "http";
import { existsSync, mkdirSync } from "fs";

export const fetchApi = (
    requestOptions: any,
    supportsSslTls=true
) => new Promise<any>((resolve, reject) => {
    const req = (supportsSslTls ? https : http).request(requestOptions, res => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                resolve({
                    body: JSON.parse(data),
                    status: res.statusCode
                });
            } catch (e) {
                reject(e);
            }
        });
    });

    req.on('error', err => reject(err));
    req.end();
});


export const mkdirSyncIfDoesNotExist = (path: string) => {if (!existsSync(path)) mkdirSync(path);};

export const nullOrUndefined = (obj: any) => {
    return obj === null || obj === undefined;
};

export type Result<T, E = Error> =
| { is_ok: true; val: T }
| { is_ok: false; err: E };

export namespace Result {
    export const ok = <T>(val: T): Result<T, null> => ({is_ok: true, val});
    export const err = <E = Error>(err: E): Result<null, E> => ({is_ok: false, err});
    export const errOf = (err: string): Result<null, Error> => ({is_ok: false, err: Error(err)});
}
