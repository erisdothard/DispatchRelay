/** Freight-market cities the demo knows about: state + coordinates for distance estimates. */

export interface City {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const CITIES: readonly City[] = [
  { name: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { name: 'Savannah', state: 'GA', lat: 32.081, lng: -81.091 },
  { name: 'Dallas', state: 'TX', lat: 32.777, lng: -96.797 },
  { name: 'Fort Worth', state: 'TX', lat: 32.755, lng: -97.331 },
  { name: 'Houston', state: 'TX', lat: 29.76, lng: -95.37 },
  { name: 'San Antonio', state: 'TX', lat: 29.424, lng: -98.494 },
  { name: 'Austin', state: 'TX', lat: 30.267, lng: -97.743 },
  { name: 'El Paso', state: 'TX', lat: 31.762, lng: -106.485 },
  { name: 'Laredo', state: 'TX', lat: 27.506, lng: -99.507 },
  { name: 'Nashville', state: 'TN', lat: 36.163, lng: -86.781 },
  { name: 'Memphis', state: 'TN', lat: 35.149, lng: -90.049 },
  { name: 'Knoxville', state: 'TN', lat: 35.96, lng: -83.921 },
  { name: 'Chattanooga', state: 'TN', lat: 35.046, lng: -85.309 },
  { name: 'Chicago', state: 'IL', lat: 41.878, lng: -87.63 },
  { name: 'Los Angeles', state: 'CA', lat: 34.052, lng: -118.244 },
  { name: 'Fresno', state: 'CA', lat: 36.738, lng: -119.787 },
  { name: 'Salinas', state: 'CA', lat: 36.678, lng: -121.656 },
  { name: 'Ontario', state: 'CA', lat: 34.063, lng: -117.651 },
  { name: 'San Diego', state: 'CA', lat: 32.716, lng: -117.161 },
  { name: 'Phoenix', state: 'AZ', lat: 33.448, lng: -112.074 },
  { name: 'Miami', state: 'FL', lat: 25.762, lng: -80.192 },
  { name: 'Jacksonville', state: 'FL', lat: 30.332, lng: -81.656 },
  { name: 'Orlando', state: 'FL', lat: 28.538, lng: -81.379 },
  { name: 'Tampa', state: 'FL', lat: 27.951, lng: -82.457 },
  { name: 'Charlotte', state: 'NC', lat: 35.227, lng: -80.843 },
  { name: 'Raleigh', state: 'NC', lat: 35.78, lng: -78.639 },
  { name: 'Seattle', state: 'WA', lat: 47.606, lng: -122.332 },
  { name: 'Portland', state: 'OR', lat: 45.515, lng: -122.679 },
  { name: 'Denver', state: 'CO', lat: 39.739, lng: -104.99 },
  { name: 'Kansas City', state: 'MO', lat: 39.1, lng: -94.579 },
  { name: 'St. Louis', state: 'MO', lat: 38.627, lng: -90.199 },
  { name: 'Detroit', state: 'MI', lat: 42.331, lng: -83.046 },
  { name: 'Indianapolis', state: 'IN', lat: 39.768, lng: -86.158 },
  { name: 'Columbus', state: 'OH', lat: 39.961, lng: -82.999 },
  { name: 'Cincinnati', state: 'OH', lat: 39.103, lng: -84.512 },
  { name: 'Louisville', state: 'KY', lat: 38.253, lng: -85.759 },
  { name: 'New Orleans', state: 'LA', lat: 29.951, lng: -90.072 },
  { name: 'Birmingham', state: 'AL', lat: 33.521, lng: -86.802 },
  { name: 'Little Rock', state: 'AR', lat: 34.746, lng: -92.29 },
  { name: 'Oklahoma City', state: 'OK', lat: 35.468, lng: -97.516 },
  { name: 'Salt Lake City', state: 'UT', lat: 40.761, lng: -111.891 },
  { name: 'Las Vegas', state: 'NV', lat: 36.17, lng: -115.14 },
  { name: 'Minneapolis', state: 'MN', lat: 44.978, lng: -93.265 },
  { name: 'Omaha', state: 'NE', lat: 41.257, lng: -95.935 },
  { name: 'Newark', state: 'NJ', lat: 40.736, lng: -74.172 },
  { name: 'Philadelphia', state: 'PA', lat: 39.953, lng: -75.165 },
  { name: 'Pittsburgh', state: 'PA', lat: 40.441, lng: -79.996 },
  { name: 'Richmond', state: 'VA', lat: 37.541, lng: -77.436 },
  { name: 'Milwaukee', state: 'WI', lat: 43.039, lng: -87.906 },
];

export const STATE_NAMES: Record<string, string> = {
  alabama: 'AL',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

export const STATE_CODES = new Set(Object.values(STATE_NAMES));

export function findCity(name: unknown, state?: unknown): City | undefined {
  const n = String(name ?? '').toLowerCase();
  const s = state == null ? null : String(state).toUpperCase();
  return CITIES.find((c) => c.name.toLowerCase() === n && (!s || c.state === s));
}

/** Road miles between two cities (great-circle distance × a typical 1.18 routing factor). */
export function roadMiles(a: City, b: City): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(3959 * 2 * Math.asin(Math.sqrt(h)) * 1.18);
}
