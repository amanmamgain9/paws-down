import * as zod from "zod/v4-mini";
export function minProperties(limit) {
    return zod.refine((value) => Object.keys(value).length >= limit, `must have at least ${limit} properties`);
}
export function maxProperties(limit) {
    return zod.refine((value) => Object.keys(value).length <= limit, `must have at most ${limit} properties`);
}
export function uniqueItems() {
    return zod.refine((value) => new Set(value.map((item) => JSON.stringify(item))).size === value.length, "must not repeat an item");
}
const uriReferenceSyntax = rfc3986UriReference();
export function uriReference() {
    return zod.refine((value) => uriReferenceSyntax.test(value) && resolvesAgainstABase(value), "must be a URI reference");
}
function resolvesAgainstABase(reference) {
    try {
        new URL(reference, "https://placeholder.invalid");
        return true;
    }
    catch {
        return false;
    }
}
function rfc3986UriReference() {
    const unreserved = "A-Za-z0-9\\-._~";
    const subDelims = "!$&'()*+,;=";
    const percentEncoded = "%[0-9A-Fa-f]{2}";
    const pchar = `(?:[${unreserved}${subDelims}:@]|${percentEncoded})`;
    const segments = `(?:/${pchar}*)*`;
    const rootlessPath = `${pchar}+${segments}`;
    const noSchemePath = `(?:[${unreserved}${subDelims}@]|${percentEncoded})+${segments}`;
    const userInfo = `(?:[${unreserved}${subDelims}:]|${percentEncoded})*@`;
    const host = `(?:\\[[${unreserved}${subDelims}:]+\\]|(?:[${unreserved}${subDelims}]|${percentEncoded})*)`;
    const authorityAndPath = `//(?:${userInfo})?${host}(?::[0-9]*)?${segments}`;
    const absolutePath = `/(?:${rootlessPath})?`;
    const scheme = "[A-Za-z][A-Za-z0-9+\\-.]*:";
    const uri = `${scheme}(?:${authorityAndPath}|${absolutePath}|${rootlessPath})?`;
    const relativeReference = `(?:${authorityAndPath}|${absolutePath}|${noSchemePath})?`;
    const queryAndFragment = `(?:\\?(?:${pchar}|[/?])*)?(?:#(?:${pchar}|[/?])*)?`;
    return new RegExp(`^(?:${uri}|${relativeReference})${queryAndFragment}$`);
}
export function jsonPointer() {
    return zod.regex(/^(?:\/(?:[^~/]|~[01])*)*$/);
}
/**
 * Compiles the spec's `pattern` in Unicode mode, falling back to legacy syntax when it refuses, and
 * checks nothing when neither reading compiles it.
 */
export function pattern(source) {
    const expression = compiled(source, "u") ?? compiled(source, "");
    return expression === undefined ? zod.refine(() => true) : zod.regex(expression);
}
function compiled(source, flags) {
    try {
        return new RegExp(source, flags);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=constraints.js.map