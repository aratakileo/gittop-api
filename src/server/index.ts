import {
    ApiCall,
    DB_CONFIG,
    GITHUB_REQUEST_OPTIONS,
    MILLISECONDS_PER_MINUTE,
    REPOS_ON_PAGE,
    REPOSITORIES_CONTAINER_FILE_PATH, ResponseCode, ResponseError
} from "./constants";
import {existsSync, readFileSync, writeFileSync} from "fs";
import mysql from "mysql2";
import {normalizeRepositoryObject, RepositorySign, runImmediatelyAndThenEvery} from "./utils";
import {ApiServer} from "./apiServer";
import {fetchApi, mkdirSyncIfDoesNotExist} from "../utils";

const getProgramConfig = () => {
    const config = {
        request_delay_in_minutes: 10,
        use_cached_data: true
    }

    const programArgs = process.argv.slice(2);

    programArgs.forEach(arg => {
        if (arg.startsWith('-qdm='))
            config.request_delay_in_minutes = Number(arg.slice(5));
        else if (arg.startsWith('-ucd=') && (arg.endsWith('false') || arg.endsWith('true')))
            config.use_cached_data = arg.slice(5) != 'false';
        else throw Error('invalid argument ' + arg);
    });

    return Object.freeze(config);
};

const programConfig = getProgramConfig();

console.log('Has ran with config:', programConfig)

const getRepositories = () => new Promise<Array<any>>((resolve, reject) => {
    if (existsSync(REPOSITORIES_CONTAINER_FILE_PATH) && programConfig.use_cached_data) {
        // it is necessary to do not make unnecessary calls to the GitHub API during the debugging or development stage
        resolve(JSON.parse(readFileSync(REPOSITORIES_CONTAINER_FILE_PATH, 'utf8')));
        return;
    }

    fetchApi(GITHUB_REQUEST_OPTIONS).then(data => {
        let result = data.body.items;
        
        mkdirSyncIfDoesNotExist(REPOSITORIES_CONTAINER_FILE_PATH.slice(0, REPOSITORIES_CONTAINER_FILE_PATH.lastIndexOf('/')));
        writeFileSync(REPOSITORIES_CONTAINER_FILE_PATH, JSON.stringify(result));

        resolve(result);
    }).catch(reject);
});

const saveData = async (repos: Array<any>) => {
    const pool = mysql.createPool(DB_CONFIG);

    const owner_query = 'INSERT INTO owners (`id`, `username`) VALUES ? ON DUPLICATE KEY UPDATE `id` = `id`';
    const owner_values = repos.map(repo => [
        repo.owner.id,
        repo.owner.login
    ]);

    pool.query(owner_query, [owner_values], (err, result) => {
        if (err) throw err;
        console.log('Successfully added new owners:', result);
    });

    const repo_query = 'INSERT INTO repositories (`id`, `name`, `stars`, `description`, `lang`, `owner_id`) VALUES ? ON DUPLICATE KEY UPDATE `id` = `id`';
    const repo_values = repos.map(repo => [
        repo.id,
        repo.name,
        repo.stargazers_count,
        repo.description,
        repo.language,
        repo.owner.id
    ]);

    pool.query(repo_query, [repo_values], (err, result) => {
        if (err) throw err;

        console.log('Successfully added new repos:', result);
        pool.end();
    });
}

const collectData = async () => {
    console.log('Sending gitHub API request...');
    const repos = await getRepositories();
    console.log('Saving repositories...');
    await saveData(repos);
};

let intervalDataSyncer: NodeJS.Timeout | null = null;

const runIntervalDataSyncer = (force = false) => {
    if (intervalDataSyncer !== null && force) {
        clearInterval(intervalDataSyncer);
        intervalDataSyncer = null;
    }

    if (intervalDataSyncer === null)
        intervalDataSyncer = runImmediatelyAndThenEvery(
            collectData,
            programConfig.request_delay_in_minutes * MILLISECONDS_PER_MINUTE
        );
}

runIntervalDataSyncer();

const getRepos = (page: number) => new Promise<any>((resolve, reject) => {
    const pool = mysql.createPool(DB_CONFIG);
    const repos_query = 'SELECT *, (select username from owners where owners.id = owner_id) as owner_username FROM repositories limit ?, ?;';

    pool.query(repos_query, [page * REPOS_ON_PAGE, REPOS_ON_PAGE], (err, result) => {
        if (err) {
            reject(err);
            return;
        }

        // @ts-ignore
        resolve(result.map(row => normalizeRepositoryObject(row)));
    });
});

const getRepoPages = () => new Promise<any>((resolve, reject) => {
    const pool = mysql.createPool(DB_CONFIG);
    const pages_count_query = 'SELECT count(*) as count FROM repositories;';

    pool.query(pages_count_query, (err, result) => {
        if (err) {
            reject(err);
            return;
        }

        resolve({
            // @ts-ignore
            'pages': result[0].count % REPOS_ON_PAGE + Math.trunc(result[0].count / REPOS_ON_PAGE)
        });
    });
});

const getRepo = (repoSign: RepositorySign) => new Promise<any>((resolve, reject) => {
    const pool = mysql.createPool(DB_CONFIG);
    const query_values = [repoSign.isById ? repoSign.id : repoSign.name];
    const query_condition = repoSign.isById ? 'repositories.id = ?' : 'repositories.name = ?';
    const repo_query = `SELECT *, (select username from owners where owners.id = owner_id) as owner_username FROM repositories where ${query_condition};`;

    pool.query(repo_query, query_values, (err, result) => {
        if (err) {
            reject(err);
            return;
        }

        // @ts-ignore
        resolve(normalizeRepositoryObject(result[0]));
    });
});

const server = new ApiServer(async (apiCall, data, resolve, reject) => {
    const processPromise = (promise: Promise<any>, then: (result: any) => void) => promise.then(then).catch(reason => {
        // WARNING: never return error message as response due to it may have sensitive information
        reject(
            ResponseError.INTERNAL_ERROR,
            'oops, something went wrong...',
            ResponseCode.INTERNAL_ERROR
        );

        console.error(reason);
    });

    switch (apiCall) {
        case ApiCall.SYNCNOW:
            runIntervalDataSyncer(true);
            resolve({
                'message': 'Successfully synced just now'
            });
            return;
        case ApiCall.GET_REPOS:
            await processPromise(getRepos(data.page), repos => {
                if (repos.length == 0) {
                    reject(
                        ResponseError.INVALID,
                        `the requested repositories page number '${data.page}' is out of bounds`,
                        ResponseCode.BAD_REQUEST
                    );
                    return;
                }

                resolve({
                    repos: repos,
                    page: data.page
                });
            });
            return;
        case ApiCall.GET_REPO_PAGES_COUNT:
            await processPromise(getRepoPages(), result => resolve(result));
            return;
        case ApiCall.GET_REPO:
            await processPromise(getRepo(data), repo => {
                if (repo) {
                    resolve(repo);
                    return;
                }

                reject(
                    ResponseError.NOT_FOUND,
                    `requested ${data.toString()} does not exist`,
                    ResponseCode.BAD_REQUEST
                );
            });
            return;
    }
});

server.run();
