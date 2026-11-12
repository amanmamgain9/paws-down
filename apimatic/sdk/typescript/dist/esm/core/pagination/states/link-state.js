import { PaginationError } from "../../errors.js";
export function linkState(config) {
    return {
        url: config.url,
        query: config.query,
        link: config.link,
        next(response, headers, _, uri) {
            const nextLink = config.nextLink(response, headers)?.trim();
            if (!nextLink)
                return null;
            if (nextLink === config.link)
                return null;
            return linkState({
                ...config,
                url: resolveNextLink(nextLink, uri, config.method),
                query: [],
                link: nextLink,
            });
        },
    };
}
function resolveNextLink(nextLink, uri, method) {
    const base = new URL(uri);
    let resolved;
    try {
        resolved = new URL(nextLink, base);
    }
    catch (err) {
        throw new PaginationError(`${method} ${uri} failed: the pagination link is not a URL.`, {
            method,
            uri,
            cause: err,
        });
    }
    if (resolved.protocol !== base.protocol || resolved.host !== base.host) {
        const uri = `${originOf(resolved)}${resolved.pathname}`;
        throw new PaginationError(`${method} ${uri} failed: the pagination link's origin ${originOf(resolved)} is not the API's ${originOf(base)}.`, { method, uri });
    }
    return { baseUrl: originOf(resolved), subPath: `${resolved.pathname}${resolved.search}` };
}
function originOf(url) {
    return `${url.protocol}//${url.host}`;
}
//# sourceMappingURL=link-state.js.map