import {readFileAndGetOrThrow} from "./utils";

export const SERVER_DATA_DIR = 'src/server/data/';
const SENSITIVE_DIR = SERVER_DATA_DIR + 'sensitive/';
export const REPOSITORIES_CONTAINER_FILE_PATH = `${SERVER_DATA_DIR}cached/repositories.json`;
export const REPOS_ON_PAGE = 10;

const GITHUB_CONFIG = {
    token: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'github.token',
        `expected file '${SENSITIVE_DIR}github.token' with inserted GitHub token there`
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
        `expected file '${SENSITIVE_DIR}db.host' with inserted database host there`
    ),
    user: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'db.username',
        `expected file '${SENSITIVE_DIR}db.username' with inserted database username there`
    ),
    password: readFileAndGetOrThrow(
        SENSITIVE_DIR + 'db.password',
        `expected file '${SENSITIVE_DIR}db.password' with inserted database password there`
    ),
    database: 'popular_repositories'
} as const;

export const MILLISECONDS_PER_MINUTE = 60 * 1000;


export enum ResponseCode {
    OK = 200,
    BAD_REQUEST = 400,
    NOT_FOUND = 404,
    INTERNAL_ERROR = 500,
    NO_CONTENT = 204
}


export enum ResponseError {
    NOT_FOUND,
    DEPRECATED,
    INVALID,
    INTERNAL_ERROR
}


export enum ApiCall {
    GET_REPO,
    GET_REPOS,
    GET_REPO_PAGES_COUNT,
    SYNCNOW
}

export const DEFAULT_RESPONSE_HEAD = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000
} as const;

export const normalizeResponseHead = (head: any) => {
    return {...DEFAULT_RESPONSE_HEAD, ...head} as const;
};
