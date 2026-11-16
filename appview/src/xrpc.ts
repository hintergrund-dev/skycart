import { CATEGORIES } from './categories';
import { Env, XrpcError } from './env';
import { relevance } from './ranking';

type Ctx = { env: Env; p: URLSearchParams; body: any };
type Method = { type: 'query' | 'procedure'; run: (c: Ctx) => Promise<unknown> };

const NS = 'eu.skycart.';
const bad = (m: string) => new XrpcError(400, 'InvalidRequest', m);
const num = (v: string | null) => (v === null || v === '' ? undefined : Number.isFinite(Number(v)) ? Number(v) : (() => { throw bad('invalid number'); })());

// A store is visible when its last check passed, it is not hidden and its account is active.
// Needs aliases `s` (stores) and `a` (actors of the store).
const STORE_VISIBLE = `s.check_status='ok' AND a.status='active' AND a.handle IS NOT NULL AND s.did NOT IN (SELECT subject FROM hidden)`;
// An item additionally needs to be not hidden and its checkoutUrl host must pass the host rule.
const VISIBLE = `${STORE_VISIBLE} AND i.uri NOT IN (SELECT subject FROM hidden)
  AND (i.host = a.handle OR substr(i.host, -length(a.handle) - 1) = '.' || a.handle)`;
const FROM = 'FROM items i JOIN stores s ON s.did=i.did JOIN actors a ON a.did=i.did';
const COLS = 'i.uri, i.cid, i.did, i.json, s.json AS sjson, a.handle, a.pds';

type Row = { uri: string; cid: string; did: string; json: string; sjson: string; handle: string; pds: string | null };

const blobUrl = (pds: string | null, did: string, b: any) => `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${b.ref.$link}`;

const vatNote = (bp: number) =>
  bp === 0
    ? { de: 'Kein Umsatzsteuerausweis (Kleinunternehmerregelung)', en: 'No VAT shown (small-business rule)' }
    : { de: `inkl. ${bp / 100} % MwSt.`.replace('.', ','), en: `incl. ${bp / 100}% VAT` };

function itemView(r: Row) {
  const { $type, images, ...i } = JSON.parse(r.json);
  const s = JSON.parse(r.sjson);
  return {
    uri: r.uri, cid: r.cid,
    store: { did: r.did, handle: r.handle, name: s.name, country: s.country, shippingInfoUrl: s.shippingInfoUrl, logo: s.logo && blobUrl(r.pds, r.did, s.logo) },
    ...i,
    images: (images ?? []).map((b: any) => blobUrl(r.pds, r.did, b)),
    vatNote: vatNote(i.vatRateBasisPoints),
    shippingInfoUrl: s.shippingInfoUrl,
  };
}

const page = (p: URLSearchParams) => ({ limit: Math.min(num(p.get('limit')) ?? 25, 100), offset: Number(p.get('cursor')) || 0 });

/** Runs an item query; cursors are plain offsets. */
async function queryItems(env: Env, o: { join?: string; where: string[]; binds: unknown[]; order: string; p: URLSearchParams }) {
  const { limit, offset } = page(o.p);
  const { results } = await env.DB.prepare(
    `SELECT ${COLS} ${FROM} LEFT JOIN verified_stats vs ON vs.store_did=i.did ${o.join ?? ''}
     WHERE ${[VISIBLE, ...o.where].join(' AND ')} ORDER BY ${o.order}, i.uri LIMIT ? OFFSET ?`,
  ).bind(...o.binds, limit + 1, offset).all<Row>();
  return { items: results.slice(0, limit).map(itemView), cursor: results.length > limit ? String(offset + limit) : undefined };
}

