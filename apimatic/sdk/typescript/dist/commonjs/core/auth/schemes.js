"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noneAuth = void 0;
exports.bearerAuth = bearerAuth;
exports.basicAuth = basicAuth;
exports.apiKeyHeaderAuth = apiKeyHeaderAuth;
exports.apiKeyQueryAuth = apiKeyQueryAuth;
exports.apiKeyCookieAuth = apiKeyCookieAuth;
exports.allAuth = allAuth;
exports.anyAuth = anyAuth;
exports.authenticateRequest = authenticateRequest;
exports.header = header;
exports.basicCredential = basicCredential;
exports.base64 = base64;
const errors_js_1 = require("../errors.js");
const NO_PARAMS = { headers: [], query: [], cookies: [] };
exports.noneAuth = {
    resolve: () => NO_PARAMS,
    hasCredentials: () => false,
};
function bearerAuth(token) {
    return {
        async resolve(signal) {
            const value = await resolveToken(token, signal);
            return value === undefined ? NO_PARAMS : header("Authorization", `Bearer ${value}`);
        },
        hasCredentials: () => hasToken(token),
    };
}
function basicAuth(credentials) {
    if (credentials !== undefined && credentials.username.includes(":")) {
        throw new errors_js_1.ConfigurationError("A basic-auth username cannot contain a colon (RFC 7617 section 2).");
    }
    return {
        resolve() {
            if (credentials === undefined)
                return NO_PARAMS;
            return header("Authorization", basicCredential(credentials.username, credentials.password));
        },
        hasCredentials: () => credentials !== undefined,
    };
}
function apiKeyHeaderAuth(config) {
    return {
        async resolve(signal) {
            const value = await resolveToken(config.token, signal);
            return value === undefined ? NO_PARAMS : header(config.name, value);
        },
        hasCredentials: () => hasToken(config.token),
    };
}
function apiKeyQueryAuth(config) {
    return {
        async resolve(signal) {
            const value = await resolveToken(config.token, signal);
            if (value === undefined)
                return NO_PARAMS;
            return { headers: [], query: [[config.name, value]], cookies: [] };
        },
        hasCredentials: () => hasToken(config.token),
    };
}
function apiKeyCookieAuth(config) {
    return {
        async resolve(signal) {
            const value = await resolveToken(config.token, signal);
            if (value === undefined)
                return NO_PARAMS;
            return { headers: [], query: [], cookies: [[config.name, value]] };
        },
        hasCredentials: () => hasToken(config.token),
    };
}
function allAuth(...schemes) {
    return {
        async resolve(signal) {
            const parts = [];
            for (const scheme of schemes)
                parts.push(await scheme.resolve(signal));
            return {
                headers: parts.flatMap((part) => part.headers),
                query: parts.flatMap((part) => part.query),
                cookies: parts.flatMap((part) => part.cookies),
            };
        },
        hasCredentials: () => schemes.length > 0 && schemes.every((scheme) => scheme.hasCredentials()),
        invalidate() {
            for (const scheme of schemes)
                scheme.invalidate?.();
        },
    };
}
function anyAuth(...schemes) {
    return {
        async resolve(signal) {
            const failures = [];
            for (const scheme of schemes) {
                if (!scheme.hasCredentials())
                    continue;
                try {
                    return await scheme.resolve(signal);
                }
                catch (err) {
                    if (signal.aborted)
                        throw signal.reason;
                    if (err instanceof errors_js_1.TimeoutError)
                        throw err;
                    failures.push(err);
                }
            }
            if (failures.length === 0)
                return NO_PARAMS;
            if (failures.length === 1)
                throw failures[0];
            throw new AggregateError(failures, "No authentication scheme succeeded.");
        },
        hasCredentials: () => schemes.some((scheme) => scheme.hasCredentials()),
        invalidate() {
            for (const scheme of schemes)
                scheme.invalidate?.();
        },
    };
}
async function authenticateRequest(method, auth, url, headers, signal, startedAt, logger) {
    try {
        const credential = await auth.resolve(signal);
        return {
            url: url.withQuery(credential.query),
            headers: headers.withCredential(credential.headers, credential.cookies),
        };
    }
    catch (err) {
        if (signal.aborted)
            throw signal.reason;
        if (err instanceof errors_js_1.ConnectionError || err instanceof errors_js_1.TimeoutError)
            throw err;
        if (err instanceof errors_js_1.AuthError) {
            logger.logFailure(err, startedAt);
            throw err;
        }
        const { uri } = url;
        const error = new errors_js_1.AuthError(`${method} ${uri} failed: ${err instanceof Error && err.message !== "" ? err.message : "A credential could not be obtained."}`, { cause: err, method, uri });
        logger.logFailure(error, startedAt);
        throw error;
    }
}
function header(name, value) {
    return { headers: [[name, value]], query: [], cookies: [] };
}
function basicCredential(username, password) {
    return `Basic ${base64(new TextEncoder().encode(`${username}:${password}`))}`;
}
function base64(bytes) {
    let binary = "";
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary);
}
async function resolveToken(token, signal) {
    const value = typeof token === "function" ? await token(signal) : token;
    if (value !== undefined && typeof value !== "string") {
        throw new TypeError(`A credential must be a string, received ${typeof value}.`);
    }
    return present(value);
}
function hasToken(token) {
    return typeof token === "function" || present(token) !== undefined;
}
function present(value) {
    return value !== undefined && value !== "" ? value : undefined;
}
//# sourceMappingURL=schemes.js.map