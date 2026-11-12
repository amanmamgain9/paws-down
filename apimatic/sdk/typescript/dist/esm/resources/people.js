import { ApiError } from "../core/api-error.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { errorSchema } from "../models/error.js";
import { newPersonSchema } from "../models/new-person.js";
import { personSchema } from "../models/person.js";
import { preferencesSchema } from "../models/preferences.js";
/**
 * The people going on dates and what each of them wants.
 */
export class People {
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
            headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: newPersonSchema },
        }, {
            success: { kind: "json", schema: personSchema },
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
            success: { kind: "json", schema: personSchema },
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
            headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: preferencesSchema },
        }, {
            success: { kind: "json", schema: personSchema },
            errorFactory: People.SetPreferencesError,
        }, options);
    }
}
(function (People) {
    class CreatePersonError extends ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    People.CreatePersonError = CreatePersonError;
    class GetPersonError extends ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    People.GetPersonError = GetPersonError;
    class SetPreferencesError extends ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    People.SetPreferencesError = SetPreferencesError;
})(People || (People = {}));
//# sourceMappingURL=people.js.map