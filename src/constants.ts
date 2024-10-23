import {Result} from "./result";
import fs from 'fs';

const TOKEN_FILE = 'src/data/sensitive/github.token';

// this action is placed in a separate named function to focus on the possible occurrence of an error
const getGithubTokenOrThrow = () => fs.readFileSync(TOKEN_FILE, 'utf8');

const GITHUB_CONFIG = {
    token: getGithubTokenOrThrow(),
    endpoint: 'https://api.github.com/search/repositories',
    query: '?q=stars:>10000&sort=stars&order=desc'
} as const;

export const GITHUB_REQUEST_OPTIONS = {
    hostname: 'api.github.com',
    port: 443,
    path: GITHUB_CONFIG.endpoint + GITHUB_CONFIG.query,
    method: 'GET',
    headers: {
        'Authorization': 'token ' + GITHUB_CONFIG.token,
        'User-Agent': 'https://github.com/aratakileo/gittop-api'
    } as const
} as const;

// 10 minutes
export const UPDATE_INTERVAL_MILLISECONDS = 10 * 60 * 100;

export type Callback<T = void, E = unknown> = (result: Result<T | null, E | null>) => void;
