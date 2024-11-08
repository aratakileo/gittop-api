export enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS'
}

export namespace RequestMethod {
    export const parse = (method: string): RequestMethod | undefined => {
        switch (method.toLocaleLowerCase()) {
            case 'get':
                return RequestMethod.GET;
            case 'post':
                return RequestMethod.POST;
            case 'put':
                return RequestMethod.PUT;
            case 'delete':
                return RequestMethod.DELETE;
            case 'options':
                return RequestMethod.OPTIONS;
            default:
                return undefined;
        }
    };
}

const API_URL = 'http://localhost:3000';

export const getRequestOptions = (pathname: string, method = RequestMethod.GET) => {
    const url = new URL(API_URL + pathname);

    return {
        hostname: url.hostname,
        port: url.port,
        method: RequestMethod[method],
        path: `${url.pathname}?${url.searchParams}`,
        headers: {
            'Content-Type': 'application/json'
        }
    } as const;
};