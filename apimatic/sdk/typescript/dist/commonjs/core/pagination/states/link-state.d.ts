import type { HttpMethod, UrlTemplate } from "../../api-request.js";
import type { StyledParam } from "../../param-value.js";
export type LinkState<TPage> = {
    readonly url: UrlTemplate;
    readonly query: readonly StyledParam[];
    readonly link: string | undefined;
    readonly next: (page: TPage, headers: Headers, itemCount: number, uri: string) => LinkState<TPage> | null;
};
export type LinkStateConfig<TPage> = {
    readonly method: HttpMethod;
    readonly url: UrlTemplate;
    readonly query: readonly StyledParam[];
    readonly link?: string;
    readonly nextLink: (page: TPage, headers: Headers) => string | null | undefined;
};
export declare function linkState<TPage>(config: LinkStateConfig<TPage>): LinkState<TPage>;
