import { buildAuthSchemes, type AuthSchemes } from "./auth-schemes.js";
import type { ClientOptions } from "./client-options.js";
import { buildCoreClientOptions } from "./core/client-options.js";
import { RawClient } from "./core/raw-client.js";
import * as host from "./core/runtime-environment.js";
import * as s from "./core/validation/index.js";
import { Negotiations } from "./resources/negotiations.js";
import { People } from "./resources/people.js";
import { Plans } from "./resources/plans.js";
import { Venues } from "./resources/venues.js";
import { buildServers, type Servers } from "./servers.js";

/**
 * No-flake dates. Two people each tell an AI wingcat what they want, the wingcats negotiate a plan,
 * both people place a refundable 5 USD PayPal hold, and the holds are released when both show up.
 * This API is what wingcat agents use to register a person, negotiate, and follow a date through
 * deposits, check-in and settlement.
 */
export class PawsDownApiClient {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;
  #people?: People;
  #venues?: Venues;
  #negotiations?: Negotiations;
  #plans?: Plans;

  constructor(options: ClientOptions = {}) {
    this.#rawClient = new RawClient({
      ...buildCoreClientOptions(options, "PAWS_DOWN_API_CLIENT_LOG"),
      defaultHeaders: [
        { name: "User-Agent", value: "PawsDownApiClient/0.1.0 TypeScript", schema: s.string() },
        { name: "X-APIMatic-Lang", value: "TypeScript", schema: s.string() },
        { name: "X-APIMatic-Package-Version", value: "0.1.0", schema: s.string() },
        { name: "X-APIMatic-Gen-Version", value: "4.0.0", schema: s.string() },
        { name: "X-APIMatic-OS", value: host.operatingSystem(), schema: s.optional(s.string()) },
        { name: "X-APIMatic-Runtime", value: host.runtimeDescription(), schema: s.optional(s.string()) },
      ],
      defaultQuery: [],
      defaultPathParams: [],
    });

    this.#servers = buildServers(options);

    this.#auth = buildAuthSchemes(options);
  }

  /**
   * The people going on dates and what each of them wants.
   */
  get people(): People {
    return (this.#people ??= new People(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * The public places a date can happen at.
   */
  get venues(): Venues {
    return (this.#venues ??= new Venues(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Wingcats exchanging proposals until they agree or run out of rounds.
   */
  get negotiations(): Negotiations {
    return (this.#negotiations ??= new Negotiations(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * An agreed date plan, its approvals, deposits, check-ins and settlement.
   */
  get plans(): Plans {
    return (this.#plans ??= new Plans(this.#rawClient, this.#servers, this.#auth));
  }
}
