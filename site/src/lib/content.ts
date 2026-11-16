export type Lang = 'de' | 'en';
export const GITHUB = 'https://github.com/hintergrund-dev/skycart';
export const ATPROTO = 'https://bsky.app/profile/skycart.eu';

const en = {
  htmlTitle: 'skycart.eu — proposal',
  description: 'A proposed open product search engine for independent European shops, built on atproto. Buying happens on the shop\'s own website.',
  nav: { other: 'Deutsch', otherHref: '/' },
  label: 'Proposal — in development · coming soon',
  h1: 'Search independent European shops. Buy on their own websites.',
  pitch: [
    'skycart.eu is a proposed open product search engine for independent European shops, built on atproto. Shops publish their store profile and their items in their own atproto repository. skycart indexes them and offers search, product pages, shop pages and reviews.',
    'Nothing here is live yet. This page describes the plan.',
  ],
  flow: {
    h: 'How buying works',
    p: [
      'Every item carries a checkout URL on the shop\'s own site. The button on skycart says "Go to shop" and opens that URL.',
      'skycart has no cart, no checkout, no orders, no customer accounts and no payment handling. The shop is the merchant for contract, payment, VAT, shipping, returns and product safety. skycart never learns whether a purchase happened or for how much.',
    ],
    d: { title: 'How buying works', s1: '1  Search on skycart', s1s: 'find an item', s2: '2  "Go to shop"', s2s: 'opens the item\'s checkout URL', s3: '3  Buy on the shop\'s site', s3s: 'contract, payment, shipping', note: 'Money and data go to the shop only' },
  },
  diff: {
    h: 'What is different',
    p: [
      'On a marketplace, the platform sits between buyer and shop, takes a commission and holds the data. skycart is only an index: it points to the shop, and the buyer deals with the shop directly.',
    ],
    d: { title: 'Marketplace versus skycart', m: 'Marketplace', k: 'skycart', buyer: 'Buyer', shop: 'Shop', platform: 'Platform', platformSub: 'commission, holds data', index: 'skycart', indexSub: 'index only', search: 'search', direct: 'buys directly' },
  },
  built: {
    h: 'How it is built',
    p: [
      'The shop\'s website sells; the shop\'s atproto repository holds its store and item records. The appview follows those records, checks each shop and serves search. Images are served from the shop\'s own atproto server. Anyone can run another appview on the same lexicons.',
      'A shop is listed only if its handle is a domain it controls and verifies in both directions, the imprint and every checkout URL are on that domain, the imprint page answers with HTTP 200, and the shop is established in an EU member state. This is checked on arrival and once a day.',
    ],
    d: { title: 'Architecture', site: 'Shop\'s website', siteSub: 'checkout, imprint', repo: 'Shop\'s atproto repo', repoSub: 'store, item records', app: 'Appview', appSub: 'index, checks, search', browser: 'Browser', browserSub: 'skycart in the visitor\'s browser', records: 'records', search: 'search', go: '"Go to shop"', images: 'images' },
  },
  principles: {
    h: 'Principles',
    items: [
      ['No commission', 'no listing fees. Funding is meant to come from public grants and donations.'],
      ['No ads', 'no sponsored placement.'],
      ['No tracking', 'no cookies, no analytics, no third-party requests from the appview.'],
      ['Open source', 'and open lexicons; anyone can run an appview.'],
      ['Documented ranking', 'text relevance, plus a small boost for shops with good verified-purchase reviews. Nothing else.'],
      ['Shops keep their customers', 'the sale, the data and the relationship stay with the shop.'],
    ] as [string, string][],
  },
  shops: {
    h: 'For shops',
    p: 'A shop needs:',
    items: [
      'a domain as its atproto handle, e.g. shop.example.com',
      'two record types in its own repository: one store record and one record per item',
      'imprint, terms, withdrawal policy, privacy and shipping links, all on that domain',
      'a checkout URL on that domain for every item',
      'optionally, a public key so that it can issue purchase proofs for reviews',
    ],
    more: 'The specification is in the repository.',
    link: 'docs/shop-integration.md',
    linkHref: `${GITHUB}/blob/main/docs/shop-integration.md`,
  },
  open: {
    h: 'Open questions',
    p: 'These are unresolved.',
    items: [
      ['Legal classification', 'a lawyer should confirm that a search service that links to shops, without concluding contracts or seeing transactions, stays outside marketplace-operator duties.'],
      ['Trust', 'skycart cannot offer buyer protection because it never holds money. Trust rests on domain-bound shop identity, legally required shop information, public reviews and whatever payment protection the shop\'s own payment methods carry.'],
      ['Funding', 'grant applications are being prepared; nothing is secured.'],
    ] as [string, string][],
  },
  follow: { h: 'Follow', p: 'Source code and plan:', gh: 'GitHub', mid: 'On atproto:', handle: '@skycart.eu', tail: 'There is no email signup.' },
};

