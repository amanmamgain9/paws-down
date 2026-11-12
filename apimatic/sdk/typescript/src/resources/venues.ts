import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import * as s from "../core/validation/index.js";
import { venueSchema, type Venue } from "../models/venue.js";
import type { Servers } from "../servers.js";

/**
 * The public places a date can happen at.
 */
export class Venues {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
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
  listVenues(options?: RequestOptions): ApiPromise<Venue[], ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/venues"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.lazy(() => venueSchema)) },
        errorFactory: ApiError,
      },
      options,
    );
  }
}
