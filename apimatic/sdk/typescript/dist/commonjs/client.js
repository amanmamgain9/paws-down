"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PawsDownApiClient = void 0;
const auth_schemes_js_1 = require("./auth-schemes.js");
const client_options_js_1 = require("./core/client-options.js");
const raw_client_js_1 = require("./core/raw-client.js");
const host = __importStar(require("./core/runtime-environment.js"));
const s = __importStar(require("./core/validation/index.js"));
const negotiations_js_1 = require("./resources/negotiations.js");
const people_js_1 = require("./resources/people.js");
const plans_js_1 = require("./resources/plans.js");
const venues_js_1 = require("./resources/venues.js");
const servers_js_1 = require("./servers.js");
/**
 * No-flake dates. Two people each tell an AI wingcat what they want, the wingcats negotiate a plan,
 * both people place a refundable 5 USD PayPal hold, and the holds are released when both show up.
 * This API is what wingcat agents use to register a person, negotiate, and follow a date through
 * deposits, check-in and settlement.
 */
class PawsDownApiClient {
    #rawClient;
    #servers;
    #auth;
    #people;
    #venues;
    #negotiations;
    #plans;
    constructor(options = {}) {
        this.#rawClient = new raw_client_js_1.RawClient({
            ...(0, client_options_js_1.buildCoreClientOptions)(options, "PAWS_DOWN_API_CLIENT_LOG"),
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
        this.#servers = (0, servers_js_1.buildServers)(options);
        this.#auth = (0, auth_schemes_js_1.buildAuthSchemes)(options);
    }
    /**
     * The people going on dates and what each of them wants.
     */
    get people() {
        return (this.#people ??= new people_js_1.People(this.#rawClient, this.#servers, this.#auth));
    }
    /**
     * The public places a date can happen at.
     */
    get venues() {
        return (this.#venues ??= new venues_js_1.Venues(this.#rawClient, this.#servers, this.#auth));
    }
    /**
     * Wingcats exchanging proposals until they agree or run out of rounds.
     */
    get negotiations() {
        return (this.#negotiations ??= new negotiations_js_1.Negotiations(this.#rawClient, this.#servers, this.#auth));
    }
    /**
     * An agreed date plan, its approvals, deposits, check-ins and settlement.
     */
    get plans() {
        return (this.#plans ??= new plans_js_1.Plans(this.#rawClient, this.#servers, this.#auth));
    }
}
exports.PawsDownApiClient = PawsDownApiClient;
//# sourceMappingURL=client.js.map