async function reputation(env: Env, did: string) {
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS n, AVG(rating) AS avg, AVG(verified) AS ver,
            AVG(EXISTS (SELECT 1 FROM replies p WHERE p.review_uri=r.uri AND p.did=r.store_did)) AS rep
     FROM reviews r WHERE r.store_did=?`,
  ).bind(did).first<{ n: number; avg: number | null; ver: number | null; rep: number | null }>();
  const d = (x: number | null | undefined) => (x == null ? undefined : x.toFixed(2));
  return { reviewCount: r!.n, averageRating: d(r!.avg), verifiedShare: d(r!.ver), replyRate: d(r!.rep) };
}

async function storeView(env: Env, actor: string) {
  const row = await env.DB.prepare(
    `SELECT s.did, s.json, a.handle, a.pds FROM stores s JOIN actors a ON a.did=s.did
     WHERE (s.did=? OR a.handle=?) AND ${STORE_VISIBLE}`,
  ).bind(actor, actor.toLowerCase()).first<{ did: string; json: string; handle: string; pds: string | null }>();
  if (!row) throw new XrpcError(404, 'NotFound');
  const { $type, proofKey, logo, ...s } = JSON.parse(row.json);
  return { did: row.did, handle: row.handle, ...s, logo: logo && blobUrl(row.pds, row.did, logo), reputation: await reputation(env, row.did) };
}

const SORTS: Record<string, string> = { priceAsc: 'i.price_cents ASC', priceDesc: 'i.price_cents DESC', newest: 'i.created_at DESC' };
const required = (p: URLSearchParams, k: string) => p.get(k) || (() => { throw bad(`${k} is required`); })();

export const methods: Record<string, Method> = {
  [NS + 'catalog.searchItems']: { type: 'query', run: async ({ env, p }) => {
    const where: string[] = [], binds: unknown[] = [];
    let join: string | undefined;
    const q = p.get('q')?.trim();
    if (q) {
      const tokens = q.slice(0, 200).match(/[\p{L}\p{N}]+/gu) ?? [];
      if (!tokens.length) return { items: [] };
      join = 'JOIN search ON search.uri=i.uri';
      where.push('search MATCH ?');
      binds.push(tokens.map((t) => `"${t}"*`).join(' '));
    }
    const add = (cond: string, v: unknown) => { where.push(cond); binds.push(v); };
    if (p.get('category')) add('i.category=?', p.get('category'));
    if (p.get('minPriceCents')) add('i.price_cents>=?', num(p.get('minPriceCents')));
    if (p.get('maxPriceCents')) add('i.price_cents<=?', num(p.get('maxPriceCents')));
    if (p.get('condition')) add('i.condition=?', p.get('condition'));
    if (p.get('shipsTo')) add("EXISTS (SELECT 1 FROM json_each(s.json, '$.shippingCountries') WHERE value=?)", p.get('shipsTo')!.toUpperCase());
    if (p.get('inStock') === 'true') where.push("i.stock_status IN ('in_stock','low_stock')");
    const sort = p.get('sort') ?? 'relevance';
    if (sort !== 'relevance' && !SORTS[sort]) throw bad('invalid sort');
    // relevance without q has no text score; fall back to newest
    return queryItems(env, { join, where, binds, p, order: sort === 'relevance' ? (q ? relevance() : SORTS.newest) : SORTS[sort] });
  } },

  [NS + 'catalog.getItem']: { type: 'query', run: async ({ env, p }) => {
    const uri = required(p, 'uri');
    const one = (where: string, ...binds: unknown[]) => queryItems(env, { where: [where], binds, order: 'i.price_cents ASC', p: new URLSearchParams({ limit: '50' }) });
    const { items } = await one('i.uri=?', uri);
    if (!items[0]) throw new XrpcError(404, 'NotFound');
    const it = items[0];
    return {
      item: it,
      store: await storeView(env, it.store.did),
      variants: it.groupId ? (await one('i.did=? AND i.group_id=? AND i.uri!=?', it.store.did, it.groupId, uri)).items : [],
      offers: it.gtin ? (await one('i.gtin=? AND i.did!=?', it.gtin, it.store.did)).items : [],
    };
  } },

  [NS + 'catalog.getStore']: { type: 'query', run: async ({ env, p }) => ({ store: await storeView(env, required(p, 'store')) }) },

  [NS + 'catalog.getStoreItems']: { type: 'query', run: async ({ env, p }) => {
    const { did } = await storeView(env, required(p, 'store'));
    return queryItems(env, { where: ['i.did=?'], binds: [did], order: SORTS.newest, p });
  } },

  [NS + 'catalog.getCategories']: { type: 'query', run: async ({ env }) => {
    const { results } = await env.DB.prepare(`SELECT i.category, COUNT(*) AS n ${FROM} WHERE ${VISIBLE} GROUP BY i.category`).all<{ category: string; n: number }>();
    const counts = new Map(results.map((r) => [r.category, r.n]));
    return { categories: CATEGORIES.map(([id, labelDe, labelEn]) => ({ id, labelDe, labelEn, count: counts.get(id) ?? 0 })) };
  } },

  [NS + 'catalog.getReviews']: { type: 'query', run: async ({ env, p }) => {
    const { limit, offset } = page(p);
    const where = [STORE_VISIBLE, "ra.status='active'"], binds: unknown[] = [];
    if (p.get('store')) { where.push('r.store_did=?'); binds.push(p.get('store')); }
    if (p.get('item')) { where.push('r.item_uri=?'); binds.push(p.get('item')); }
    const { results } = await env.DB.prepare(
      `SELECT r.uri, r.cid, r.did, r.store_did, r.item_uri, r.rating, r.text, r.verified, r.created_at, ra.handle
       FROM reviews r JOIN stores s ON s.did=r.store_did JOIN actors a ON a.did=s.did JOIN actors ra ON ra.did=r.did
       WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC, r.uri LIMIT ? OFFSET ?`,
    ).bind(...binds, limit + 1, offset).all<any>();
    const rows = results.slice(0, limit);
    const replies = (await env.DB.prepare(
      `SELECT p.uri, p.review_uri, p.text, p.created_at FROM replies p JOIN reviews r ON r.uri=p.review_uri AND r.store_did=p.did
       WHERE p.review_uri IN (SELECT value FROM json_each(?)) ORDER BY p.created_at`,
    ).bind(JSON.stringify(rows.map((r) => r.uri))).all<any>()).results;
    return {
      reviews: rows.map((r) => ({
        uri: r.uri, cid: r.cid, author: { did: r.did, handle: r.handle ?? undefined }, store: r.store_did, item: r.item_uri ?? undefined,
        rating: r.rating, text: r.text ?? undefined, verified: !!r.verified, createdAt: r.created_at,
        replies: replies.filter((x) => x.review_uri === r.uri).map((x) => ({ uri: x.uri, text: x.text, createdAt: x.created_at })),
      })),
      cursor: results.length > limit ? String(offset + limit) : undefined,
    };
  } },

  [NS + 'moderation.createReport']: { type: 'procedure', run: async ({ env, body }) => {
    const { subject, reason, text, contact } = body ?? {};
    if (typeof subject !== 'string' || subject.length > 2048 || !/^(did:|at:\/\/)/.test(subject)) throw bad('subject must be an at-uri or did');
    if (!['illegal-product', 'counterfeit', 'misleading', 'fraud', 'other'].includes(reason)) throw bad('invalid reason');
    for (const v of [text, contact]) if (v !== undefined && (typeof v !== 'string' || v.length > 10000)) throw bad('text or contact too long');
    const r = await env.DB.prepare('INSERT INTO reports (subject, reason, text, contact) VALUES (?,?,?,?)').bind(subject, reason, text ?? null, contact ?? null).run();
    return { id: r.meta.last_row_id };
  } },
};

export async function handleXrpc(env: Env, req: Request, nsid: string): Promise<Response> {
  const m = methods[nsid];
  if (!m) throw new XrpcError(404, 'MethodNotImplemented');
  if (req.method !== (m.type === 'query' ? 'GET' : 'POST')) throw new XrpcError(405, 'InvalidRequest', 'Wrong HTTP method');
  const body = m.type === 'procedure' ? await req.json().catch(() => { throw bad('invalid JSON body'); }) : undefined;
  return Response.json(await m.run({ env, p: new URL(req.url).searchParams, body }));
}
