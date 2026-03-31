// Simple in-memory cache to avoid redundant Nominatim requests
const cache = new Map<string, [number, number] | null>();

async function nominatimQuery(query: string, cacheKey: string): Promise<[number, number] | null> {
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'FreightX/1.0' } },
    );
    if (!res.ok) {
      cache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      cache.set(cacheKey, coords);
      return coords;
    }
  } catch {
    // network error — don't cache, allow retry
    return null;
  }

  cache.set(cacheKey, null);
  return null;
}

export async function geocodeCity(city: string, state: string): Promise<[number, number] | null> {
  const key = `${city},${state}`.toLowerCase().trim();
  return nominatimQuery(`${city}, ${state}, USA`, key);
}

/** Geocode a full street address; falls back to city-level if address query returns nothing. */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
): Promise<[number, number] | null> {
  const key = `${address},${city},${state}`.toLowerCase().trim();
  const result = await nominatimQuery(`${address}, ${city}, ${state}, USA`, key);
  if (result) return result;
  // Fallback to city-level
  return geocodeCity(city, state);
}
