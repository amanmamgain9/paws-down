import type { TokenProvider } from "./core/auth/credentials.js";
import type { CoreClientOptions } from "./core/client-options.js";

export type ClientOptions = SdkClientOptions & CoreClientOptions;

type SdkClientOptions = ServerOptions & {
  /** The API key issued to a wingcat agent. */
  readonly apiKeyAuth?: TokenProvider | undefined;
};

type ServerOptions = {
  /** Local development server */
  readonly serverOptions?: {
    baseUrl?: string;
  };
};
