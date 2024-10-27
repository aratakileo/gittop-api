import http from "http";
import {URL} from "url";
import {RepositorySign} from "./utils";


export enum ResponseCode {
    OK = 200,
    BAD_REQUEST = 400,
    NOT_FOUND = 404,
    INTERNAL_ERROR = 500
}


export enum ResponseError {
    NOT_FOUND,
    DEPRECATED,
    INVALID,
    INTERNAL_ERROR
}


enum ApiVersion {
    V1,
    V2
}


export enum ApiCall {
    GET_REPO,
    GET_REPOS,
    GET_REPO_PAGES_COUNT,
    SYNCNOW
}


export type ApiCallProcessor = (
    apiCall: ApiCall,
    data: any,
    resolve: (body: any) => void,
    reject: (error: ResponseError, description: string, code: ResponseCode) => void
) => void;


class ServerRequestProcessor {
    readonly req: http.IncomingMessage
    readonly res: http.ServerResponse
    readonly url: URL
    readonly pathnameSegments: Array<string>
    readonly params:  URLSearchParams
    readonly __apiCallProcessor: ApiCallProcessor
    __apiVersion: ApiVersion | null = null

    public constructor(req: http.IncomingMessage, res: http.ServerResponse, callback: ApiCallProcessor) {
        this.req = req;
        this.res = res;

        if (req.url === undefined)
            throw Error('request url is undefined');

        this.url = new URL(req.url, `https://${req.headers.host}`);
        this.pathnameSegments = this.url.pathname.split('/').slice(1);
        this.params = this.url.searchParams;
        this.__apiCallProcessor = callback;
    }

    get apiVersion() {
        if (this.__apiVersion === null)
            throw Error('ApiVersion is null');

        return this.__apiVersion;
    }

    public processRoute() {
        if (this.pathnameSegments.length < 2) {
            this.sendRouteNodFoundMessage();
            return;
        }

        switch (this.pathnameSegments[0]) {
            case 'v1':
                this.__apiVersion = ApiVersion.V1;
                break;
            case 'v2':
                this.__apiVersion = ApiVersion.V2;
                break;
            default:
                this.sendRouteNodFoundMessage(`requested invalid api version '${this.pathnameSegments[0]}'`);
                return;
        }

        switch (this.pathnameSegments[1]) {
            case 'repo':
                this.handleRepositoryGet();
                break;
            case 'repos':
                this.handleRepositoriesGet()
                break;
            case 'syncnow':
                this.handleSyncNow();
                break;
            default:
                this.sendRouteNodFoundMessage();
                return;
        }
    }

    handleRepositoryGet() {
        if (this.pathnameSegments.length < 3 || this.pathnameSegments[2] == '') {
            this.sendRouteNodFoundMessage('expected repository name or id');
            return;
        }

        this.processApiCall(ApiCall.GET_REPO, new RepositorySign(this.pathnameSegments[2]))
    }

    handleRepositoriesGet() {
        if (this.apiVersion === ApiVersion.V1) {
            /*
            * the legend is as follows:
            * this is necessary because in the first version there was no limit on the number of repositories returned
            */
            this.sendErrorMessage(
                ResponseError.DEPRECATED,
                'use api v2 instead for this kind of request',
                ResponseCode.BAD_REQUEST
            );
            return;
        }

        if (this.pathnameSegments.length < 3 || !['page', 'pages'].includes(this.pathnameSegments[2])) {
            this.sendRouteNodFoundMessage();
            return;
        }

        if (this.pathnameSegments[2] == 'pages') {
            this.processApiCall(ApiCall.GET_REPO_PAGES_COUNT);
            return;
        }

        if (this.pathnameSegments.length < 4) {
            this.sendErrorMessage(
                ResponseError.INVALID,
                'expected page number in request',
                ResponseCode.BAD_REQUEST
            );
            return;
        }

        if (this.pathnameSegments[3] === '') {
            this.sendErrorMessage(
                ResponseError.INVALID,
                `the requested repositories page number is empty`,
                ResponseCode.BAD_REQUEST
            );
            return;
        }

        const pageNum = parseInt(this.pathnameSegments[3]);

        if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 0) {
            this.sendErrorMessage(
                ResponseError.INVALID,
                `the requested repositories page number '${this.pathnameSegments[3]}' is invalid`,
                ResponseCode.BAD_REQUEST
            );
            return;
        }

        this.processApiCall(ApiCall.GET_REPOS, {page: pageNum});
    }

    handleSyncNow() {
        this.processApiCall(ApiCall.SYNCNOW);
    }

    processApiCall(apiCall: ApiCall, data: any = null) {
        this.__apiCallProcessor(apiCall, data, this.sendJsonResponse, this.sendErrorMessage);
    }

    sendRouteNodFoundMessage = (description: string = 'the requested route does not exist') => {
        this.sendErrorMessage(
            ResponseError.NOT_FOUND,
            description,
            ResponseCode.NOT_FOUND
        );
    }

    sendErrorMessage = (
        error: ResponseError,
        description: string,
        code: ResponseCode
    ) => {
        const body = {
            error: ResponseError[error],
            description: description
        };

        this.sendJsonResponse(body, code);
    }

    sendJsonResponse = (body: any, code = ResponseCode.OK) => {
        this.res.writeHead(code, { 'Content-Type': 'application/json' });
        this.res.end(JSON.stringify(body));
    }
}


export class ApiServer {
    readonly serverPort: number
    private readonly server: http.Server

    public constructor(callback: ApiCallProcessor, serverPort: number = 3000) {
        this.serverPort = serverPort;
        this.server = http.createServer((req, res) => {
            const requestProcessor = new ServerRequestProcessor(req, res, callback);
            requestProcessor.processRoute();
        });
    }

    public run() {
        this.server.listen(this.serverPort, () => {
            console.log(`API server listening on port ${this.serverPort}`);
        });
    }
}
