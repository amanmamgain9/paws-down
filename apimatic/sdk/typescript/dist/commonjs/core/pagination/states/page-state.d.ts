export type PageNumberState<TPage> = {
    readonly page: number | null | undefined;
    readonly next: (page: TPage, headers: Headers, itemCount: number) => PageNumberState<TPage> | null;
};
export type PageStateConfig<TPage> = {
    readonly page: number | null | undefined;
    readonly limit: number | null | undefined;
    readonly hasMore?: (page: TPage, headers: Headers) => boolean | null | undefined;
    readonly totalPages?: (page: TPage, headers: Headers) => number | null | undefined;
};
export declare function pageState<TPage>(config: PageStateConfig<TPage>): PageNumberState<TPage>;
