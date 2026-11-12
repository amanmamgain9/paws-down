import type { ClientOptions } from "./client-options.js";
import type { UrlTemplate } from "./core/api-request.js";
export type Servers = {
    default: (subPath: string) => UrlTemplate;
};
export declare function buildServers(options: ClientOptions): Servers;
