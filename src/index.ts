import {Callback, GITHUB_REQUEST_OPTIONS} from "./constants";
import * as https from "https";
import {Result} from "./result";

const getRepositories = (callback: Callback<any, Error>) => {
    const request = https.request(GITHUB_REQUEST_OPTIONS, res => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => Result.trySendResultToCallback(
            () => JSON.parse(data).items,
            callback
        ));
    });

    request.on('error', err => callback(Result.err(err)));
    request.end();
};

getRepositories(result => {
    if (result.is_err) {
        console.log("ошибка :( ", result.unwrap());
        return;
    }

    console.log("а вот и наши репозитории:", result.unwrap());
});
