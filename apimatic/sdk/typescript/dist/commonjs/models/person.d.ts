import type { JsonValue, Schema } from "../core/validation/schema.js";
import { type Preferences } from "./preferences.js";
/** A registered person. */
export type Person = {
    /** The person's ID. */
    id: string;
    /** The person's first name. */
    name: string;
    /** The name of this person's wingcat. */
    wingcatName: string;
    /** What a person wants from a date. The server treats these as hard limits. */
    preferences?: Preferences;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const personSchema: Schema<Person>;
