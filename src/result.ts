import {requireNotNull} from "./utils";

export class Result<T = void, E = unknown> {
    private readonly _ok: T | null;
    private readonly _err: E | null;

    private constructor(ok: T | null, err: E | null) {
        this._ok = ok;
        this._err = err;
    }

    public get is_ok() {
        return this._ok !== null;
    }

    public get is_err() {
        return this._err !== null;
    }

    public unwrap(): T | E {
        return requireNotNull(this.is_ok ? this._ok : this._err);
    }

    public static ok<T = void>(_ok: T): Result<T, null> {
        return new Result(_ok, null);
    }

    public static err<E = void>(_err: E): Result<null, E> {
        return new Result(null, _err);
    }

    public static tryGetResult<T = void>(resultGetter: () => T) {
        try {
            return Result.ok(resultGetter());
        } catch (e) {
            return Result.err(e);
        }
    }

    public static trySendResultToCallback<T = void>(
        resultGetter: () => T,
        callback: (result: Result<T | null, any>) => void
    ) {
        callback(Result.tryGetResult(resultGetter));
    }
}