export type OffsetState<TPage> = {
    readonly offset: number | null | undefined;
    readonly next: (page: TPage, headers: Headers, itemCount: number) => OffsetState<TPage> | null;
};
export type OffsetStateConfig<TPage> = {
    readonly offset: number | null | undefined;
    readonly limit: number | null | undefined;
    readonly hasMore?: (page: TPage, headers: Headers) => boolean | null | undefined;
    readonly totalItems?: (page: TPage, headers: Headers) => number | null | undefined;
};
export declare function offsetState<TPage>(config: OffsetStateConfig<TPage>): OffsetState<TPage>;
