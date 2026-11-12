import type { JSONType, ZodMiniType } from "zod/v4-mini";
/**
 * What a value looks like on the wire.
 *
 * @remarks
 * Only `Date` and `Uint8Array` change shape — a `Date` becomes its serialized form and a
 * `Uint8Array` a string in the RFC 4648 alphabet its field declares — recursing through arrays and
 * objects. Everything else is unchanged, because the schema layer stops at *values*: how a number
 * is written into a query string versus a JSON body is the engine's decision, not the schema's.
 */
export type Encoded<T, K extends string = BagKey<T>> = T extends Date ? string | number : T extends Uint8Array ? string : T extends string | number | boolean | null | undefined ? T : T extends readonly (infer E)[] ? Encoded<E>[] : T extends object ? {
    [P in keyof T as Declared<P, K>]: Encoded<T[P]>;
} : T;
/**
 * Any value JSON can carry: a string, a finite number, a boolean, `null`, an array of these, or a
 * plain object of these.
 *
 * @remarks
 * This is what an untyped `additionalProperties` record holds, and it is zod's `JSONType` under
 * the SDK's name. Narrow it the way JSON is narrowed — `typeof`, `Array.isArray`, `=== null` — or
 * hand it to an exported schema's `decode`. A `Date`, a `Uint8Array`, a `Map`, a function,
 * `undefined` and a non-finite number are not JSON values and are refused on `encode` rather than
 * silently rewritten by `JSON.stringify`: write a `Date` as the string the service expects, and
 * bytes in the alphabet it expects.
 */
export type JsonValue = JSONType;
export type KeysMap<T, K extends string = BagKey<T>> = {
    readonly [P in keyof T as Declared<P, K>]?: string;
};
export type Entry<V, W = unknown> = ZodMiniType<V, W> | Schema<V, W>;
export type Shape<T, K extends string = BagKey<T>> = {
    [P in keyof T as Declared<P, K>]-?: Entry<T[P]>;
} & {
    readonly _keysMap?: KeysMap<T, K>;
};
type Declared<P, K extends string> = Exclude<P, K>;
type BagKey<T> = BagKeyOf<T, keyof T & string>;
type BagKeyOf<T, P extends keyof T & string> = P extends BagName ? NonNullable<T[P]> extends Record<string, unknown> ? P : never : never;
type BagName = "additionalProperties" | `additionalProperties${number}`;
/**
 * What an object schema is told beyond its shape: the entry every undeclared key's value is
 * decoded and encoded through.
 *
 * @remarks
 * Required exactly when the model declares the record, under the one key the model gives it:
 * `additionalProperties`, or `additionalProperties2` when the spec itself declares a property by
 * the first name. It is typed by that field's value type, so the catchall's codec is checked
 * against the model the way every field entry is. `decode` moves every key the shape does not
 * declare into the record, and `encode` spreads it back onto the wire, so the wire itself never
 * carries a key by that name. The record is present only when there is at least one undeclared
 * key. A bag key that names a declared field is rejected on `encode`.
 *
 * A model with no such field takes no options: undeclared keys pass through both directions
 * untouched, and the model has no field for them.
 */
export type ObjectOptions<T, K extends string = BagKey<T>> = {
    readonly [P in K]: Entry<BagValue<T, K>>;
};
type BagValue<T, K extends string> = K extends keyof T ? T[K] extends Record<string, infer V> | undefined ? V : never : never;
type OptionsFor<T, K extends string> = [BagValue<T, K>] extends [never] ? [] : [options: ObjectOptions<T, K>];
/**
 * The codec exported beside every model: `decode` from the wire, `encode` back to it.
 *
 * @remarks
 * Both directions are complete on their own — one call each, never a pair. `decode` accepts the
 * wire form only and `encode` the SDK form only, so passing one direction's value to the other is
 * rejected rather than waved through. A failure throws `SchemaError`; through an operation the
 * same failure reaches you one level down, on the `cause` of a `DecodeError` or an
 * `EncodeError`, which name the call.
 *
 * `validate` is `encode` without the conversion and without the throw: it runs the same rules on
 * the same value and returns a {@link ValidationResult}, whose `message` on failure names every
 * field that failed and why, so a caller branches on the outcome rather than catching it.
 *
 * What an operation runs is **structural**: types, shape, and required keys. Enum membership is
 * the service's to enforce and is never checked. A model whose spec declares value constraints
 * such as `minLength`, `pattern` or `minimum` exports a schema that enforces them in both
 * directions, so `validate` on it is how a value is checked before it is sent; the structural
 * twin the operations use stays inside the module.
 */
export type Schema<T, W = Encoded<T>> = {
    readonly decode: (value: unknown) => T;
    encode(value: T): W;
    validate(value: T): ValidationResult;
};
/**
 * The outcome of `validate`: `success` says whether the value passed, and on failure `message` is
 * the list of failing fields, each with its reason, as `code: expected regex format; attributes:
 * must have at most 10 properties` — the same list a `SchemaError` from `encode` carries after
 * its leading sentence.
 */
export type ValidationResult = {
    readonly success: true;
} | {
    readonly success: false;
    readonly message: string;
};
/**
 * The codec of an open enum, which also exposes the known members at run time.
 *
 * @remarks
 * `values` is the set the spec declared. It is **not** enforced — an open enum validates the base
 * type only, so an unrecognized server value round-trips instead of throwing. Test membership
 * yourself against `values` when you need to.
 */
export type EnumSchema<T> = Schema<T, T> & {
    readonly values: readonly T[];
};
export declare function object<T>(shape: Shape<T, never>): Schema<T, Encoded<T, never>>;
export declare function object<T, K extends string = BagKey<T>>(shape: Shape<T, K>, ...rest: OptionsFor<T, K>): Schema<T, Encoded<T, K>>;
export declare function discriminatedUnion<T>(discriminator: string, variants: Readonly<Record<string, Schema<unknown, unknown>>>): Schema<T, Encoded<T>>;
export declare function enumOf<T extends string | number>(members: Readonly<Record<string, T>>): EnumSchema<T>;
export declare function of<T, W = Encoded<T>>(zodType: ZodMiniType<T, W>): Schema<T, W>;
export declare function decodeWith<T>(zodType: ZodMiniType<T, unknown>, value: unknown): T;
export declare function encodeWith<T, W>(zodType: ZodMiniType<T, W>, value: T): W;
export declare function validateWith<T, W>(zodType: ZodMiniType<T, W>, value: T): ValidationResult;
export declare function decodeEntry<V>(schema: Entry<V>, value: unknown): V;
export declare function encodeEntry<V, W>(schema: Entry<V, W>, value: V): W;
export declare function lazySchema<T>(target: () => Schema<T, Encoded<T>>): Schema<T, Encoded<T>>;
export declare function resolve<T>(entry: Entry<T, Encoded<T>>): ZodMiniType<T, Encoded<T>>;
export {};
