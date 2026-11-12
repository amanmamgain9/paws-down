"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatingSystem = operatingSystem;
exports.runtimeDescription = runtimeDescription;
exports.environmentVariable = environmentVariable;
function operatingSystem() {
    const nodeProcess = runtimeGlobals.process;
    const versions = nodeProcess?.versions;
    if (present(versions?.node) !== undefined ||
        present(versions?.bun) !== undefined ||
        present(versions?.deno) !== undefined) {
        return processPlatform(nodeProcess);
    }
    return present(runtimeGlobals.navigator?.userAgentData?.platform);
}
function runtimeDescription() {
    const versions = runtimeGlobals.process?.versions;
    const bun = present(versions?.bun);
    if (bun !== undefined)
        return `Bun/${bun}`;
    const deno = present(versions?.deno);
    if (deno !== undefined)
        return `Deno/${deno}`;
    const edge = present(runtimeGlobals.EdgeRuntime);
    if (edge !== undefined)
        return edge;
    const userAgent = present(runtimeGlobals.navigator?.userAgent);
    if (userAgent === CLOUDFLARE_WORKERS_USER_AGENT)
        return userAgent;
    const node = present(versions?.node);
    return node === undefined ? userAgent : `Node.js/${node}`;
}
function environmentVariable(name) {
    try {
        return present(runtimeGlobals.process?.env?.[name]?.trim());
    }
    catch {
        return undefined;
    }
}
const runtimeGlobals = globalThis;
const CLOUDFLARE_WORKERS_USER_AGENT = "Cloudflare-Workers";
const present = (value) => value === undefined || value === "" ? undefined : value;
function processPlatform(nodeProcess) {
    const platform = present(nodeProcess?.platform);
    if (platform === undefined)
        return undefined;
    const arch = present(nodeProcess?.arch);
    return arch === undefined ? platform : `${platform} ${arch}`;
}
//# sourceMappingURL=runtime-environment.js.map