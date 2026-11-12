/**
 * A value did not match the schema that describes it.
 *
 * @remarks
 * Thrown on both directions by a codec used directly, as in `paymentInputSchema.decode(json)`, so
 * it names no call. Through an operation the same failure reaches you one level down, on the
 * `cause` of the `DecodeError` or `EncodeError` that does name the call.
 *
 * `message` names the field and the type expected, never the value, and `cause` carries the issue
 * list with its original paths. The value that failed is not kept.
 */
export declare class SchemaError extends Error {
    constructor(message: string, cause?: unknown);
}
type SchemaIssue = {
    readonly path: readonly PropertyKey[];
    readonly message: string;
    readonly expected?: string | undefined;
    readonly format?: string | undefined;
    readonly options?: readonly unknown[] | undefined;
};
type SchemaIssues = {
    readonly issues: readonly SchemaIssue[];
};
export declare function issuesMessage(error: SchemaIssues, prefix?: string): string;
export declare function issuesList(error: SchemaIssues): string;
export {};
