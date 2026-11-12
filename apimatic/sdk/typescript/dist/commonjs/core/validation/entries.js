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
exports.base16Bytes = exports.base32HexBytes = exports.base32Bytes = exports.base64UrlBytes = exports.bytes = exports.dateOnly = exports.unixSecondsDateTime = exports.rfc1123DateTime = exports.dateTime = void 0;
exports.lazy = lazy;
exports.defaulted = defaulted;
exports.fallback = fallback;
exports.callback = callback;
exports.optionalNullable = optionalNullable;
const zod = __importStar(require("zod/v4-mini"));
const schema_js_1 = require("./schema.js");
function lazy(target) {
    return zod.lazy(() => (0, schema_js_1.resolve)(target()));
}
function defaulted(entry, value) {
    return zod.codec(zod.optional((0, schema_js_1.resolve)(entry)), zod.custom(), {
        decode: (given) => (given === undefined ? value : given),
        encode: (given) => (given === undefined ? value : given),
    });
}
function fallback(entry, value) {
    return zod.catch((0, schema_js_1.resolve)(entry), () => value);
}
function callback() {
    return zod.custom((value) => typeof value === "function");
}
function optionalNullable(entry) {
    return zod.optional(zod.nullable((0, schema_js_1.resolve)(entry)));
}
const dateTime = () => zod.codec(zod.iso.datetime({ offset: true }), zod.date(), {
    decode: (value) => new Date(value),
    encode: (date) => date.toISOString(),
});
exports.dateTime = dateTime;
const IMF_FIXDATE = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
const rfc1123DateTime = () => zod.codec(zod.string().check(zod.regex(IMF_FIXDATE)), zod.date(), {
    decode: (value) => new Date(value),
    encode: (date) => date.toUTCString(),
});
exports.rfc1123DateTime = rfc1123DateTime;
const EPOCH_SECONDS = /^-?\d+(?:\.\d+)?$/;
const unixSecondsDateTime = () => zod.codec(zod.union([zod.number(), zod.string().check(zod.regex(EPOCH_SECONDS))]), zod.date(), {
    decode: (value) => new Date(Number(value) * 1000),
    encode: (date) => Math.floor(date.getTime() / 1000),
});
exports.unixSecondsDateTime = unixSecondsDateTime;
const dateOnly = () => zod.iso.date();
exports.dateOnly = dateOnly;
const BYTES = zod.custom((value) => value instanceof Uint8Array);
const BASE64URL = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/;
const BASE32 = /^(?:[A-Za-z2-7]{8})*(?:[A-Za-z2-7]{2}={6}|[A-Za-z2-7]{4}={4}|[A-Za-z2-7]{5}={3}|[A-Za-z2-7]{7}=)?$/;
const BASE32HEX = /^(?:[0-9A-Va-v]{8})*(?:[0-9A-Va-v]{2}={6}|[0-9A-Va-v]{4}={4}|[0-9A-Va-v]{5}={3}|[0-9A-Va-v]{7}=)?$/;
const BASE16 = /^(?:[0-9A-Fa-f]{2})*$/;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32HEX_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
const bytes = () => zod.codec(zod.base64(), BYTES, {
    decode: (value) => decodeBase64(value),
    encode: (value) => encodeBase64(value),
});
exports.bytes = bytes;
const base64UrlBytes = () => zod.codec(zod.string().check(zod.regex(BASE64URL)), BYTES, {
    decode: (value) => decodeBase64(padBase64(value.replace(/-/g, "+").replace(/_/g, "/"))),
    encode: (value) => encodeBase64(value).replace(/\+/g, "-").replace(/\//g, "_"),
});
exports.base64UrlBytes = base64UrlBytes;
const base32Bytes = () => zod.codec(zod.string().check(zod.regex(BASE32)), BYTES, {
    decode: (value) => decodeBase32(value, BASE32_ALPHABET),
    encode: (value) => encodeBase32(value, BASE32_ALPHABET),
});
exports.base32Bytes = base32Bytes;
const base32HexBytes = () => zod.codec(zod.string().check(zod.regex(BASE32HEX)), BYTES, {
    decode: (value) => decodeBase32(value, BASE32HEX_ALPHABET),
    encode: (value) => encodeBase32(value, BASE32HEX_ALPHABET),
});
exports.base32HexBytes = base32HexBytes;
const base16Bytes = () => zod.codec(zod.string().check(zod.regex(BASE16)), BYTES, {
    decode: (value) => decodeBase16(value),
    encode: (value) => encodeBase16(value),
});
exports.base16Bytes = base16Bytes;
function decodeBase64(value) {
    const latin1 = atob(value);
    const bytes = new Uint8Array(latin1.length);
    for (let index = 0; index < latin1.length; index++)
        bytes[index] = latin1.charCodeAt(index);
    return bytes;
}
function encodeBase64(value) {
    let latin1 = "";
    for (const byte of value)
        latin1 += String.fromCharCode(byte);
    return btoa(latin1);
}
function padBase64(value) {
    const remainder = value.length % 4;
    return remainder === 0 ? value : `${value}${"=".repeat(4 - remainder)}`;
}
function decodeBase32(value, alphabet) {
    const text = value.replace(/=+$/, "").toUpperCase();
    const bytes = new Uint8Array((text.length * 5) >> 3);
    let accumulator = 0;
    let bits = 0;
    let offset = 0;
    for (const char of text) {
        accumulator = (accumulator << 5) | alphabet.indexOf(char);
        bits += 5;
        if (bits < 8)
            continue;
        bits -= 8;
        bytes[offset] = (accumulator >> bits) & 0xff;
        offset += 1;
    }
    return bytes;
}
function encodeBase32(value, alphabet) {
    let text = "";
    let accumulator = 0;
    let bits = 0;
    for (const byte of value) {
        accumulator = (accumulator << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            text += alphabet[(accumulator >> bits) & 0x1f];
        }
    }
    if (bits > 0)
        text += alphabet[(accumulator << (5 - bits)) & 0x1f];
    return text.padEnd(Math.ceil(text.length / 8) * 8, "=");
}
function decodeBase16(value) {
    const bytes = new Uint8Array(value.length / 2);
    for (let index = 0; index < bytes.length; index++) {
        bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
}
function encodeBase16(value) {
    let text = "";
    for (const byte of value)
        text += byte.toString(16).toUpperCase().padStart(2, "0");
    return text;
}
//# sourceMappingURL=entries.js.map