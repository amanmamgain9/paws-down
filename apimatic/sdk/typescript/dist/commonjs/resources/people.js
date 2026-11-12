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
exports.People = void 0;
const api_error_js_1 = require("../core/api-error.js");
const uuid_js_1 = require("../core/uuid.js");
const s = __importStar(require("../core/validation/index.js"));
const error_js_1 = require("../models/error.js");
const new_person_js_1 = require("../models/new-person.js");
const person_js_1 = require("../models/person.js");
const preferences_js_1 = require("../models/preferences.js");
/**
 * The people going on dates and what each of them wants.
 */
class People {
    #rawClient;
    #servers;
    #auth;
    constructor(rawClient, servers, auth) {
        this.#rawClient = rawClient;
        this.#servers = servers;
        this.#auth = auth;
    }
    /**
     * Register a person
     *
     * @remarks
     * Registers a person and the name of the wingcat that will negotiate for them.
     *
     * @returns The person was registered.
     *
     * @throws {@link People.CreatePersonError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    createPerson(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/people"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: new_person_js_1.newPersonSchema },
        }, {
            success: { kind: "json", schema: person_js_1.personSchema },
            errorFactory: People.CreatePersonError,
        }, options);
    }
    /**
     * Get a person
     *
     * @remarks
     * Returns a person and their saved preferences.
     *
     * @returns The person.
     *
     * @throws {@link People.GetPersonError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    getPerson(request, options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/people/{personId}"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "personId", value: request.personId, schema: s.string() }],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: person_js_1.personSchema },
            errorFactory: People.GetPersonError,
        }, options);
    }
    /**
     * Save a person's date preferences
     *
     * @remarks
     * Replaces the person's preferences. These are the hard limits the server checks every plan
     * against, so a wingcat can never agree to something outside them.
     *
     * @returns The person with the saved preferences.
     *
     * @throws {@link People.SetPreferencesError} when the API answers with an error status — narrow
     * on `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    setPreferences(request, options) {
        return this.#rawClient.execute({
            method: "PUT",
            urlTemplate: this.#servers.default("/people/{personId}/preferences"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "personId", value: request.personId, schema: s.string() }],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: preferences_js_1.preferencesSchema },
        }, {
            success: { kind: "json", schema: person_js_1.personSchema },
            errorFactory: People.SetPreferencesError,
        }, options);
    }
}
exports.People = People;
(function (People) {
    class CreatePersonError extends api_error_js_1.ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    People.CreatePersonError = CreatePersonError;
    class GetPersonError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    People.GetPersonError = GetPersonError;
    class SetPreferencesError extends api_error_js_1.ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    People.SetPreferencesError = SetPreferencesError;
})(People || (exports.People = People = {}));
//# sourceMappingURL=people.js.map