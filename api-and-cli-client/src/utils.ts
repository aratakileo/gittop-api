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
