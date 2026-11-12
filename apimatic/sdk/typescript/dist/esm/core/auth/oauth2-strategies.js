import { PkceMethod } from "./credentials.js";
import { base64, basicCredential, noneAuth } from "./schemes.js";
import { CoreError } from "../errors.js";
import { ApiError } from "../api-error.js";
import { buildQueryUrl, templateUri } from "../url.js";
import * as s from "../validation/index.js";
export const oauthTokenSchema = s.object({
    accessToken: s.string(),
    tokenType: s.string(),
    expiresIn: s.optional(s.int()),
    scope: s.optional(s.string()),
    _keysMap: {
        accessToken: "access_token",
        tokenType: "token_type",
        expiresIn: "expires_in",
    },
});
export const oauthTokenRefreshableSchema = s.object({
    accessToken: s.string(),
    tokenType: s.string(),
    expiresIn: s.optional(s.int()),
    scope: s.optional(s.string()),
    refreshToken: s.optional(s.string()),
    _keysMap: {
        accessToken: "access_token",
        tokenType: "token_type",
        expiresIn: "expires_in",
        refreshToken: "refresh_token",
    },
});
export function oauth2ClientCredentialsStrategy(config) {
    return {
        getToken(credentials, signal) {
            const placed = placeCredentials(config.placement ?? "header", credentials.clientId, credentials.clientSecret);
            return requestToken(config, oauthTokenSchema, placed.headers, [
                { name: "grant_type", value: "client_credentials", schema: s.string() },
                ...scopeField(credentials.scope),
                ...placed.fields,
            ], signal);
        },
    };
}
export function oauth2PasswordStrategy(config) {
    return {
        getToken(credentials, signal) {
            const placed = placeCredentials(config.placement ?? "header", credentials.clientId, credentials.clientSecret);
            return requestToken(config, oauthTokenSchema, placed.headers, [
                { name: "grant_type", value: "password", schema: s.string() },
                { name: "username", value: credentials.username, schema: s.string() },
                { name: "password", value: credentials.password, schema: s.string() },
                ...scopeField(credentials.scope),
                ...placed.fields,
            ], signal);
        },
    };
}
export function oauth2AuthorizationCodeStrategy(config) {
    const placementOf = (credentials) => placeCredentials(config.placement ?? "header", credentials.clientId, credentials.clientSecret);
    return {
        async getToken(credentials, signal) {
            const method = credentials.pkce === undefined ? PkceMethod.S256 : credentials.pkce;
            if (method === null && (credentials.clientSecret === undefined || credentials.clientSecret === "")) {
                throw new Error("A client secret is required when PKCE is disabled. Set pkce to PkceMethod.S256 for a public client.");
            }
            const pkce = method === null ? undefined : await generatePkce(method);
            const authorizationUri = buildQueryUrl(new URL(templateUri(config.authorizationUrl)), [
                authorizationFields(credentials, pkce),
            ]);
            const code = await promptForCode(credentials, authorizationUri.href, signal);
            const placed = placementOf(credentials);
            return requestToken(config, oauthTokenRefreshableSchema, placed.headers, [
                { name: "grant_type", value: "authorization_code", schema: s.string() },
                { name: "code", value: code, schema: s.string() },
                { name: "redirect_uri", value: credentials.redirectUri, schema: s.string() },
                ...(pkce === undefined
                    ? []
                    : [{ name: "code_verifier", value: pkce.verifier, schema: s.string() }]),
                ...placed.fields,
            ], signal);
        },
        async tryRefreshToken(credentials, refreshToken, signal) {
            const placed = placementOf(credentials);
            const outcome = await config.rawClient
                .execute({
                method: "POST",
                urlTemplate: config.tokenUrl,
                auth: noneAuth,
                pathParams: [],
                query: [],
                headers: placed.headers,
                body: {
                    kind: "formUrlEncoded",
                    value: [
                        { name: "grant_type", value: "refresh_token", schema: s.string() },
                        { name: "refresh_token", value: refreshToken, schema: s.string() },
                        ...placed.fields,
                    ],
                },
            }, {
                success: { kind: "json", schema: oauthTokenRefreshableSchema },
                errorFactory: ApiError,
            }, { signal })
                .asApiResult();
            return outcome.ok ? outcome.value : null;
        },
    };
}
function scopeField(scope) {
    if (scope === undefined || scope === "")
        return [];
    return [{ name: "scope", value: scope, schema: s.string() }];
}
function placeCredentials(placement, clientId, clientSecret) {
    const clientIdField = { name: "client_id", value: clientId, schema: s.string() };
    if (clientSecret === undefined || clientSecret === "") {
        return { headers: [], fields: [clientIdField] };
    }
    if (placement === "header") {
        return {
            headers: [
                {
                    name: "Authorization",
                    value: basicCredential(clientId, clientSecret),
                    schema: s.string(),
                },
            ],
            fields: [],
        };
    }
    return {
        headers: [],
        fields: [clientIdField, { name: "client_secret", value: clientSecret, schema: s.string() }],
    };
}
async function requestToken(config, schema, headers, fields, signal) {
    return config.rawClient.execute({
        method: "POST",
        urlTemplate: config.tokenUrl,
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers,
        body: { kind: "formUrlEncoded", value: fields },
    }, {
        success: { kind: "json", schema },
        errorFactory: ApiError,
    }, { signal });
}
async function promptForCode(credentials, authorizationUrl, signal) {
    try {
        return await credentials.promptForAuthorizationCode(authorizationUrl, signal);
    }
    catch (err) {
        if (!(err instanceof CoreError) && signal.aborted)
            throw signal.reason;
        throw err;
    }
}
function authorizationFields(credentials, pkce) {
    const fields = [
        { name: "response_type", value: "code", schema: s.string() },
        { name: "client_id", value: credentials.clientId, schema: s.string() },
        { name: "redirect_uri", value: credentials.redirectUri, schema: s.string() },
        ...scopeField(credentials.scope),
    ];
    if (credentials.state !== undefined && credentials.state !== "") {
        fields.push({ name: "state", value: credentials.state, schema: s.string() });
    }
    if (pkce !== undefined) {
        fields.push({ name: "code_challenge", value: pkce.challenge, schema: s.string() }, { name: "code_challenge_method", value: pkce.method, schema: s.string() });
    }
    return fields;
}
async function generatePkce(method) {
    const entropy = new Uint8Array(32);
    crypto.getRandomValues(entropy);
    const verifier = base64Url(entropy);
    if (method === PkceMethod.Plain)
        return { verifier, challenge: verifier, method };
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return { verifier, challenge: base64Url(new Uint8Array(digest)), method };
}
function base64Url(bytes) {
    return base64(bytes).replace(/=+$/, "").replaceAll("+", "-").replaceAll("/", "_");
}
//# sourceMappingURL=oauth2-strategies.js.map