import { nullOrUndefined } from "../utils";
import { normalizeResponseHead, ResponseCode, ResponseError } from "./constants";
import http from "http";

export class Responser {
    private code: ResponseCode = ResponseCode.OK;
    private responseBody: string | null | undefined = null;
    private head: any = {'Content-Type': 'application/json'};
    private readonly response: http.ServerResponse;

    public constructor(response: http.ServerResponse) {
        this.response = response;
    }

    public setCode(code: ResponseCode) {
        this.code = code;
        return this;
    }

    public setBody(body: string | null | undefined) {
        this.responseBody = body;
        return this;
    }

    public setHead(head: any) {
        this.head = head;
        return this;
    };

    public makeHeadEmpty() {
        this.head = {};
        return this;
    }

    public removeBody() {
        this.responseBody = null;
        this.code = ResponseCode.NO_CONTENT;
        return this;
    }

    public sendRouteNotFoundError(description = 'the requested route does not exist') {
        this.code = ResponseCode.NOT_FOUND;
        this.setErrorBody(ResponseError.NOT_FOUND, description).send();
    }

    public setErrorBody(error: ResponseError, description: string) {
        return this.setJsonBody({
            error: ResponseError[error],
            description: description
        });
    }

    public setJsonBody(object: any) {
        this.responseBody = JSON.stringify(object);
        return this;
    }

    public send() {
        this.response.writeHead(this.code, normalizeResponseHead(this.head));

        if (nullOrUndefined(this.responseBody))
            this.response.end();
        else this.response.end(this.responseBody);
    }
}