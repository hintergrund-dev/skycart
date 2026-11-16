// [id, German label, English label]. Unknown item categories are indexed as "other".
export const CATEGORIES: [string, string, string][] = [
  ['electronics', 'Elektronik', 'Electronics'],
  ['computers', 'Computer & Zubehör', 'Computers & accessories'],
  ['phones', 'Handys & Telefonie', 'Phones & telephony'],
  ['home-kitchen', 'Haushalt & Küche', 'Home & kitchen'],
  ['furniture', 'Möbel & Wohnen', 'Furniture & living'],
  ['garden', 'Garten', 'Garden'],
  ['tools', 'Werkzeug & Baumarkt', 'Tools & DIY'],
  ['toys', 'Spielzeug & Spiele', 'Toys & games'],
  ['baby', 'Baby & Kind', 'Baby & kids'],
  ['fashion', 'Mode & Bekleidung', 'Fashion & clothing'],
  ['shoes-accessories', 'Schuhe & Accessoires', 'Shoes & accessories'],
  ['beauty-health', 'Beauty & Gesundheit', 'Beauty & health'],
  ['sports-outdoor', 'Sport & Outdoor', 'Sports & outdoor'],
  ['books-media', 'Bücher & Medien', 'Books & media'],
  ['music-instruments', 'Musik & Instrumente', 'Music & instruments'],
  ['art-crafts', 'Kunst & Handwerk', 'Art & crafts'],
  ['office-stationery', 'Büro & Schreibwaren', 'Office & stationery'],
  ['pets', 'Haustiere', 'Pets'],
  ['auto-bike', 'Auto & Fahrrad', 'Car & bike'],
  ['food-drink', 'Lebensmittel & Getränke', 'Food & drink'],
  ['other', 'Sonstiges', 'Other'],
];

const IDS = new Set(CATEGORIES.map((c) => c[0]));
export const normalizeCategory = (c: unknown) => (typeof c === 'string' && IDS.has(c) ? c : 'other');

export const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);
