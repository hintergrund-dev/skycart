import { Hono } from 'hono';
import { enqueueAll } from './check';
import { Env } from './env';

export const admin = new Hono<{ Bindings: Env }>();

admin.use('*', async (c, next) => {
  const given = c.req.header('authorization') ?? '';
  const want = `Bearer ${c.env.ADMIN_SECRET}`;
  const ok = c.env.ADMIN_SECRET && given.length === want.length && crypto.subtle.timingSafeEqual(new TextEncoder().encode(given), new TextEncoder().encode(want));
  return ok ? next() : c.json({ error: 'Unauthorized' }, 401);
});

admin.get('/reports', async (c) => c.json((await c.env.DB.prepare('SELECT * FROM reports ORDER BY id DESC LIMIT 200').all()).results));

// Stores that failed their check, with the reason.
admin.get('/stores/failed', async (c) => c.json((await c.env.DB.prepare("SELECT did, name, check_reason, checked_at FROM stores WHERE check_status='failed'").all()).results));

// Hide or unhide an item (at-uri) or a store (did).
admin.post('/hide', async (c) => {
  const { subject } = await c.req.json<{ subject: string }>();
  await c.env.DB.prepare('INSERT OR IGNORE INTO hidden (subject) VALUES (?)').bind(subject).run();
  return c.json({ ok: true });
});

admin.post('/unhide', async (c) => {
  const { subject } = await c.req.json<{ subject: string }>();
  await c.env.DB.prepare('DELETE FROM hidden WHERE subject=?').bind(subject).run();
  return c.json({ ok: true });
});

admin.post('/checks/run', async (c) => {
  await enqueueAll(c.env);
  return c.json({ ok: true });
});

// Starts (or checks) the Jetstream consumer; its alarm keeps it connected afterwards.
admin.post('/ingest/start', async (c) => c.json(await (await c.env.JETSTREAM.get(c.env.JETSTREAM.idFromName('main')).fetch('https://do/')).json()));
