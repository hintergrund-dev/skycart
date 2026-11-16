# skycart.eu — plan

Status: proposal. Nothing here is live. Open questions are listed at the end.

## 1. Model

skycart.eu is an open product search engine for independent European shops, built on atproto.

- **Shops** publish their store profile and their items as atproto records in their own
  repository.
- **The appview** indexes those records and offers search, product pages, shop pages and
  reviews.
- **Buying happens on the shop's own website.** Every item carries a `checkoutUrl`; the button on
  skycart says "Zum Shop" / "Go to shop" and opens that URL. skycart has no cart, no checkout, no
  orders, no customer accounts and no payment handling.
- **The shop is the merchant** for contract, payment, VAT, shipping, returns and product safety.
- **No commission, no listing fees, no ads, no sponsored placement, no tracking.** Funding is
  meant to come from public grants and donations.
- Everything is open source; anyone can run another appview on the same lexicons.

skycart never learns whether a purchase happened or for how much. That is deliberate: it keeps
skycart a search and listing service rather than a marketplace operator.

## 2. Lexicons (`eu.skycart.*`)

JSON files live in `lexicons/eu/skycart/...`, one file per NSID. Prices are integers in the
smallest currency unit (cents), gross including VAT.

### Records in the shop's repo

`eu.skycart.store` — key `literal:self`
- `name` string (required, max 120)
- `description` string (max 2000)
- `logo` blob image (max 1 MB)
- `country` string, ISO 3166-1 alpha-2 (required) — where the shop is established; must be an
  EU member state to be listed
- `imprintUrl`, `termsUrl`, `withdrawalPolicyUrl`, `privacyUrl`, `shippingInfoUrl` uri (all
  required)
- `shippingCountries` array of ISO country codes (required, min 1)
- `proofKey` string — optional P-256 public key as a multibase Multikey (`z…`), used to verify
  purchase proofs on reviews
- `createdAt` datetime (required)

`eu.skycart.item` — key `tid`
- `title` string (required, max 200)
- `description` string (max 5000)
- `sku` string (max 64)
- `groupId` string (max 64) — items of one shop with the same `groupId` are variants of one
  product
- `priceCents` integer ≥ 0 (required), `currency` string ISO 4217 (required)
- `vatRateBasisPoints` integer (required) — 1900 = 19 %, 0 = no VAT shown (small-business rule)
- `basePriceInfo` string (max 100) — price per unit for goods sold by weight or volume,
  e.g. `19,90 € / 1 kg`
- `stockStatus` string, knownValues `in_stock`, `low_stock`, `out_of_stock`, `made_to_order`
  (required)
- `deliveryTime` string (required, max 50), e.g. `2-4 Werktage`
- `images` array of blob (jpeg/png/webp, max 2 MB each, max 8)
- `category` string — one of the ids in the category list; unknown values are indexed as `other`
- `brand` string, `gtin` string (8–14 digits)
- `condition` string, knownValues `new`, `used`, `refurbished` (required)
- `manufacturer` object `{ name, address, contact }` (all strings) — product-safety contact
- `checkoutUrl` uri (required) — the page on the shop's site where this item can be bought
- `createdAt` datetime (required)

`eu.skycart.reply` — key `tid`: `subject` strongRef (a review), `text` (required, max 2000),
`createdAt`

### Records in the buyer's repo

`eu.skycart.review` — key `tid`
- `store` did (required)
- `item` strongRef (optional; omitted means the review is about the shop)
- `rating` integer 1–5 (required)
- `text` string (max 5000)
- `proof` string — optional purchase proof issued by the shop
- `createdAt` datetime (required)

`eu.skycart.wishlist` — key `tid`: `name` (required), `items` array of strongRef, `createdAt`.
Clients read wishlists straight from the owner's repository; the appview does not index them.

### Not records

Orders, addresses, payments and carts do not exist in skycart at all.

## 3. Shop identity

A shop is listed only when all of these hold:
1. Its atproto handle is a domain it controls, and the handle verifies in both directions (DID
   document names the handle; the handle resolves back to the DID).
2. The hosts of `imprintUrl` and of every item's `checkoutUrl` equal the handle or are
   subdomains of it. An item whose `checkoutUrl` is elsewhere is not listed.
3. `imprintUrl` answers with HTTP 200.
4. `country` is an EU member state.

The check runs when a store record arrives and once a day for every store. Shops that fail are
kept in the index but hidden, with the reason stored, and become visible again when they pass.

## 4. Purchase proofs

A shop that sets `proofKey` can give a buyer a proof after a purchase, for example as a
"review this purchase" link. The proof is a compact ES256 JWS with the claims
`{ iss: <store DID>, sub: <buyer DID>, item?: <item at-uri>, iat }`. It contains no price and no
order data.

When a review with a `proof` is indexed, the appview verifies the signature against the store's
`proofKey` and checks `iss` = the review's `store`, `sub` = the review's author, and `item` (if
present) = the review's item. Reviews that pass are marked as verified purchases. skycart sees a
proof only when a buyer chooses to publish a review.

`docs/shop-integration.md` specifies everything a shop has to implement.

