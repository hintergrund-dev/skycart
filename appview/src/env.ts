export interface Env {
  DB: D1Database;
  JETSTREAM: DurableObjectNamespace;
  CHECK_QUEUE: Queue<{ did: string }>;
  JETSTREAM_URL: string;
  ADMIN_SECRET: string; // secret
}

export class XrpcError extends Error {
  constructor(public status: number, public error: string, message?: string) {
    super(message ?? error);
  }
}
