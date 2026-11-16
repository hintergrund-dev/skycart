import { jsonToLex, Lexicons, type LexiconDoc } from '@atproto/lexicon';
import store from '../../lexicons/eu/skycart/store.json';
import item from '../../lexicons/eu/skycart/item.json';
import review from '../../lexicons/eu/skycart/review.json';
import reply from '../../lexicons/eu/skycart/reply.json';
import { verifyProof } from './auth';
import { normalizeCategory } from './categories';
import { Env } from './env';
import { hostOf } from './util';

const strongRef = {
  lexicon: 1, id: 'com.atproto.repo.strongRef',
  defs: { main: { type: 'object', required: ['uri', 'cid'], properties: { uri: { type: 'string', format: 'at-uri' }, cid: { type: 'string', format: 'cid' } } } },
};

const lex = new Lexicons([strongRef, store, item, review, reply] as LexiconDoc[]);

// Wishlists are read from the owner's repository and not indexed.
export const COLLECTIONS = [store, item, review, reply].map((d) => d.id);
const NS = (n: string) => `eu.skycart.${n}`;

type JetstreamEvent = {
  did: string;
  kind: 'commit' | 'identity' | 'account';
  commit?: { operation: 'create' | 'update' | 'delete'; collection: string; rkey: string; cid?: string; record?: any };
  account?: { active: boolean; status?: string };
};

const TABLES: Record<string, string> = { [NS('item')]: 'items', [NS('review')]: 'reviews', [NS('reply')]: 'replies' };

export async function handleEvent(env: Env, ev: JetstreamEvent, known: Set<string>): Promise<void> {
  const { did } = ev;
  if (ev.kind === 'identity') {
    if (known.has(did)) await env.CHECK_QUEUE.send({ did }); // the check re-verifies the handle
    return;
  }
  if (ev.kind === 'account') {
    if (known.has(did) && ev.account) {
      await env.DB.prepare('UPDATE actors SET status=? WHERE did=?').bind(ev.account.active ? 'active' : (ev.account.status ?? 'inactive'), did).run();
    }
    return;
  }
  const c = ev.commit;
  if (!c || !COLLECTIONS.includes(c.collection)) return;
  const uri = `at://${did}/${c.collection}/${c.rkey}`;

  if (c.operation === 'delete') {
    if (c.collection === NS('store')) await env.DB.prepare('DELETE FROM stores WHERE did=?').bind(did).run();
    else {
      await env.DB.prepare(`DELETE FROM ${TABLES[c.collection]} WHERE uri=?`).bind(uri).run();
      if (c.collection === NS('item')) await env.DB.prepare('DELETE FROM search WHERE uri=?').bind(uri).run();
    }
    return;
  }

  const r = { ...c.record, $type: c.collection };
  try {
    lex.assertValidRecord(c.collection, jsonToLex(r));
    if (c.collection === NS('store') && c.rkey !== 'self') throw new Error('store key must be self');
    if (c.collection === NS('item') && r.gtin !== undefined && !/^\d{8,14}$/.test(r.gtin)) throw new Error('bad gtin');
    if (c.collection === NS('item')) hostOf(r.checkoutUrl);
    if (c.collection === NS('review') && r.item && !r.item.uri.startsWith(`at://${r.store}/${NS('item')}/`)) throw new Error('item does not belong to store');
  } catch (e) {
    console.log('skip invalid record', uri, String(e));
    return;
  }

  if (!known.has(did)) {
    await env.DB.prepare('INSERT OR IGNORE INTO actors (did) VALUES (?)').bind(did).run();
    known.add(did);
  }
  const json = JSON.stringify(r);
  const cid = c.cid ?? '';

  if (c.collection === NS('store')) {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO stores (did, cid, json, name) VALUES (?,?,?,?) ON CONFLICT(did) DO UPDATE SET cid=excluded.cid, json=excluded.json, name=excluded.name')
        .bind(did, cid, json, r.name),
      env.DB.prepare('UPDATE search SET shop=? WHERE did=?').bind(r.name, did),
    ]);
    await env.CHECK_QUEUE.send({ did });
  } else if (c.collection === NS('item')) {
    await env.DB.batch([
      env.DB.prepare('INSERT OR REPLACE INTO items (uri, did, cid, json, category, price_cents, condition, stock_status, gtin, group_id, host, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(uri, did, cid, json, normalizeCategory(r.category), r.priceCents, r.condition, r.stockStatus, r.gtin ?? null, r.groupId ?? null, hostOf(r.checkoutUrl), r.createdAt),
      env.DB.prepare('DELETE FROM search WHERE uri=?').bind(uri),
      env.DB.prepare('INSERT INTO search (uri, did, title, description, brand, shop) VALUES (?,?,?,?,?,COALESCE((SELECT name FROM stores WHERE did=?), ?))')
        .bind(uri, did, r.title, r.description ?? '', r.brand ?? '', did, ''),
    ]);
  } else if (c.collection === NS('review')) {
    const key = (await env.DB.prepare('SELECT json FROM stores WHERE did=?').bind(r.store).first<{ json: string }>())?.json;
    const proofKey = key ? JSON.parse(key).proofKey : undefined;
    const verified = r.proof && proofKey && verifyProof(r.proof, proofKey, { store: r.store, author: did, item: r.item?.uri }) ? 1 : 0;
    await env.DB.prepare('INSERT OR REPLACE INTO reviews (uri, cid, did, store_did, item_uri, rating, text, verified, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(uri, cid, did, r.store, r.item?.uri ?? null, r.rating, r.text ?? null, verified, r.createdAt).run();
  } else {
    await env.DB.prepare('INSERT OR REPLACE INTO replies (uri, did, review_uri, text, created_at) VALUES (?,?,?,?,?)')
      .bind(uri, did, r.subject.uri, r.text, r.createdAt).run();
  }
}
