/**
 * DIGIPIN (UDPIN) Generation and Decoding Utility
 * 
 * Implements the DIGIPIN algorithm with support for both:
 * - 10-character format for India (XXX-XXX-XXXX)
 * - 12-character format for global coordinates (XXXX-XXXX-XXXX)
 */

// DIGIPIN Labelling Grid as per official specification
// Rows represent latitude divisions (0 = north, 3 = south)
// Columns represent longitude divisions (0 = west, 3 = east)
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'], // Northmost row
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']  // Southmost row
];

// Bounding Box for India (for 10-character DIGIPIN)
const INDIA_BOUNDS = {
  minLat: 2.5,
  maxLat: 38.5,
  minLon: 63.5,
  maxLon: 99.5
};

// Global bounds for 12-character DIGIPIN
const GLOBAL_BOUNDS = {
  minLat: -90,
  maxLat: 90,
  minLon: -180,
  maxLon: 180
};

/**
 * Checks if coordinates are within India's bounds
 */
function isInIndia(lat: number, lon: number): boolean {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
}

/**
 * Generates a DIGIPIN from latitude and longitude coordinates
 * Implements the official DIGIPIN algorithm
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @returns 10 or 12-character DIGIPIN string (formatted as XXX-XXX-XXXX or XXXX-XXXX-XXXX)
 */
export function generateUDPIN(lat: number, lng: number): string {
  const isIndia = isInIndia(lat, lng);
  const bounds = isIndia ? INDIA_BOUNDS : GLOBAL_BOUNDS;
  const digits = isIndia ? 10 : 12;
  
  // Initialize bounds for the first level
  let minLat = bounds.minLat;
  let maxLat = bounds.maxLat;
  let minLng = bounds.minLon;
  let maxLng = bounds.maxLon;
  
  let udpin = '';
  
  // For each digit in the DIGIPIN
  for (let level = 1; level <= digits; level++) {
    // Calculate the size of each division at this level
    const latDiv = (maxLat - minLat) / 4;
    const lngDiv = (maxLng - minLng) / 4;
    
    // Find the row (latitude division) - 0 = north, 3 = south
    let row = 0;
    for (let i = 0; i < 4; i++) {
      const latBoundary = maxLat - (i * latDiv);
      if (lat >= (latBoundary - latDiv)) {
        row = i;
        break;
      }
    }
    
    // Find the column (longitude division) - 0 = west, 3 = east
    let col = 0;
    for (let i = 0; i < 4; i++) {
      const lngBoundary = minLng + ((i + 1) * lngDiv);
      if (lng < lngBoundary) {
        col = i;
        break;
      }
    }
    
    // Add the character to the DIGIPIN from the grid
    udpin += DIGIPIN_GRID[row][col];
    
    // Update bounds for the next level
    minLat = maxLat - ((row + 1) * latDiv);
    maxLat = maxLat - (row * latDiv);
    minLng = minLng + (col * lngDiv);
    maxLng = minLng + lngDiv;
    
    // Add hyphens for better readability
    if (isIndia) {
      if (level === 3 || level === 6) udpin += '-';
    } else {
      if (level === 4 || level === 8) udpin += '-';
    }
  }
  
  return udpin;
}

/**
 * Test function to verify DIGIPIN generation
 */
function testDIGIPIN() {
  console.log('=== DIGIPIN Test Cases ===');
  
  // Test case 1: Known location in India (Dak Bhawan)
  const lat1 = 28.622788;
  const lng1 = 77.213033;
  const expected1 = '39J-49L-L8T4';
  const result1 = generateUDPIN(lat1, lng1);
  console.log(`Test 1 (Dak Bhawan):`);
  console.log(`  Expected: ${expected1}`);
  console.log(`  Got:      ${result1}`);
  console.log(`  Match:    ${expected1 === result1}`);
  
  // Test case 2: Global coordinates
  const lat2 = 17.362231;
  const lng2 = 78.523231;
  const expected2 = '3F26-C49J-2MP4';
  const result2 = generateUDPIN(lat2, lng2);
  console.log(`\nTest 2 (Global):`);
  console.log(`  Expected: ${expected2}`);
  console.log(`  Got:      ${result2}`);
  console.log(`  Match:    ${expected2 === result2}`);
  
  // Test case 3: India coordinates (10-digit)
  const lat3 = 17.362230;
  const lng3 = 78.523235;
  const expected3 = '422-573-CF86';
  const result3 = generateUDPIN(lat3, lng3);
  console.log(`\nTest 3 (India):`);
  console.log(`  Expected: ${expected3}`);
  console.log(`  Got:      ${result3}`);
  console.log(`  Match:    ${expected3 === result3}`);
  
  // Test case 4: Edge case - Southernmost India
  const lat4 = 2.5;
  const lng4 = 63.5;
  const expected4 = 'FCC-CCC-CCCC';
  const result4 = generateUDPIN(lat4, lng4);
  console.log(`\nTest 4 (South-West Corner):`);
  console.log(`  Expected: ${expected4}`);
  console.log(`  Got:      ${result4}`);
  console.log(`  Match:    ${expected4 === result4}`);
  
  // Test case 5: Edge case - Northernmost India
  const lat5 = 38.5;
  const lng5 = 99.5;
  const expected5 = 'TLT-TTT-TTTT';
  const result5 = generateUDPIN(lat5, lng5);
  console.log(`\nTest 5 (North-East Corner):`);
  console.log(`  Expected: ${expected5}`);
  console.log(`  Got:      ${result5}`);
  console.log(`  Match:    ${expected5 === result5}`);
}

