import { handleOf, handleResolvesTo, isDomainHandle, pdsOf, resolveDid } from './auth';
import { EU_COUNTRIES } from './categories';
import { Env } from './env';
import { hostMatchesHandle, hostOf } from './util';

const MAX_ATTEMPTS = 3;

/** Section 3 of the plan. Returns the failure reason, or null when the store passes. Throws when the DID cannot be resolved. */
async function check(env: Env, did: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT json FROM stores WHERE did=?').bind(did).first<{ json: string }>();
  if (!row) return null;
  const store = JSON.parse(row.json);
  const doc = await resolveDid(did, true);
  const handle = handleOf(doc);
  await env.DB.prepare('UPDATE actors SET handle=NULL, pds=? WHERE did=?').bind(pdsOf(doc), did).run();
  if (!handle || !isDomainHandle(handle)) return 'handle-not-a-domain';
  if (!(await handleResolvesTo(handle, did))) return 'handle-not-verified';
  await env.DB.prepare('UPDATE actors SET handle=? WHERE did=?').bind(handle, did).run();
  if (!hostMatchesHandle(hostOf(store.imprintUrl), handle)) return 'imprint-host-mismatch';
  if (!EU_COUNTRIES.has(String(store.country).toUpperCase())) return 'country-not-eu';
  try {
    const res = await fetch(store.imprintUrl);
    await res.body?.cancel();
    if (res.status !== 200) return 'imprint-not-200';
  } catch {
    return 'imprint-not-200';
  }
  return null;
}

async function record(env: Env, did: string, reason: string | null) {
  await env.DB.prepare("UPDATE stores SET check_status=?, check_reason=?, checked_at=datetime('now') WHERE did=?")
    .bind(reason ? 'failed' : 'ok', reason, did).run();
}

export async function checkBatch(batch: MessageBatch<{ did: string }>, env: Env) {
  for (const msg of batch.messages) {
    try {
      await record(env, msg.body.did, await check(env, msg.body.did));
    } catch (e) {
      if (msg.attempts < MAX_ATTEMPTS) {
        msg.retry({ delaySeconds: 60 * msg.attempts });
        continue;
      }
      await record(env, msg.body.did, 'did-unresolvable');
    }
    msg.ack();
  }
}

/** Daily cron: enqueue a check for every store. */
export async function enqueueAll(env: Env) {
  const { results } = await env.DB.prepare('SELECT did FROM stores').all<{ did: string }>();
  for (let i = 0; i < results.length; i += 100) {
    await env.CHECK_QUEUE.sendBatch(results.slice(i, i + 100).map((r) => ({ body: { did: r.did } })));
  }
}
