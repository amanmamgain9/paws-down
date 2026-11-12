import type { ClientOptions } from "./client-options.js";
import { Negotiations } from "./resources/negotiations.js";
import { People } from "./resources/people.js";
import { Plans } from "./resources/plans.js";
import { Venues } from "./resources/venues.js";
/**
 * No-flake dates. Two people each tell an AI wingcat what they want, the wingcats negotiate a plan,
 * both people place a refundable 5 USD PayPal hold, and the holds are released when both show up.
 * This API is what wingcat agents use to register a person, negotiate, and follow a date through
 * deposits, check-in and settlement.
 */
export declare class PawsDownApiClient {
    #private;
    constructor(options?: ClientOptions);
    /**
     * The people going on dates and what each of them wants.
     */
    get people(): People;
    /**
     * The public places a date can happen at.
     */
    get venues(): Venues;
    /**
     * Wingcats exchanging proposals until they agree or run out of rounds.
     */
    get negotiations(): Negotiations;
    /**
     * An agreed date plan, its approvals, deposits, check-ins and settlement.
     */
    get plans(): Plans;
}
