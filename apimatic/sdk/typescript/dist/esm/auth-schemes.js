import { apiKeyHeaderAuth } from "./core/auth/schemes.js";
export function buildAuthSchemes(options) {
    return {
        apiKeyAuth: apiKeyHeaderAuth({ name: "X-Api-Key", token: options.apiKeyAuth }),
    };
}
//# sourceMappingURL=auth-schemes.js.map