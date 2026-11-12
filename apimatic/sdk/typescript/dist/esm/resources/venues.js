import { ApiError } from "../core/api-error.js";
import * as s from "../core/validation/index.js";
import { venueSchema } from "../models/venue.js";
/**
 * The public places a date can happen at.
 */
export class Venues {
    #rawClient;
    #servers;
    #auth;
    constructor(rawClient, servers, auth) {
        this.#rawClient = rawClient;
        this.#servers = servers;
        this.#auth = auth;
    }
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
    listVenues(options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/venues"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: s.array(s.lazy(() => venueSchema)) },
            errorFactory: ApiError,
        }, options);
    }
}
//# sourceMappingURL=venues.js.map