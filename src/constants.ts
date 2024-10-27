import {readFileAndGetOrThrow} from "./utils";

const SENSITIVE_DIR = 'src/data/sensitive/';
export const REPOSITORIES_CONTAINER_FILE_PATH = 'src/data/cached/repositories.json';
export const REPOS_ON_PAGE = 10;

const GITHUB_CONFIG = {
    token: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'github.token',
        'expected file `src/data/sensitive/github.token` with inserted GitHub token there'
    ),
    endpoint: 'https://api.github.com/search/repositories',
    query: '?q=stars:>10000&sort=stars&order=desc'
} as const;

export const GITHUB_REQUEST_OPTIONS = {
    hostname: 'api.github.com',
    port: 443,
    path: GITHUB_CONFIG.endpoint + GITHUB_CONFIG.query,
    method: 'GET',
    headers: {
        'Authorization': GITHUB_CONFIG.token,  // using GitHub token allows to make a way more requests
        'User-Agent': 'https://github.com/aratakileo/gittop-api'
    } as const
} as const;

export const DB_CONFIG = {
    host: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'db.host',
        'expected file `src/data/sensitive/db.host` with inserted database host there'
    ),
    user: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'db.username',
        'expected file `src/data/sensitive/db.username` with inserted database username there'
    ),
    password: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'db.password',
        'expected file `src/data/sensitive/db.password` with inserted database password there'
    ),
    database: 'popular_repositories'
} as const;

export const MILLISECONDS_PER_MINUTE = 60 * 1000;
