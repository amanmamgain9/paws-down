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
exports.minProperties = minProperties;
exports.maxProperties = maxProperties;
exports.uniqueItems = uniqueItems;
exports.uriReference = uriReference;
exports.jsonPointer = jsonPointer;
exports.pattern = pattern;
const zod = __importStar(require("zod/v4-mini"));
function minProperties(limit) {
    return zod.refine((value) => Object.keys(value).length >= limit, `must have at least ${limit} properties`);
}
function maxProperties(limit) {
    return zod.refine((value) => Object.keys(value).length <= limit, `must have at most ${limit} properties`);
}
function uniqueItems() {
    return zod.refine((value) => new Set(value.map((item) => JSON.stringify(item))).size === value.length, "must not repeat an item");
}
const uriReferenceSyntax = rfc3986UriReference();
function uriReference() {
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
function jsonPointer() {
    return zod.regex(/^(?:\/(?:[^~/]|~[01])*)*$/);
}
/**
 * Compiles the spec's `pattern` in Unicode mode, falling back to legacy syntax when it refuses, and
 * checks nothing when neither reading compiles it.
 */
function pattern(source) {
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