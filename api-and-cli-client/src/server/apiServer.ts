import http from "http";
import {URL} from "url";
import {RepositorySign} from "./utils";
import {ApiCall, ResponseCode, ResponseError} from "./constants";
import { RequestMethod } from "../cli-client/constants";
import { Responser } from "./responseBuilder";


enum ApiVersion {
    V1,
    V2
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
    readonly method: RequestMethod | undefined
    readonly __apiCallProcessor: ApiCallProcessor
    readonly responser: Responser
    readonly params: any
    __apiVersion: ApiVersion | null = null

    public constructor(req: http.IncomingMessage, res: http.ServerResponse, callback: ApiCallProcessor) {
        this.req = req;
        this.res = res;

        if (req.url === undefined)
            throw Error('request url is undefined');

        this.url = new URL(req.url, `https://${req.headers.host}`);
        this.pathnameSegments = this.url.pathname.split('/').slice(1);
        this.method = req.method === undefined ? undefined : RequestMethod.parse(req.method);
        this.params = this.url.searchParams;
        this.responser = new Responser(res);
        this.__apiCallProcessor = callback;
    }

    get apiVersion() {
        if (this.__apiVersion === null)
            throw Error('apiVersion is null');

        return this.__apiVersion;
    }

    public processRoute() {
        if (this.pathnameSegments.length < 2) {
            this.responser.sendRouteNotFoundError();
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
                this.responser.sendRouteNotFoundError(`requested invalid api version '${this.pathnameSegments[0]}'`);
                return;
        }

        switch (this.method) {
            case RequestMethod.GET:
                this.handleGetMethod();
                return;
            case RequestMethod.POST:
                this.handlePostMethod();
                return;
            case RequestMethod.OPTIONS:
                this.responser.makeHeadEmpty().removeBody().send();
                return;
            default:
                this.sendErrorMessage(ResponseError.INVALID, 'the requested method does not exist', ResponseCode.BAD_REQUEST);
                return;
        }
    }

    handleGetMethod() {
        switch (this.pathnameSegments[1]) {
            case 'repo':
                this.handleRepositoryGet();
                return;
            case 'repos':
                this.handleRepositoriesGet()
                return;
            default:
                this.responser.sendRouteNotFoundError();
                return;
        }
    }

    handlePostMethod() {
        switch (this.pathnameSegments[1]) {
            case 'syncnow':
                this.handleSyncNow();
                return;
            default:
                this.responser.sendRouteNotFoundError();
                return;
        }
    }

    handleRepositoryGet() {
        if (this.pathnameSegments.length < 3 || this.pathnameSegments[2] == '') {
            this.responser.sendRouteNotFoundError('expected repository name or id');
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
            this.responser.sendRouteNotFoundError();
            return;
        }

        let langsFilter = [];

        if (this.params.has('langs'))
            try {
                langsFilter = JSON.parse(this.params.get('langs'));

                if (!Array.isArray(langsFilter) || langsFilter.some(lang => typeof lang !== 'string'))
                    throw Error();
            } catch {
                this.sendErrorMessage(ResponseError.INVALID, 'expected string[] for langs query parameter', ResponseCode.BAD_REQUEST);
                return;
            }

        if (this.pathnameSegments[2] == 'pages') {
            this.processApiCall(ApiCall.GET_REPO_PAGES_COUNT, langsFilter);
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

        this.processApiCall(ApiCall.GET_REPOS, {page: pageNum, langs: langsFilter});
    }

    handleSyncNow() {
        this.processApiCall(ApiCall.SYNCNOW);
    }

    processApiCall(apiCall: ApiCall, data: any = null) {
        this.__apiCallProcessor(apiCall, data, this.sendJsonResponse, this.sendErrorMessage);
    }

    sendErrorMessage = (
        error: ResponseError,
        description: string,
        code: ResponseCode
    ) => {
        this.responser.setErrorBody(error, description).setCode(code).send();
    };

    sendJsonResponse = (body: any, code = ResponseCode.OK) => {
        this.responser.setJsonBody(body).setCode(code).send();
    };
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
