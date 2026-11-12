"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2Scheme = oauth2Scheme;
exports.oauth2RefreshableScheme = oauth2RefreshableScheme;
const schemes_js_1 = require("./schemes.js");
const EXPIRY_BUFFER_MS = 30_000;
function oauth2Scheme(credentials, strategy) {
    if (credentials === undefined)
        return schemes_js_1.noneAuth;
    return cachedTokenScheme((signal) => strategy.getToken(credentials, signal));
}
function oauth2RefreshableScheme(credentials, strategy) {
    if (credentials === undefined)
        return schemes_js_1.noneAuth;
    return cachedTokenScheme(async (signal, previous) => {
        const refreshToken = previous?.refreshToken;
        if (refreshToken === undefined)
            return strategy.getToken(credentials, signal);
        const refreshed = await strategy.tryRefreshToken(credentials, refreshToken, signal);
        if (refreshed === null)
            return strategy.getToken(credentials, signal);
        return refreshed.refreshToken === undefined ? { ...refreshed, refreshToken } : refreshed;
    });
}
function cachedTokenScheme(acquire) {
    let cached;
    let inflight;
    async function obtainAndCacheToken(signal) {
        try {
            const token = await acquire(signal, cached?.token);
            cached = { token, expiresAt: expiryOf(token) };
            return token;
        }
        finally {
            inflight = undefined;
        }
    }
    return {
        async resolve(signal) {
            if (cached !== undefined && Date.now() < cached.expiresAt)
                return bearer(cached.token);
            inflight ??= obtainAndCacheToken(signal);
            return bearer(await untilAborted(inflight, signal));
        },
        hasCredentials: () => true,
        invalidate: () => {
            cached = undefined;
        },
    };
}
function untilAborted(promise, signal) {
    return new Promise((resolve, reject) => {
        const onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted)
            onAbort();
        promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
    });
}
function bearer(token) {
    return (0, schemes_js_1.header)("Authorization", `Bearer ${token.accessToken}`);
}
function expiryOf(token) {
    if (token.expiresIn === undefined || token.expiresIn <= 0)
        return Number.POSITIVE_INFINITY;
    const lifetimeMs = token.expiresIn * 1000;
    return Date.now() + Math.max(lifetimeMs - EXPIRY_BUFFER_MS, lifetimeMs / 2);
}
//# sourceMappingURL=oauth2-schemes.js.map