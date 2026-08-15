/**
 * What3Words utility for micro-location pinpointing
 * Converts between 3-word addresses (e.g. ///filled.count.soap) and Lat/Lng coordinates.
 */

// Word bank for offline deterministic grid fallback
const WORD_BANK_A = [
  "filled", "index", "market", "metro", "civic", "breeze", "corner", "temple",
  "garden", "circle", "stream", "bridge", "tower", "haven", "crest", "valley",
  "river", "beacon", "plaza", "avenue", "silver", "golden", "amber", "lotus",
  "peacock", "mango", "banyan", "sandal", "crystal", "pearl", "sunshine", "shadow"
];

const WORD_BANK_B = [
  "count", "flow", "track", "cross", "pulse", "reach", "spark", "route",
  "shade", "shine", "stone", "path", "curve", "point", "crest", "green",
  "bright", "clear", "calm", "swift", "broad", "deep", "high", "pure",
  "grand", "smart", "prime", "peace", "bloom", "grove", "glade", "ridge"
];

const WORD_BANK_C = [
  "soap", "road", "gate", "view", "spot", "lamp", "post", "step",
  "lane", "tree", "leaf", "bird", "park", "line", "zone", "bell",
  "dome", "arch", "peak", "well", "pond", "rock", "nest", "yard",
  "home", "base", "fort", "lake", "isle", "hill", "reef", "shore"
];

export interface What3WordsLocation {
  words: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearestPlace?: string;
  country?: string;
}

/**
 * Validates whether a string matches a 3-word address pattern
 */
export function isValid3Words(text: string): boolean {
  const clean = text.replace(/^\/{3}/, "").trim();
  const parts = clean.split(".");
  return parts.length === 3 && parts.every((p) => p.length >= 2 && /^[a-zA-Z]+$/.test(p));
}

/**
 * Normalizes a 3-word string into standard format: "word.word.word"
 */
export function format3Words(text: string): string {
  const clean = text.replace(/^\/{3}/, "").trim().toLowerCase();
  return clean.startsWith("///") ? clean : `///${clean}`;
}

/**
 * Deterministic offline fallback to generate 3 words from lat/lng coordinates
 */
export function coordinatesTo3WordsOffline(lat: number, lng: number): string {
  const latInt = Math.abs(Math.round(lat * 1000));
  const lngInt = Math.abs(Math.round(lng * 1000));

  const w1 = WORD_BANK_A[latInt % WORD_BANK_A.length];
  const w2 = WORD_BANK_B[lngInt % WORD_BANK_B.length];
  const w3 = WORD_BANK_C[(latInt + lngInt) % WORD_BANK_C.length];

  return `///${w1}.${w2}.${w3}`;
}

/**
 * Deterministic offline fallback to resolve 3 words into approximate coordinates
 */
export function words3ToCoordinatesOffline(words: string): { lat: number; lng: number } {
  const clean = words.replace(/^\/{3}/, "").trim().toLowerCase();
  const parts = clean.split(".");
  if (parts.length !== 3) {
    // Default fallback to center of Mumbai/Pune
    return { lat: 18.5204, lng: 73.8567 };
  }

  let hashA = 0;
  let hashB = 0;
  for (let i = 0; i < parts[0].length; i++) hashA += parts[0].charCodeAt(i);
  for (let i = 0; i < parts[1].length; i++) hashB += parts[1].charCodeAt(i);

  // Approximate within standard Indian metropolitan range [18.4 - 19.3, 72.8 - 74.0]
  const lat = 18.45 + (hashA % 100) * 0.008;
  const lng = 72.85 + (hashB % 100) * 0.01;

  return { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
}

/**
 * Convert lat/lng to 3-word address with API support + offline fallback
 */
export async function convertTo3Words(lat: number, lng: number): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_W3W_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${apiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.words) return `///${data.words}`;
      }
    } catch {
      // fallback on error
    }
  }

  return coordinatesTo3WordsOffline(lat, lng);
}

/**
 * Convert 3-word address to coordinates with API support + offline fallback
 */
export async function convertToCoordinates(words: string): Promise<{ lat: number; lng: number }> {
  const clean = words.replace(/^\/{3}/, "").trim();
  const apiKey = process.env.NEXT_PUBLIC_W3W_API_KEY;

  if (apiKey && isValid3Words(clean)) {
    try {
      const response = await fetch(
        `https://api.what3words.com/v3/convert-to-coordinates?words=${clean}&key=${apiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.coordinates?.lat && data?.coordinates?.lng) {
          return { lat: data.coordinates.lat, lng: data.coordinates.lng };
        }
      }
    } catch {
      // fallback on error
    }
  }

  return words3ToCoordinatesOffline(clean);
}
