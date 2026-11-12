import type { ApiRequest, RequestOptions, RawClientOptions } from "./api-request.js";
import type { ApiError } from "./api-error.js";
import { type ResponseHandler } from "./response-decoder.js";
import { ApiPromise } from "./api-promise.js";
import { Pageable } from "./pagination/pageable.js";
import type { PagingState } from "./pagination/states/paging-state.js";
export declare class RawClient {
    #private;
    constructor(config: RawClientOptions);
    execute<T, E extends ApiError>(apiRequest: ApiRequest, responseHandler: ResponseHandler<T, E>, options?: RequestOptions): ApiPromise<T, E>;
    paginate<TRequest, TPage, TItem, E extends ApiError, TState extends PagingState<TPage, TState>>(request: TRequest, state: TState, buildRequest: (request: TRequest, state: TState) => ApiRequest, responseHandler: ResponseHandler<TPage, E>, itemsSelector: (page: TPage) => readonly TItem[] | null | undefined, options?: RequestOptions): Pageable<TPage, TItem, E>;
}
