# Shop integration

What a shop has to do to be listed on skycart. The model is in [`plan.md`](plan.md); the record
formats are the lexicons in [`../lexicons/eu/skycart/`](../lexicons/eu/skycart/).

skycart is a search index. Buying happens on your own website, and you remain the merchant.

## 1. Domain handle

Your atproto handle must be a domain you control (for example `shop.example.com`) and must verify
in both directions:

- Your DID document lists the handle in `alsoKnownAs` (`at://shop.example.com`).
- The handle resolves back to your DID, either by `GET https://shop.example.com/.well-known/atproto-did`
  returning the DID as plain text, or by a DNS TXT record `_atproto.shop.example.com` with the value
  `did=did:plc:...`.

## 2. Records in your repository

Prices are integers in the smallest currency unit (cents), gross including VAT.

### `eu.skycart.store` (key `self`)

```json
{
  "$type": "eu.skycart.store",
  "name": "Example Shop",
  "description": "Handmade ceramics from Leipzig.",
  "country": "DE",
  "imprintUrl": "https://shop.example.com/impressum",
  "termsUrl": "https://shop.example.com/agb",
  "withdrawalPolicyUrl": "https://shop.example.com/widerruf",
  "privacyUrl": "https://shop.example.com/datenschutz",
  "shippingInfoUrl": "https://shop.example.com/versand",
  "shippingCountries": ["DE", "AT", "NL"],
  "proofKey": "zDnae...",
  "createdAt": "2027-01-15T10:00:00.000Z"
}
```

Required: `name`, `country`, the five URLs, `shippingCountries`, `createdAt`. Optional: `description`,
`logo` (blob, max 1 MB), `proofKey` (see section 5).

### `eu.skycart.item` (key `tid`)

```json
{
  "$type": "eu.skycart.item",
  "title": "Stoneware mug, blue",
  "description": "Hand-thrown, 300 ml, dishwasher safe.",
  "sku": "MUG-BLUE-300",
  "groupId": "mug-300",
  "priceCents": 2400,
  "currency": "EUR",
  "vatRateBasisPoints": 1900,
  "basePriceInfo": "80,00 € / 1 l",
  "stockStatus": "in_stock",
  "deliveryTime": "2-4 Werktage",
  "category": "home-kitchen",
  "brand": "Example Ceramics",
  "gtin": "4006381333931",
  "condition": "new",
  "manufacturer": { "name": "Example Ceramics GmbH", "address": "Musterstr. 1, 04109 Leipzig, DE", "contact": "safety@example.com" },
  "checkoutUrl": "https://shop.example.com/products/mug-blue",
  "createdAt": "2027-01-15T10:05:00.000Z"
}
```

Required: `title`, `priceCents`, `currency`, `vatRateBasisPoints` (`0` means no VAT is shown, e.g.
small-business rule), `stockStatus` (`in_stock`, `low_stock`, `out_of_stock`, `made_to_order`),
`deliveryTime`, `condition` (`new`, `used`, `refurbished`), `checkoutUrl`, `createdAt`. Optional:
`description`, `sku`, `groupId`, `basePriceInfo`, `images` (up to 8 blobs: jpeg, png or webp, max 2 MB
each), `category`, `brand`, `gtin` (8 to 14 digits), `manufacturer`.

- Items of your shop with the same `groupId` are shown as variants of one product.
- Items with the same `gtin` in different shops are shown as offers of each other.
- `category` is one of the ids returned by `eu.skycart.catalog.getCategories`; unknown values are
  indexed as `other`.
- Images are served from your own atproto server (`com.atproto.sync.getBlob`).

## 3. Listing rules

A shop is listed only when all of these hold:

1. Its handle is a domain it controls and verifies in both directions (section 1).
2. The hosts of `imprintUrl` and of every item's `checkoutUrl` equal the handle or are subdomains of
   it. An item whose `checkoutUrl` is elsewhere is not listed.
3. `imprintUrl` answers with HTTP 200.
4. `country` is an EU member state.

The check runs when your store record arrives and once a day. Shops that fail are kept in the index
but hidden, with the reason stored, and become visible again when they pass.

## 4. checkoutUrl

The "Go to shop" button on skycart opens the item's `checkoutUrl` as is. It should be the page on
your site where this item can be bought (the product page or a link that puts it in your cart). skycart
adds no tracking parameters and never sees what happens next. Contract, payment, VAT, shipping,
returns and product safety are between you and the buyer.

## 5. Purchase proofs (optional)

A proof lets a buyer publish a review that skycart marks as a verified purchase. It contains no price
and no order data. skycart sees a proof only when the buyer publishes a review.

**Key.** Generate a P-256 key pair. Publish the public key in your store record as `proofKey`: a
multibase Multikey, `z` + base58btc of the multicodec prefix `0x80 0x24` followed by the 33-byte
compressed point. Keep the private key on your server.

**Proof.** A compact JWS with header `{"alg":"ES256"}` and claims:

| Claim | Value |
|---|---|
| `iss` | your store DID |
| `sub` | the buyer's DID |
| `item` | optional: the at-uri of the purchased item |
| `iat` | issue time, seconds since epoch |

The signature is ECDSA P-256 over SHA-256 of `base64url(header) + "." + base64url(claims)`, as the raw
64-byte `r || s` value, base64url-encoded (this is what WebCrypto produces).

Hand the proof to the buyer, for example as a "review this purchase" link to a skycart client. The
client writes it into the review's `proof` field. When the review is indexed, skycart checks the
signature against your `proofKey`, `iss` = the review's `store`, `sub` = the review's author, and `item`
(if present) = the review's item. Proofs are checked when a review is indexed, against the `proofKey`
in your store record at that time.

Example (Node 20+, Deno, browsers; ES module):

```js
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const json = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const base58 = (bytes) => {
  let n = bytes.reduce((a, b) => a * 256n + BigInt(b), 0n), s = '';
  for (; n > 0n; n /= 58n) s = ALPHABET[Number(n % 58n)] + s;
  return '1'.repeat(bytes.findIndex((b) => b) < 0 ? bytes.length : bytes.findIndex((b) => b)) + s;
};

// 1. Generate a P-256 key. Keep the private JWK secret on your server.
const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
console.log('private JWK (secret):', JSON.stringify(await crypto.subtle.exportKey('jwk', privateKey)));

// 2. Multikey: 'z' + base58btc(0x80 0x24 + compressed point). Put it in the store record as proofKey.
const raw = new Uint8Array(await crypto.subtle.exportKey('raw', publicKey)); // 0x04 || X || Y
const compressed = Uint8Array.of(2 + (raw[64] & 1), ...raw.slice(1, 33));
console.log('proofKey:', 'z' + base58([0x80, 0x24, ...compressed]));

// 3. Sign a proof for one purchase (item is optional).
const claims = { iss: 'did:plc:STORE', sub: 'did:plc:BUYER', item: 'at://did:plc:STORE/eu.skycart.item/3kabc', iat: Math.floor(Date.now() / 1000) };
const input = `${json({ alg: 'ES256' })}.${json(claims)}`;
const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(input));
console.log('proof:', `${input}.${b64u(sig)}`);
```
