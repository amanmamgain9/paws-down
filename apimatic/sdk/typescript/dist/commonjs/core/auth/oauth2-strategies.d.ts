import type { UrlTemplate } from "../api-request.js";
import type { RawClient } from "../raw-client.js";
import type { Schema } from "../validation/schema.js";
import type { OAuth2AuthorizationCodeCredentials, OAuth2ClientCredentials, OAuth2PasswordCredentials } from "./credentials.js";
/**
 * An OAuth 2.0 token response (RFC 6749 section 5.1).
 *
 * @remarks
 * Wire names are snake_case; these are the decoded SDK names. Returned by an
 * {@link OAuth2TokenStrategy}, and cached by the scheme that owns it until it expires.
 */
export type OAuthToken = {
    /** The token to send in `Authorization`. */
    accessToken: string;
    /** How the token is presented, normally `Bearer`. */
    tokenType: string;
    /**
     * Lifetime in seconds. RECOMMENDED, not required (RFC 6749 section 5.1) — a token with no
     * `expiresIn` is treated as never expiring.
     */
    expiresIn?: number;
    /** Scopes the server actually granted, which may be narrower than those requested. */
    scope?: string;
};
export declare const oauthTokenSchema: Schema<OAuthToken>;
/**
 * An OAuth 2.0 token response that may carry a refresh token.
 *
 * @remarks
 * Only the authorization-code grant issues one — RFC 6749 forbids it for the implicit grant and
 * says client-credentials SHOULD NOT issue one.
 */
export type OAuthTokenRefreshable = OAuthToken & {
    /**
     * Issued at the server's discretion (RFC 6749 sections 4.1.4 and 4.3.3). When a refresh response
     * omits it, the previously issued one is carried forward.
     */
    refreshToken?: string;
};
export declare const oauthTokenRefreshableSchema: Schema<OAuthTokenRefreshable>;
/**
 * How a token is obtained for a grant. The replaceable half of the OAuth2 design.
 *
 * @remarks
 * The scheme owns caching, single-flight and expiry; a strategy owns only the exchange. Supply one
 * on {@link ClientOptions} to talk to a server whose token endpoint does not follow the built-in
 * shape; the SDK then never builds the request itself.
 *
 * `signal` is the one the call was given, or one that never aborts when it was given none.
 * Nothing times a strategy you supply; the built-in ones time their own token request.
 */
export type OAuth2TokenStrategy<TCredentials> = {
    getToken(credentials: TCredentials, signal: AbortSignal): Promise<OAuthToken>;
};
/**
 * A token strategy that can also refresh, used by the authorization-code grant.
 *
 * @remarks
 * `tryRefreshToken` returns `null` rather than throwing when the refresh is rejected, which is what
 * makes "refresh failed, re-authorize" a normal path instead of an error path. Both methods get
 * `signal` as {@link OAuth2TokenStrategy} does.
 */
export type OAuth2RefreshableTokenStrategy<TCredentials> = {
    getToken(credentials: TCredentials, signal: AbortSignal): Promise<OAuthTokenRefreshable>;
    tryRefreshToken(credentials: TCredentials, refreshToken: string, signal: AbortSignal): Promise<OAuthTokenRefreshable | null>;
};
/**
 * Where client credentials travel on a token request.
 *
 * @remarks
 * `"header"` sends them as `Authorization: Basic`; `"body"` sends them as form fields, the
 * `client_secret_post` style. A client with no secret is a public client: under either
 * placement it sends only `client_id`, as a form field, and no `Authorization` header.
 */
export type OAuth2CredentialPlacement = "header" | "body";
export declare function oauth2ClientCredentialsStrategy(config: {
    tokenUrl: UrlTemplate;
    rawClient: RawClient;
    placement?: OAuth2CredentialPlacement;
}): OAuth2TokenStrategy<OAuth2ClientCredentials>;
export declare function oauth2PasswordStrategy(config: {
    tokenUrl: UrlTemplate;
    rawClient: RawClient;
    placement?: OAuth2CredentialPlacement;
}): OAuth2TokenStrategy<OAuth2PasswordCredentials>;
export declare function oauth2AuthorizationCodeStrategy(config: {
    authorizationUrl: UrlTemplate;
    tokenUrl: UrlTemplate;
    rawClient: RawClient;
    placement?: OAuth2CredentialPlacement;
}): OAuth2RefreshableTokenStrategy<OAuth2AuthorizationCodeCredentials>;