// Run tests when the module is loaded
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.addEventListener('load', testDIGIPIN);
}

/**
 * Decodes a DIGIPIN back to latitude and longitude coordinates
 * @param udpin - The DIGIPIN to decode (with or without hyphens)
 * @returns Object containing latitude and longitude
 */
export function decodeUDPIN(udpin: string): {lat: number; lng: number} {
  // Clean the DIGIPIN (remove hyphens and convert to uppercase)
  const cleanUDPIN = udpin.replace(/-/g, '').toUpperCase();
  
  if (!isValidUDPIN(cleanUDPIN)) {
    throw new Error('Invalid DIGIPIN format');
  }
  
  // Determine if this is a 10-digit (India) or 12-digit (global) DIGIPIN
  const isIndia = cleanUDPIN.length === 10;
  const bounds = isIndia ? INDIA_BOUNDS : GLOBAL_BOUNDS;
  
  let minLat = bounds.minLat;
  let maxLat = bounds.maxLat;
  let minLon = bounds.minLon;
  let maxLon = bounds.maxLon;
  
  // Process each character in the DIGIPIN
  for (let i = 0; i < cleanUDPIN.length; i++) {
    const char = cleanUDPIN[i];
    
    // Find the character in the grid
    let found = false;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (DIGIPIN_GRID[row][col] === char) {
          // Calculate new boundaries
          const latStep = (maxLat - minLat) / 4;
          const lonStep = (maxLon - minLon) / 4;
          
          minLat += latStep * row;
          maxLat = minLat + latStep;
          minLon += lonStep * col;
          maxLon = minLon + lonStep;
          
          found = true;
          break;
        }
      }
      if (found) break;
    }
    
    if (!found) {
      throw new Error(`Invalid character in DIGIPIN: ${char}`);
    }
  }
  
  // Return the center of the final cell
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLon + maxLon) / 2
  };
}

/**
 * Validates if a string is a valid DIGIPIN
 * @param udpin - The DIGIPIN to validate (with or without hyphens)
 * @returns boolean indicating if the DIGIPIN is valid
 */
export function isValidUDPIN(udpin: string): boolean {
  // Remove hyphens and convert to uppercase
  const cleanUDPIN = udpin.replace(/-/g, '').toUpperCase();
  
  // Check length (10 digits for India, 12 for global)
  if (cleanUDPIN.length !== 10 && cleanUDPIN.length !== 12) {
    return false;
  }
  
  // Check all characters are valid
  const validChars = new Set(['F', 'C', '9', '8', 'J', '3', '2', '7', 'K', '4', '5', '6', 'L', 'M', 'P', 'T']);
  return [...cleanUDPIN].every(c => validChars.has(c));
}

/**
 * Formats a raw DIGIPIN (without hyphens) into the standard format
 * @param udpin - Raw DIGIPIN (with or without hyphens)
 * @returns Formatted DIGIPIN string (XXX-XXX-XXXX for India, XXXX-XXXX-XXXX for global)
 */
export function formatUDPIN(udpin: string): string {
  // Remove any existing hyphens and convert to uppercase
  const cleanUDPIN = udpin.replace(/-/g, '').toUpperCase();
  
  // Insert hyphens at the correct positions
  if (cleanUDPIN.length === 10) {
    // India format: XXX-XXX-XXXX
    return `${cleanUDPIN.slice(0, 3)}-${cleanUDPIN.slice(3, 6)}-${cleanUDPIN.slice(6)}`;
  } else if (cleanUDPIN.length === 12) {
    // Global format: XXXX-XXXX-XXXX
    return `${cleanUDPIN.slice(0, 4)}-${cleanUDPIN.slice(4, 8)}-${cleanUDPIN.slice(8)}`;
  }
  
  return cleanUDPIN; // Return as-is if not a standard length
}
