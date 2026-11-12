export function cursorState(config) {
    const cursor = config.cursor;
    return {
        cursor,
        next(response, headers) {
            const nextCursor = config.nextCursor(response, headers);
            if (!nextCursor)
                return null;
            if (nextCursor === cursor)
                return null;
            if (config.hasMore?.(response, headers) === false)
                return null;
            return cursorState({ ...config, cursor: nextCursor });
        },
    };
}
//# sourceMappingURL=cursor-state.js.map