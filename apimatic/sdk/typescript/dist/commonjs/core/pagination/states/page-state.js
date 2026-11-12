"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageState = pageState;
function pageState(config) {
    return {
        page: config.page,
        next(response, headers, itemCount) {
            const current = config.page ?? 1;
            const totalPages = config.totalPages?.(response, headers);
            if (totalPages != null && current >= totalPages)
                return null;
            const hasMore = config.hasMore?.(response, headers);
            if (hasMore != null)
                return hasMore ? pageState({ ...config, page: current + 1 }) : null;
            if (itemCount === 0)
                return null;
            if (totalPages == null && config.limit != null && itemCount < config.limit)
                return null;
            return pageState({ ...config, page: current + 1 });
        },
    };
}
//# sourceMappingURL=page-state.js.map