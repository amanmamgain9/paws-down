import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { type Error } from "../models/error.js";
import { type NewPerson } from "../models/new-person.js";
import { type Person } from "../models/person.js";
import { type Preferences } from "../models/preferences.js";
import type { Servers } from "../servers.js";
/**
 * The people going on dates and what each of them wants.
 */
export declare class People {
    #private;
    constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes);
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
    createPerson(request: People.CreatePersonRequest, options?: RequestOptions): ApiPromise<Person, People.CreatePersonError>;
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
    getPerson(request: People.GetPersonRequest, options?: RequestOptions): ApiPromise<Person, People.GetPersonError>;
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
    setPreferences(request: People.SetPreferencesRequest, options?: RequestOptions): ApiPromise<Person, People.SetPreferencesError>;
}
export declare namespace People {
    type CreatePersonRequest = {
        body: NewPerson;
    };
    class CreatePersonError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<CreatePersonError>;
    }
    type GetPersonRequest = {
        /** The person's ID. */
        personId: string;
    };
    class GetPersonError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<GetPersonError>;
    }
    type SetPreferencesRequest = {
        /** The person's ID. */
        personId: string;
        body: Preferences;
    };
    class SetPreferencesError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Undeclared;
        static readonly errors: ErrorDecoders<SetPreferencesError>;
    }
}
