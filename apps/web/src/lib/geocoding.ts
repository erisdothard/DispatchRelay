// Simple in-memory cache to avoid redundant Nominatim requests
const cache = new Map<string, [number, number] | null>();

export async function geocodeCity(city: string, state: string): Promise<[number, number] | null> {
  const key = `${city},${state}`.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const q = encodeURIComponent(`${city}, ${state}, USA`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'FreightX/1.0' } },
    );
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      cache.set(key, coords);
      return coords;
    }
  } catch {
    // network error — don't cache, allow retry
    return null;
  }

  cache.set(key, null);
  return null;
}
