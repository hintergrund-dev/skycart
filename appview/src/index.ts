import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { admin } from './admin';
import { checkBatch, enqueueAll } from './check';
import { Env, XrpcError } from './env';
import { Jetstream } from './jetstream';
import { handleXrpc } from './xrpc';

const app = new Hono<{ Bindings: Env }>();

app.use('/xrpc/*', cors({ origin: '*' }));
app.all('/xrpc/:nsid', (c) => handleXrpc(c.env, c.req.raw, c.req.param('nsid')));
app.route('/admin', admin);

app.onError((e, c) => {
  if (e instanceof XrpcError) return c.json({ error: e.error, message: e.message }, e.status as 400);
  console.log('error', e);
  return c.json({ error: 'InternalServerError' }, 500);
});

export { Jetstream };

export default {
  fetch: app.fetch,
  queue: checkBatch,
  scheduled: (_e: ScheduledController, env: Env, ctx: ExecutionContext) => ctx.waitUntil(enqueueAll(env)),
} satisfies ExportedHandler<Env, { did: string }>;