## 5. XRPC API

All methods are queries without authentication, plus one unauthenticated procedure.

| Method | Purpose |
|---|---|
| `eu.skycart.catalog.searchItems` | params `q?`, `category?`, `minPriceCents?`, `maxPriceCents?`, `condition?`, `shipsTo?`, `inStock?`, `sort?` (`relevance`, `priceAsc`, `priceDesc`, `newest`), `limit`, `cursor` |
| `eu.skycart.catalog.getItem` | one item with its store, its variants (same `groupId`) and offers from other shops with the same `gtin` |
| `eu.skycart.catalog.getStore` | store profile, legal links, reputation |
| `eu.skycart.catalog.getStoreItems` | paginated |
| `eu.skycart.catalog.getCategories` | category ids with German and English labels and item counts |
| `eu.skycart.catalog.getReviews` | params `store?`, `item?`; paginated, with replies |
| `eu.skycart.moderation.createReport` | procedure; input `{ subject: at-uri or did, reason, text?, contact? }`; reasons `illegal-product`, `counterfeit`, `misleading`, `fraud`, `other` |

Item views always include what price law requires next to a price: VAT note, link to
`shippingInfoUrl`, `basePriceInfo` when present, and `deliveryTime`.

## 6. Appview

Runs on Cloudflare: one Worker, one Durable Object, one Queue, D1, Cron.

- **Ingest:** the Durable Object keeps a WebSocket to Jetstream filtered to the `eu.skycart.*`
  collections, stores the cursor, and an alarm reconnects it. Each record is validated against
  the lexicon and upserted or deleted in D1. Account and identity events update handle and
  account status.
- **Store checks (Queue + daily Cron):** section 3.
- **Search:** SQLite FTS5 over title, description, brand and shop name.
- **Ranking for `relevance`:** FTS5 bm25 score, then a small boost for the shop's average rating
  from verified-purchase reviews (no boost below three such reviews). Nothing else influences
  ranking. The formula lives in one function and is described in the README.
- **Reputation per shop:** average rating, review count, share of verified-purchase reviews,
  reply rate.
- **Images** are served from the shop's own atproto server (`com.atproto.sync.getBlob`); the
  appview returns the URLs.
- **Moderation and admin** (bearer secret): list reports, hide or unhide an item or a store.
- The appview sets no cookies and makes no third-party requests on behalf of visitors.

## 7. Landing page

Static SvelteKit site, German and English, labelled as a proposal and "coming soon".

| Section | Content |
|---|---|
| Hero | One-sentence pitch, "proposal — in development" label |
| How buying works | Diagram: search on skycart → "Go to shop" → buy on the shop's own site; money and data go to the shop only |
| What is different | Diagram: marketplace (platform sits between buyer and shop, takes commission, holds the data) vs skycart (index only) |
| How it is built | Diagram: shop's website, shop's atproto repo, appview, browser |
| Principles | No commission, no ads, no tracking, open source, documented ranking, shops keep their customers |
| For shops | What a shop needs: a domain handle, the two record types, legal links, optionally purchase proofs |
| Open questions | Legal classification, trust without platform buyer protection, funding — stated as unresolved |
| Follow | Link to the GitHub repo and the `@skycart.eu` atproto account; no email collection |

Diagrams are inline SVG and work in light and dark mode.

## 8. Out of scope for now

- The search web client.
- The shop-side integration; only its spec exists. Planned as an open reference implementation
  plus importers for common shop systems. Any shop system, open or closed, can implement the
  same spec.
- Any cart, checkout, order, account or payment feature.

## 9. Planned next

Not built yet. These are the next steps after the first appview.

- **Adjustable ranking:** a buyer can set their own ranking preferences (for example: nearby
  shops first, verified-purchase ratings weighted higher, used goods first) and can subscribe to
  a ranking published by someone else, in the way Bluesky custom feeds work. The default ranking
  stays the documented one from section 6.
- **Labels for trust and moderation:** moderation decisions are published as atproto labels
  instead of living only in the appview's database, so they are public and portable. Independent
  labelers, such as a trade association or a consumer organisation, can issue their own labels
  ("checked trader"), and buyers choose which labelers they trust. Domain-bound identity
  (section 3) proves who controls a shop's domain, not that the business is sound; labels are
  meant to close that gap.
- **Moderation process:** rate limiting for reports, a notice to the shop with the reason when
  something is hidden, a way to object, and a public log of decisions.
- **Self-hosting:** the appview should also run without Cloudflare, on Node.js with SQLite, so
  that a second operator is not tied to one provider.
- **Search web client** and **shop integration** from section 8.

## 10. Open questions

- **Legal classification:** a lawyer should confirm that a search service that links to shops,
  without concluding contracts or seeing transactions, stays outside marketplace-operator duties
  (tax reporting of seller income, trader traceability, packaging and electronics registration
  checks).
- **Trust:** skycart cannot offer buyer protection because it never holds money. Trust rests on
  domain-bound shop identity, legally required shop information, public reviews and whatever
  payment protection the shop's own payment methods carry.
- **Funding:** grant applications are being prepared; nothing is secured.
