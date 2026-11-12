import type { core } from "zod/v4-mini";
export declare function minProperties<T extends Readonly<Record<string, unknown>>>(limit: number): core.$ZodCheck<T>;
export declare function maxProperties<T extends Readonly<Record<string, unknown>>>(limit: number): core.$ZodCheck<T>;
export declare function uniqueItems<T extends readonly unknown[]>(): core.$ZodCheck<T>;
export declare function uriReference(): core.$ZodCheck<string>;
export declare function jsonPointer(): core.$ZodCheck<string>;
/**
 * Compiles the spec's `pattern` in Unicode mode, falling back to legacy syntax when it refuses, and
 * checks nothing when neither reading compiles it.
 */
export declare function pattern(source: string): core.$ZodCheck<string>;
