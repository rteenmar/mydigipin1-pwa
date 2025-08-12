export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  udpin: string;
  timestamp: number;
}

const STORAGE_KEY = 'savedLocations';
const MAX_SAVED_LOCATIONS = 10;

/**
 * Save a new location to localStorage
 */
export function saveLocation(location: Omit<SavedLocation, 'id' | 'timestamp'>): boolean {
  const locations = getSavedLocations();
  
  // Check for duplicate location (same coordinates)
  const isDuplicate = locations.some(
    loc => loc.lat === location.lat && loc.lng === location.lng
  );
  
  if (isDuplicate) {
    console.log('Location already exists, not saving duplicate');
    return false;
  }
  
  // If we've reached the maximum number of saved locations, remove the oldest one
  if (locations.length >= MAX_SAVED_LOCATIONS) {
    // Remove the oldest item (last in the array)
    locations.pop();
  }
  
  const newLocation: SavedLocation = {
    ...location,
    id: Date.now().toString(),
    timestamp: Date.now()
  };
  
  // Add to the beginning of the array (most recent first)
  const updatedLocations = [newLocation, ...locations];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocations));
    return true;
  } catch (error) {
    console.error('Error saving location:', error);
    return false;
  }
}

/**
 * Get all saved locations from localStorage
 */
export function getSavedLocations(): SavedLocation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error getting saved locations:', error);
    return [];
  }
}

/**
 * Delete a saved location by ID
 */
export function deleteLocation(id: string): boolean {
  const locations = getSavedLocations();
  const initialLength = locations.length;
  const updatedLocations = locations.filter(loc => loc.id !== id);
  
  if (updatedLocations.length === initialLength) {
    return false; // No location was deleted
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocations));
    return true;
  } catch (error) {
    console.error('Error deleting location:', error);
    return false;
  }
}

/**
 * Clear all saved locations
 */
export function clearAllLocations(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing locations:', error);
    return false;
  }
}
