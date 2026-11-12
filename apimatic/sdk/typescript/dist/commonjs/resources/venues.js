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
exports.Venues = void 0;
const api_error_js_1 = require("../core/api-error.js");
const s = __importStar(require("../core/validation/index.js"));
const venue_js_1 = require("../models/venue.js");
/**
 * The public places a date can happen at.
 */
class Venues {
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
            success: { kind: "json", schema: s.array(s.lazy(() => venue_js_1.venueSchema)) },
            errorFactory: api_error_js_1.ApiError,
        }, options);
    }
}
exports.Venues = Venues;
//# sourceMappingURL=venues.js.map