import {DB_CONFIG, GITHUB_REQUEST_OPTIONS, MILLISECONDS_PER_MINUTE, REPOSITORIES_CONTAINER_FILE_PATH} from "./constants";
import https from "https";
import {existsSync, readFileSync, writeFileSync} from "fs";
import mysql from "mysql2";
import {runImmediatelyAndThenEvery} from "./utils";

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
        // it is necessary to do not make unnecessary calls to the GitHub API during the debugging stage
        resolve(JSON.parse(readFileSync(REPOSITORIES_CONTAINER_FILE_PATH, 'utf8')));
        return;
    }

    const request = https.request(GITHUB_REQUEST_OPTIONS, res => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            let result = JSON.parse(data).items;

            writeFileSync(REPOSITORIES_CONTAINER_FILE_PATH, JSON.stringify(result));

            resolve(result);
        });
    });

    request.on('error', err => reject(err));
    request.end();
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

runImmediatelyAndThenEvery(collectData, programConfig.request_delay_in_minutes * MILLISECONDS_PER_MINUTE);
