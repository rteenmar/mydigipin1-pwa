export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  udpin: string;
  timestamp: number;
}

export interface AppState {
  name: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  address: string;
  myLocation: string;
  udpin: string;
  isGeoLocationLoading: boolean;
  isGeoLocationError: boolean;
  isCopyFromGeoLocation: boolean;
  savedLocations: SavedLocation[];
  isMapReady: boolean;
  mapKey: number;
  isGeolocating: boolean;
  isSearching: boolean;
  showSavedLocations: boolean;
}
