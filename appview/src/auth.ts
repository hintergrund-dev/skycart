import { p256 } from '@noble/curves/nist.js';
import { b64uToBytes, utf8 } from './util';

export type DidDoc = {
  alsoKnownAs?: string[];
  service?: { id: string; type: string; serviceEndpoint: string }[];
};

const cache = new Map<string, { doc: DidDoc; exp: number }>();

/** Resolves did:plc and did:web (no path). Throws when the DID cannot be fetched. */
export async function resolveDid(did: string, fresh = false): Promise<DidDoc> {
  const hit = cache.get(did);
  if (!fresh && hit && hit.exp > Date.now()) return hit.doc;
  let url: string;
  if (did.startsWith('did:plc:')) url = `https://plc.directory/${did}`;
  else if (did.startsWith('did:web:') && !did.slice(8).includes(':')) url = `https://${decodeURIComponent(did.slice(8))}/.well-known/did.json`;
  else throw new Error('unsupported DID method');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`cannot resolve ${did}: ${res.status}`);
  const doc = (await res.json()) as DidDoc;
  cache.set(did, { doc, exp: Date.now() + 5 * 60_000 });
  return doc;
}

export const handleOf = (doc: DidDoc) => doc.alsoKnownAs?.find((a) => a.startsWith('at://'))?.slice(5).toLowerCase() ?? null;
export const pdsOf = (doc: DidDoc) => doc.service?.find((s) => s.id === '#atproto_pds')?.serviceEndpoint.replace(/\/$/, '') ?? null;

const HANDLE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;
export const isDomainHandle = (h: string) => h.length <= 253 && HANDLE.test(h);

/** Handle -> DID: HTTPS well-known first, then the `_atproto` TXT record via DNS-over-HTTPS. */
export async function handleResolvesTo(handle: string, did: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${handle}/.well-known/atproto-did`);
    if (res.ok && (await res.text()).trim() === did) return true;
  } catch {}
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=_atproto.${handle}&type=TXT`, { headers: { accept: 'application/dns-json' } });
    const j = (await res.json()) as { Answer?: { type: number; data: string }[] };
    return (j.Answer ?? []).some((a) => a.type === 16 && a.data.replace(/"/g, '') === `did=${did}`);
  } catch {
    return false;
  }
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58btc(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error('bad base58');
    n = n * 58n + BigInt(i);
  }
  const out: number[] = [];
  for (; n > 0n; n >>= 8n) out.unshift(Number(n & 0xffn));
  return Uint8Array.from([...Array(s.length - s.replace(/^1+/, '').length).fill(0), ...out]);
}

/** Decode a P-256 Multikey: `z` + base58btc of (0x80 0x24 + compressed point). */
function parseP256Multikey(mb: string): Uint8Array {
  const raw = base58btc(mb.slice(1));
  if (mb[0] !== 'z' || raw[0] !== 0x80 || raw[1] !== 0x24 || raw.length !== 35) throw new Error('not a P-256 Multikey');
  return raw.slice(2);
}

export type ProofContext = { store: string; author: string; item?: string };

/** Verifies a purchase proof (compact ES256 JWS) against the store's Multikey and the review's fields. */
export function verifyProof(jws: string, proofKey: string, ctx: ProofContext): boolean {
  try {
    const [h, c, sig, ...rest] = jws.split('.');
    if (!sig || rest.length) return false;
    const dec = (s: string) => JSON.parse(new TextDecoder().decode(b64uToBytes(s)));
    if (dec(h).alg !== 'ES256') return false;
    const claims = dec(c);
    if (claims.iss !== ctx.store || claims.sub !== ctx.author || typeof claims.iat !== 'number') return false;
    if (claims.item !== undefined && claims.item !== ctx.item) return false;
    // lowS: false because WebCrypto signatures are not normalised to low-S
    return p256.verify(b64uToBytes(sig), utf8(`${h}.${c}`), parseP256Multikey(proofKey), { prehash: true, lowS: false });
  } catch {
    return false;
  }
}
