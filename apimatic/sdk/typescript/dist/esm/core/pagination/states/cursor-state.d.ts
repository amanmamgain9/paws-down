export type CursorState<TPage> = {
    readonly cursor: string | null | undefined;
    readonly next: (page: TPage, headers: Headers) => CursorState<TPage> | null;
};
export type CursorStateConfig<TPage> = {
    readonly cursor: string | null | undefined;
    readonly nextCursor: (page: TPage, headers: Headers) => string | null | undefined;
    readonly hasMore?: (page: TPage, headers: Headers) => boolean | null | undefined;
};
export declare function cursorState<TPage>(config: CursorStateConfig<TPage>): CursorState<TPage>;
