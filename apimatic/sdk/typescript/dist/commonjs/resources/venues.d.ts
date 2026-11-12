import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import { type Venue } from "../models/venue.js";
import type { Servers } from "../servers.js";
/**
 * The public places a date can happen at.
 */
export declare class Venues {
    #private;
    constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes);
    /**
     * List the public venues a date can happen at
     *
     * @remarks
     * Dates happen at public places only. A proposal must name a venue and area from this list and
     * cost at least the venue's price.
     *
     * @returns The venues.
     *
     * @throws {@link ApiError} when the API answers with an error status
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    listVenues(options?: RequestOptions): ApiPromise<Venue[], ApiError>;
}
