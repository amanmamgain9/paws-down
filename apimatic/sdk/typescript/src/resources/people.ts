import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { errorSchema, type Error } from "../models/error.js";
import { newPersonSchema, type NewPerson } from "../models/new-person.js";
import { personSchema, type Person } from "../models/person.js";
import { preferencesSchema, type Preferences } from "../models/preferences.js";
import type { Servers } from "../servers.js";

/**
 * The people going on dates and what each of them wants.
 */
export class People {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
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
  createPerson(
    request: People.CreatePersonRequest,
    options?: RequestOptions,
  ): ApiPromise<Person, People.CreatePersonError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/people"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: newPersonSchema },
      },
      {
        success: { kind: "json", schema: personSchema },
        errorFactory: People.CreatePersonError,
      },
      options,
    );
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
  getPerson(
    request: People.GetPersonRequest,
    options?: RequestOptions,
  ): ApiPromise<Person, People.GetPersonError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/people/{personId}"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "personId", value: request.personId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: personSchema },
        errorFactory: People.GetPersonError,
      },
      options,
    );
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
  setPreferences(
    request: People.SetPreferencesRequest,
    options?: RequestOptions,
  ): ApiPromise<Person, People.SetPreferencesError> {
    return this.#rawClient.execute(
      {
        method: "PUT",
        urlTemplate: this.#servers.default("/people/{personId}/preferences"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "personId", value: request.personId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: preferencesSchema },
      },
      {
        success: { kind: "json", schema: personSchema },
        errorFactory: People.SetPreferencesError,
      },
      options,
    );
  }
}

export namespace People {
  export type CreatePersonRequest = {
    body: NewPerson;
  };

  export class CreatePersonError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<CreatePersonError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type GetPersonRequest = {
    /** The person's ID. */
    personId: string;
  };

  export class GetPersonError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<GetPersonError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type SetPreferencesRequest = {
    /** The person's ID. */
    personId: string;
    body: Preferences;
  };

  export class SetPreferencesError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Undeclared;

    static readonly errors: ErrorDecoders<SetPreferencesError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
