import type { ClientOptions } from "./client-options.js";
import type { AuthScheme } from "./core/api-request.js";
export type AuthSchemes = {
    readonly apiKeyAuth: AuthScheme;
};
export declare function buildAuthSchemes(options: ClientOptions): AuthSchemes;
