/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 */

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/';
// As per Nominatim usage policy, provide a valid User-Agent
const USER_AGENT = 'MyDigiPin-App/1.0 (https://github.com/your-username/your-repo-name)'; // IMPORTANT: Replace with your actual app info and repository URL

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(address: string): Promise<{lat: number; lng: number} | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}search?format=json&q=${encodeURIComponent(address)}`,
      {
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    );
    const results = await response.json() as NominatimResult[];
    
    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get an address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    );
    const result = await response.json() as NominatimResult;
    
    if (result && result.display_name) {
      return result.display_name;
    }
    return '';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return '';
  }
}

/**
 * Format coordinates into a standard string
 */
export function formatCoordinates(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return '';
  
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
}