const enc = new TextEncoder();
export const utf8 = (s: string) => enc.encode(s);

export function b64uToBytes(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Host rule: the URL's host equals the handle or is a subdomain of it. */
export function hostMatchesHandle(host: string, handle: string): boolean {
  return host === handle || host.endsWith('.' + handle);
}

export const hostOf = (url: string) => new URL(url).hostname.toLowerCase();
