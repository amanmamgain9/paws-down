import { resolveBaseUrl } from "./core/url.js";
import * as s from "./core/validation/index.js";
const serverSchemas = {
    baseUrl: s.of(s.defaulted(s.string(), "http://localhost:4000")),
};
export function buildServers(options) {
    const base = {
        default: resolveBaseUrl(defaultServer(options)),
    };
    return {
        default: (subPath) => ({ baseUrl: base.default, subPath }),
    };
}
function defaultServer(options) {
    return { baseUrl: serverSchemas.baseUrl.decode(options.serverOptions?.baseUrl) };
}
//# sourceMappingURL=servers.js.map