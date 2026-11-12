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
exports.object = object;
exports.discriminatedUnion = discriminatedUnion;
exports.enumOf = enumOf;
exports.of = of;
exports.decodeWith = decodeWith;
exports.encodeWith = encodeWith;
exports.validateWith = validateWith;
exports.decodeEntry = decodeEntry;
exports.encodeEntry = encodeEntry;
exports.lazySchema = lazySchema;
exports.resolve = resolve;
const zod = __importStar(require("zod/v4-mini"));
const schema_error_js_1 = require("./schema-error.js");
function object(shape, options) {
    const bag = bagOf(options);
    let memo;
    const zodType = () => (memo ??= buildObject(shape, bag));
    return {
        zod: zodType,
        tagged: (discriminator, value) => buildObject(shape, bag, [discriminator, value]),
        decode: (value) => decodeWith(zodType(), value),
        encode: (value) => encodeWith(zodType(), value),
        validate: (value) => validateWith(zodType(), value),
    };
}
function bagOf(options) {
    return options === undefined ? undefined : Object.entries(options)[0];
}
function discriminatedUnion(discriminator, variants) {
    let memo;
    const build = () => {
        const members = Object.entries(variants).map(([value, variant]) => built(variant).tagged(discriminator, value));
        return zod.discriminatedUnion(discriminator, members);
    };
    const zodType = () => (memo ??= build());
    return {
        zod: zodType,
        tagged: () => zodType(),
        decode: (value) => decodeWith(zodType(), value),
        encode: (value) => encodeWith(zodType(), value),
        validate: (value) => validateWith(zodType(), value),
    };
}
function enumOf(members) {
    const values = Object.values(members);
    const base = values.every((value) => typeof value === "number")
        ? zod.number()
        : zod.string();
    return {
        ...of(base),
        values,
    };
}
function of(zodType) {
    return {
        zod: () => zodType,
        tagged: () => zodType,
        decode: (value) => decodeWith(zodType, value),
        encode: (value) => encodeWith(zodType, value),
        validate: (value) => validateWith(zodType, value),
    };
}
function decodeWith(zodType, value) {
    const result = zodType.safeParse(value);
    if (result.success)
        return result.data;
    throw new schema_error_js_1.SchemaError((0, schema_error_js_1.issuesMessage)(result.error), result.error);
}
function encodeWith(zodType, value) {
    const result = zod.safeEncode(zodType, value);
    if (result.success)
        return result.data;
    throw new schema_error_js_1.SchemaError((0, schema_error_js_1.issuesMessage)(result.error, "Type could not be encoded for the wire."), result.error);
}
function validateWith(zodType, value) {
    const result = zod.safeEncode(zodType, value);
    if (result.success)
        return { success: true };
    return { success: false, message: (0, schema_error_js_1.issuesList)(result.error) };
}
function decodeEntry(schema, value) {
    return isSchema(schema) ? schema.decode(value) : decodeWith(schema, value);
}
function encodeEntry(schema, value) {
    return isSchema(schema) ? schema.encode(value) : encodeWith(schema, value);
}
function lazySchema(target) {
    let memo;
    const schema = () => (memo ??= built(target()));
    return {
        zod: () => schema().zod(),
        tagged: (discriminator, value) => schema().tagged(discriminator, value),
        decode: (value) => schema().decode(value),
        encode: (value) => schema().encode(value),
        validate: (value) => schema().validate(value),
    };
}
function buildObject(shape, bag, tag) {
    const keysMap = new Map(Object.entries(shape._keysMap ?? {}));
    const wire = {};
    const renames = [];
    for (const [key, entry] of Object.entries(shape)) {
        if (key === "_keysMap")
            continue;
        const wireKey = keysMap.get(key) ?? key;
        wire[wireKey] = resolve(entry);
        if (wireKey !== key)
            renames.push([wireKey, key]);
    }
    if (tag)
        wire[tag[0]] = zod.literal(tag[1]);
    if (bag !== undefined && Object.hasOwn(wire, bag[0])) {
        throw new Error(`${bag[0]} is both the additional-properties key and a wire key of the shape`);
    }
    const object = bag === undefined
        ? zod.looseObject(wire)
        : collectExtras(zod.looseObject(wire), new Set(Object.keys(wire)), bag[0], resolve(bag[1]));
    const renaming = renames.length === 0
        ? object
        : zod.codec(object, zod.custom(), {
            decode: (value) => renameKeys(value, renames, "decode"),
            encode: (value) => renameKeys(value, renames, "encode"),
        });
    return renaming;
}
function collectExtras(declaredObject, declared, key, entry) {
    const codec = zod.codec(zod.custom(), declaredObject, {
        decode: (value, payload) => {
            if (!isRecord(value)) {
                payload.issues.push({ code: "invalid_type", expected: "object", input: value, path: [] });
                return value;
            }
            const out = {};
            const extras = {};
            let found = false;
            for (const wireKey of Object.keys(value)) {
                const item = value[wireKey];
                if (declared.has(wireKey)) {
                    setOwn(out, wireKey, item);
                    continue;
                }
                found = true;
                const result = entry.safeParse(item);
                if (result.success)
                    setOwn(extras, wireKey, result.data);
                else
                    for (const issue of result.error.issues)
                        payload.issues.push(nested(issue, [wireKey]));
            }
            if (found)
                out[key] = extras;
            return out;
        },
        encode: (value, payload) => {
            const { [key]: extras, ...out } = value;
            if (extras === undefined)
                return out;
            if (!isRecord(extras)) {
                payload.issues.push({ code: "invalid_type", expected: "record", input: extras, path: [key] });
                return out;
            }
            for (const wireKey of Object.keys(extras)) {
                const item = extras[wireKey];
                if (declared.has(wireKey)) {
                    payload.issues.push({
                        code: "custom",
                        message: "declared by the model, so not an additional property",
                        input: item,
                        path: [key, wireKey],
                    });
                    continue;
                }
                const result = zod.safeEncode(entry, item);
                if (result.success)
                    setOwn(out, wireKey, result.data);
                else
                    for (const issue of result.error.issues)
                        payload.issues.push(nested(issue, [key, wireKey]));
            }
            return out;
        },
    });
    codec._zod.propValues = declaredObject._zod.propValues;
    return codec;
}
function nested(issue, under) {
    return { ...issue, path: [...under, ...issue.path] };
}
function setOwn(target, key, value) {
    Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}
function renameKeys(value, renames, direction) {
    const out = { ...value };
    for (const [wireKey, key] of renames) {
        const [from, to] = direction === "decode" ? [wireKey, key] : [key, wireKey];
        if (!Object.hasOwn(out, from))
            continue;
        setOwn(out, to, out[from]);
        delete out[from];
    }
    return out;
}
function isRecord(value) {
    if (value === null || typeof value !== "object")
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function resolve(entry) {
    return isSchema(entry) ? built(entry).zod() : entry;
}
function built(schema) {
    return schema;
}
function isSchema(entry) {
    return typeof entry.decode === "function";
}
//# sourceMappingURL=schema.js.map