const de: typeof en = {
  htmlTitle: 'skycart.eu — Vorschlag',
  description: 'Eine vorgeschlagene offene Produktsuche für unabhängige europäische Shops auf Basis von atproto. Gekauft wird auf der eigenen Website des Shops.',
  nav: { other: 'English', otherHref: '/en' },
  label: 'Vorschlag — in Entwicklung · bald verfügbar',
  h1: 'Unabhängige europäische Shops durchsuchen. Auf deren eigener Website kaufen.',
  pitch: [
    'skycart.eu ist eine vorgeschlagene offene Produktsuche für unabhängige europäische Shops auf Basis von atproto. Shops veröffentlichen ihr Shopprofil und ihre Artikel in ihrem eigenen atproto-Repository. skycart indexiert sie und bietet Suche, Produktseiten, Shopseiten und Bewertungen.',
    'Noch ist nichts live. Diese Seite beschreibt den Plan.',
  ],
  flow: {
    h: 'So funktioniert der Kauf',
    p: [
      'Jeder Artikel trägt eine Checkout-URL auf der eigenen Website des Shops. Der Button auf skycart heißt „Zum Shop“ und öffnet diese URL.',
      'skycart hat keinen Warenkorb, keinen Checkout, keine Bestellungen, keine Kundenkonten und keine Zahlungsabwicklung. Der Shop ist Händler für Vertrag, Zahlung, Umsatzsteuer, Versand, Rückgabe und Produktsicherheit. skycart erfährt nie, ob ein Kauf stattfand oder in welcher Höhe.',
    ],
    d: { title: 'So funktioniert der Kauf', s1: '1  Auf skycart suchen', s1s: 'Artikel finden', s2: '2  „Zum Shop“', s2s: 'öffnet die Checkout-URL des Artikels', s3: '3  Im Shop kaufen', s3s: 'Vertrag, Zahlung, Versand', note: 'Geld und Daten gehen nur an den Shop' },
  },
  diff: {
    h: 'Was anders ist',
    p: [
      'Auf einem Marktplatz steht die Plattform zwischen Käufer und Shop, nimmt Provision und hält die Daten. skycart ist nur ein Index: Es verweist auf den Shop, und der Käufer handelt direkt mit dem Shop.',
    ],
    d: { title: 'Marktplatz und skycart im Vergleich', m: 'Marktplatz', k: 'skycart', buyer: 'Käufer', shop: 'Shop', platform: 'Plattform', platformSub: 'Provision, hält Daten', index: 'skycart', indexSub: 'nur Index', search: 'sucht', direct: 'kauft direkt' },
  },
  built: {
    h: 'Wie es gebaut ist',
    p: [
      'Die Website des Shops verkauft; das atproto-Repository des Shops enthält Shop- und Artikel-Records. Der Appview folgt diesen Records, prüft jeden Shop und liefert die Suche. Bilder kommen vom eigenen atproto-Server des Shops. Jeder kann einen weiteren Appview auf denselben Lexicons betreiben.',
      'Ein Shop wird nur gelistet, wenn sein Handle eine Domain ist, die er kontrolliert, und in beide Richtungen verifiziert ist, das Impressum und jede Checkout-URL auf dieser Domain liegen, die Impressumsseite mit HTTP 200 antwortet und der Shop in einem EU-Mitgliedstaat niedergelassen ist. Das wird beim Eintreffen und einmal täglich geprüft.',
    ],
    d: { title: 'Architektur', site: 'Website des Shops', siteSub: 'Checkout, Impressum', repo: 'atproto-Repo des Shops', repoSub: 'Shop- und Artikel-Records', app: 'Appview', appSub: 'Index, Prüfung, Suche', browser: 'Browser', browserSub: 'skycart beim Besucher', records: 'Records', search: 'Suche', go: '„Zum Shop“', images: 'Bilder' },
  },
  principles: {
    h: 'Grundsätze',
    items: [
      ['Keine Provision', 'keine Listungsgebühren. Die Finanzierung soll aus öffentlichen Fördermitteln und Spenden kommen.'],
      ['Keine Werbung', 'keine bezahlte Platzierung.'],
      ['Kein Tracking', 'keine Cookies, keine Analyse, keine Anfragen des Appviews an Dritte.'],
      ['Open Source', 'und offene Lexicons; jeder kann einen Appview betreiben.'],
      ['Dokumentiertes Ranking', 'Textrelevanz, dazu ein kleiner Bonus für Shops mit guten Bewertungen aus verifizierten Käufen. Sonst nichts.'],
      ['Shops behalten ihre Kunden', 'Verkauf, Daten und Kundenbeziehung bleiben beim Shop.'],
    ],
  },
  shops: {
    h: 'Für Shops',
    p: 'Ein Shop braucht:',
    items: [
      'eine Domain als atproto-Handle, z. B. shop.example.com',
      'zwei Record-Typen im eigenen Repository: einen Shop-Record und je Artikel einen Record',
      'Links zu Impressum, AGB, Widerrufsbelehrung, Datenschutz und Versandinformationen, alle auf dieser Domain',
      'eine Checkout-URL auf dieser Domain für jeden Artikel',
      'optional einen öffentlichen Schlüssel, um Kaufbelege für Bewertungen auszustellen',
    ],
    more: 'Die Spezifikation liegt im Repository.',
    link: 'docs/shop-integration.md',
    linkHref: `${GITHUB}/blob/main/docs/shop-integration.md`,
  },
  open: {
    h: 'Offene Fragen',
    p: 'Diese Fragen sind ungeklärt.',
    items: [
      ['Rechtliche Einordnung', 'Ein Anwalt sollte bestätigen, dass ein Suchdienst, der auf Shops verlinkt, ohne Verträge zu schließen oder Transaktionen zu sehen, außerhalb der Pflichten eines Marktplatzbetreibers bleibt.'],
      ['Vertrauen', 'skycart kann keinen Käuferschutz bieten, weil es nie Geld hält. Vertrauen beruht auf domaingebundener Shop-Identität, gesetzlich vorgeschriebenen Shop-Angaben, öffentlichen Bewertungen und dem Zahlungsschutz, den die Zahlungsarten des Shops selbst mitbringen.'],
      ['Finanzierung', 'Förderanträge werden vorbereitet; nichts ist gesichert.'],
    ],
  },
  follow: { h: 'Folgen', p: 'Quellcode und Plan:', gh: 'GitHub', mid: 'Auf atproto:', handle: '@skycart.eu', tail: 'Es gibt keine E-Mail-Anmeldung.' },
};

export const content = { en, de };
