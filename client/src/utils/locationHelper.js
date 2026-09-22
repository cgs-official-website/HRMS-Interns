/**
 * locationHelper.js
 * Utility for formatting GPS coordinates, resolving location names (reverse geocoding with caching),
 * and generating map links.
 */

// In-memory cache for fast lookups
const memoryCache = new Map();

// Known Office Coordinates (can be customized per organization)
export const KNOWN_LOCATIONS = [
  { name: "HQ Office (Chennai)", lat: 13.0827, lon: 80.2707, radiusMeters: 500 },
  { name: "Technology Hub (Bengaluru)", lat: 12.9716, lon: 77.5946, radiusMeters: 500 },
  { name: "Branch Office (Coimbatore)", lat: 11.0168, lon: 76.9558, radiusMeters: 500 },
  { name: "Regional Office (Mumbai)", lat: 19.0760, lon: 72.8777, radiusMeters: 500 }
];

/**
 * Calculates distance between two coordinates in meters (Haversine formula)
 */
export function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if a point (lat/lon) is inside a polygon using ray-casting algorithm.
 * @param {Object} point - { latitude, longitude }
 * @param {Array} polygon - Array of objects { lat, lng }
 * @returns {boolean} true if point is inside polygon
 */
export function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  
  const x = point.longitude;
  const y = point.latitude;
  
  let isInside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  
  return isInside;
}

/**
 * Check if coordinate matches a known office
 */
export function matchKnownLocation(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  for (const loc of KNOWN_LOCATIONS) {
    const dist = getDistanceFromLatLonInMeters(lat, lon, loc.lat, loc.lon);
    if (dist <= loc.radiusMeters) {
      return loc.name;
    }
  }
  return null;
}

/**
 * Generate a cache key for lat/lon rounded to ~100m
 */
function getCacheKey(lat, lon) {
  return `geo_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
}

/**
 * Resolves location name using OpenStreetMap Nominatim with caching
 */

// Rate limiting queue for OSM Nominatim
const requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_DELAY_MS = 1200; // 1.2 seconds between requests to OSM
const MAX_QUEUE_SIZE = 15; // Max pending requests before falling back

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const timeSinceLast = Date.now() - lastRequestTime;
    if (timeSinceLast < MIN_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - timeSinceLast));
    }

    const item = requestQueue.shift();
    if (!item) continue;
    
    const { url, resolveTask } = item;
    lastRequestTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en"
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        resolveTask(data);
      } else if (res.status === 429) {
        // Rate limited. Add a penalty.
        lastRequestTime = Date.now() + 5000;
        resolveTask(null);
      } else {
        resolveTask(null);
      }
    } catch (err) {
      resolveTask(null);
    }
  }

  isProcessingQueue = false;
}


export async function resolveLocationName(lat, lon) {
  if (!lat || !lon) return "—";
  
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (isNaN(numLat) || isNaN(numLon)) return "—";

  // 1. Check known office match
  const known = matchKnownLocation(numLat, numLon);
  if (known) return known;

  const key = getCacheKey(numLat, numLon);
  const fallback = `${numLat.toFixed(4)}, ${numLon.toFixed(4)}`;

  // 2. Check memory cache
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // 3. Check localStorage cache
  try {
    const localVal = localStorage.getItem(key);
    if (localVal) {
      memoryCache.set(key, localVal);
      return localVal;
    }
  } catch (e) {}

  // 4. Queue the OSM Request
  if (requestQueue.length >= MAX_QUEUE_SIZE) {
    // If queue is full, return fallback WITHOUT caching, so it can be retried later
    return fallback;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${numLat}&lon=${numLon}&format=json&zoom=14&addressdetails=1`;
  
  return new Promise((resolve) => {
    requestQueue.push({
      url,
      resolveTask: (data) => {
        if (!data) {
          memoryCache.set(key, fallback); // Temporary fail cache
          return resolve(fallback);
        }

        const addr = data.address || {};
        const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || addr.road || "";
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "";
        const state = addr.state || "";

        let formattedName = "";
        if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
          formattedName = `${locality}, ${city}`;
        } else if (city && state) {
          formattedName = `${city}, ${state}`;
        } else if (data.display_name) {
          const parts = data.display_name.split(",");
          formattedName = parts.slice(0, 2).join(",").trim();
        } else {
          formattedName = fallback;
        }

        memoryCache.set(key, formattedName);
        try {
          localStorage.setItem(key, formattedName);
        } catch (e) {}

        resolve(formattedName);
      }
    });
    
    // Trigger queue processing
    processQueue();
  });
}

export function getLocationDisplayName(location) {
  if (!location) return "—";
  
  if (typeof location === "string") return location;

  if (location.locationName && location.locationName !== "Unknown Location") {
    return location.locationName;
  }

  const lat = location.latitude ?? location.lat;
  const lon = location.longitude ?? location.lng ?? location.lon;

  if (lat === undefined || lon === undefined || lat === null || lon === null) return "—";

  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (isNaN(numLat) || isNaN(numLon)) return "—";

  const known = matchKnownLocation(numLat, numLon);
  if (known) return known;

  const key = getCacheKey(numLat, numLon);
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  try {
    const localVal = localStorage.getItem(key);
    if (localVal) {
      memoryCache.set(key, localVal);
      return localVal;
    }
  } catch (e) {}

  return `${numLat.toFixed(4)}, ${numLon.toFixed(4)}`;
}

/**
 * Returns formatted GPS coordinates string with accuracy
 */
export function formatGpsCoords(location) {
  if (!location) return "—";
  const lat = location.latitude ?? location.lat;
  const lon = location.longitude ?? location.lng ?? location.lon;
  if (lat === undefined || lon === undefined || lat === null || lon === null) return "—";
  
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (isNaN(numLat) || isNaN(numLon)) return "—";

  const accStr = location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : "";
  return `${numLat.toFixed(4)}, ${numLon.toFixed(4)}${accStr}`;
}

/**
 * Generates Google Maps URL
 */
export function getGoogleMapsUrl(location) {
  if (!location) return "#";
  const lat = location.latitude ?? location.lat;
  const lon = location.longitude ?? location.lng ?? location.lon;
  if (lat === undefined || lon === undefined) return "#";
  return `https://www.google.com/maps?q=${lat},${lon}`;
}
