export enum RequestMethod {
    GET,
    POST
}

const API_URL = 'http://localhost:3000'

export const getRequestOptions = (pathname: string, method = RequestMethod.GET) => {
    const url = new URL(API_URL + pathname);

    return {
        hostname: url.hostname,
        port: url.port,
        method: RequestMethod[method],
        path: url.pathname,
        headers: {
            'Content-Type': 'application/json'
        }
    } as const;
};