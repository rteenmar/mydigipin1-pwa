import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { generateUDPIN, decodeUDPIN, formatUDPIN } from './lib/udpin';
import { geocodeAddress, reverseGeocode } from './lib/geocoding';
import { getSavedLocations } from './lib/locationStorage';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for default marker icons in Leaflet with React
import { Icon } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Default center (India)
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

// Component to handle map click events and center updates
function MapClickHandler({ onMapClick, center }: { onMapClick: (lat: number, lng: number) => void, center: [number, number] }) {
  const map = useMap();
  
  // Update map view when center changes
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  // Handle map click events
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

// Define the AppState type
type AppState = {
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
  savedLocations: any[];
  isMapReady: boolean;
  mapKey: number;
  isGeolocating: boolean;
  isSearching: boolean;
  showSavedLocations: boolean;
};

function App() {
  // Initialize state
  const [state, setState] = useState<AppState>({
    name: '',
    phone: '',
    lat: null,
    lng: null,
    address: '',
    myLocation: '',
    udpin: '',
    isGeoLocationLoading: false,
    isGeoLocationError: false,
    isCopyFromGeoLocation: false,
    savedLocations: [],
    isMapReady: false,
    mapKey: 0,
    isGeolocating: false,
    isSearching: false,
    showSavedLocations: false
  });

  // Load saved locations on component mount
  useEffect(() => {
    const saved = getSavedLocations();
    setState(prev => ({
      ...prev,
      savedLocations: saved
    }));
  }, []);

  // Map zoom level constant
  const ZOOM_LEVEL = 5;
  
  // Default map center
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      lat,
      lng
    }));
    setMapCenter([lat, lng]);
  };

  // Handle search address
  const handleSearchAddress = async () => {
    if (!state.address.trim()) return;
    
    try {
      const coords = await geocodeAddress(state.address);
      if (coords) {
        setState(prev => ({
          ...prev,
          lat: coords.lat,
          lng: coords.lng,
          isSearching: false
        }));
      }
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  // Update from UDPIN
  const updateFromUDPIN = (udpin: string) => {
    try {
      const { lat, lng } = decodeUDPIN(udpin);
      setState(prev => ({
        ...prev,
        lat,
        lng,
        udpin: formatUDPIN(udpin)
      }));
    } catch (error) {
      console.error('Error decoding UDPIN:', error);
    }
  };

  // Save location to local storage
  const saveLocationToStorage = (location: any) => {
    const saved = getSavedLocations();
    saved.push(location);
    localStorage.setItem('savedLocations', JSON.stringify(saved));
    return saved;
  };

  // Save location
  const handleSaveLocation = () => {
    if (state.lat === null || state.lng === null) return;
    
    const newLocation = {
      id: Date.now().toString(),
      name: state.name || 'Unnamed Location',
      address: state.address,
      lat: state.lat,
      lng: state.lng,
      udpin: state.udpin,
      myLocation: state.myLocation,
      phone: state.phone,
      timestamp: new Date().toISOString()
    };
    
    saveLocationToStorage(newLocation);
    setState(prev => ({
      ...prev,
      savedLocations: [...prev.savedLocations, newLocation]
    }));
  };

  // Load location from saved locations
  const loadLocation = (location: any) => {
    setState(prev => ({
      ...prev,
      ...location,
      isCopyFromGeoLocation: false
    }));
  };

  // Delete location
  const handleDeleteLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedLocations = state.savedLocations.filter(loc => loc.id !== id);
    localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));
    setState(prev => ({
      ...prev,
      savedLocations: updatedLocations
    }));
  };

  // Open in maps
  const openInMaps = () => {
    if (state.lat === null || state.lng === null) return;
    window.open(`https://www.google.com/maps?q=${state.lat},${state.lng}`, '_blank');
  };

  // Share location
  const shareLocation = async () => {
    if (state.lat === null || state.lng === null) return;
    
    const shareData = {
      title: 'My Location',
      text: `Check out this location: ${state.address || 'My Location'}`,
      url: `https://www.google.com/maps?q=${state.lat},${state.lng}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Print location
  const printLocation = () => {
    window.print();
  };

  // Update map center and UDPIN when coordinates change
  useEffect(() => {
    if (state.lat !== null && state.lng !== null) {
      setMapCenter([state.lat, state.lng]);
      
      // Generate UDPIN when coordinates change
      try {
        const newUDPIN = generateUDPIN(state.lat, state.lng);
        setState(prev => ({
          ...prev,
          udpin: formatUDPIN(newUDPIN)
        }));
      } catch (error) {
        console.error('Error generating UDPIN:', error);
      }
    }
  }, [state.lat, state.lng]);


  
  // Memoize updateAddress to prevent infinite re-renders
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const address = await reverseGeocode(lat, lng);
      setState(prev => ({
        ...prev,
        address: address || prev.address,
        isGeoLocationLoading: false,
        isGeoLocationError: false
      }));
    } catch (error) {
      console.error('Error updating address:', error);
      setState(prev => ({
        ...prev,
        isGeoLocationLoading: false,
        isGeoLocationError: true
      }));
    }
  }, []);

  // Call updateLocation when coordinates change
  useEffect(() => {
    if (state.lat !== null && state.lng !== null) {
      updateLocation(state.lat, state.lng);
    }
  }, [state.lat, state.lng, updateLocation]);

  // Handle find my location
  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setState(prev => ({ ...prev, isGeoLocationLoading: true, isGeoLocationError: false }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Generate UDPIN from the new coordinates
          const newUDPIN = generateUDPIN(latitude, longitude);
          const formattedUDPIN = formatUDPIN(newUDPIN);

          // Get the address for the new coordinates
          const address = await reverseGeocode(latitude, longitude);

          setState(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            udpin: formattedUDPIN,
            address: address || prev.address,
            isGeoLocationLoading: false,
            isGeoLocationError: false
          }));
        } catch (error) {
          console.error('Error processing location:', error);
          setState(prev => ({
            ...prev,
            isGeoLocationLoading: false,
            isGeoLocationError: true
          }));
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setState(prev => ({
          ...prev,
          isGeoLocationLoading: false,
          isGeoLocationError: true
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Universal DIGIPIN</h1>
          <p className="text-gray-600">Generate and decode geographic location codes</p>
        </header>

        <div className="p-4 bg-white rounded-lg shadow-md">
          <button
            onClick={handleFindMyLocation}
            disabled={state.isGeoLocationLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center"
          >
            {state.isGeoLocationLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Locating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Find My Location
              </>
            )}
          </button>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
                <input
                  type="text"
                  name="name"
                  value={state.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={state.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  value={state.lat ?? ''}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value);
                    if (!isNaN(lat)) {
                      setState(prev => ({ ...prev, lat }));
                    } else if (e.target.value === '') {
                      setState(prev => ({ ...prev, lat: null }));
                    }
                  }}
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  value={state.lng ?? ''}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value);
                    if (!isNaN(lng)) {
                      setState(prev => ({ ...prev, lng }));
                    } else if (e.target.value === '') {
                      setState(prev => ({ ...prev, lng: null }));
                    }
                  }}
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geo Location</label>
              <div className="flex">
                <input
                  type="text"
                  value={state.address}
                  onChange={(e) => setState(prev => ({ ...prev, address: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter an address"
                />
                <button
                  onClick={handleSearchAddress}
                  disabled={!state.address.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md shadow-sm disabled:bg-gray-400"
                >
                  Search
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">My Location</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="copyFromGeoLocation"
                      checked={state.isCopyFromGeoLocation}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        isCopyFromGeoLocation: e.target.checked,
                        // If enabling copy from geo, update the field
                        ...(e.target.checked && { myLocation: prev.address })
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="copyFromGeoLocation" className="ml-1 text-xs text-gray-600">
                      Auto-fill from Address
                    </label>
                  </div>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="myLocation"
                    value={state.myLocation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="e.g., Flat 101, Green Villa, Sector 15"
                  />
                  {state.isCopyFromGeoLocation && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs bg-blue-50 px-2 py-0.5 rounded">Editable</span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {state.isCopyFromGeoLocation 
                    ? 'Auto-filled from address. You can still edit this field.'
                    : 'Enter a custom location name (e.g., Home, Work, Flat 101)'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UDPIN</label>
              <input
                type="text"
                value={state.udpin}
                onChange={(e) => {
                  const formatted = formatUDPIN(e.target.value);
                  setState(prev => ({
                    ...prev,
                    udpin: formatted
                  }));
                }}
                onBlur={(e) => updateFromUDPIN(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="e.g., 39J-49L-L8T4"
              />
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="mt-4 md:mt-0 md:w-1/2 rounded-lg overflow-hidden border border-gray-200 bg-gray-100" style={{ position: 'relative', height: '400px' }}>
            {typeof window !== 'undefined' && (
              <MapContainer
                center={mapCenter}
                zoom={state.lat !== null && state.lng !== null ? 15 : ZOOM_LEVEL}
                style={{ height: '100%', width: '100%', position: 'relative' }}
                zoomControl={true}
                whenReady={() => {
                  // Force update the map size when it's ready
                  setTimeout(() => {
                    const mapElement = document.querySelector('.leaflet-container') as HTMLElement & { _leaflet_map?: any };
                    if (mapElement && mapElement._leaflet_map) {
                      mapElement._leaflet_map.invalidateSize();
                    }
                  }, 100);
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {state.lat !== null && state.lng !== null && (
                  <Marker position={[state.lat, state.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{state.myLocation || 'My Location'}</div>
                        <div>{state.address}</div>
                        <div className="text-xs text-gray-500">{state.lat.toFixed(6)}, {state.lng.toFixed(6)}</div>
                        <div className="font-mono mt-1">{state.udpin}</div>
                      </div>
                    </Popup>
                  </Marker>
                )}
                <MapClickHandler onMapClick={handleMapClick} center={mapCenter} />
              </MapContainer>
            )}
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <div className="relative">
                <button 
                  className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm flex items-center"
                  onClick={() => setState(prev => ({ ...prev, showSavedLocations: !prev.showSavedLocations }))}
                >
                  <span>Saved Locations ({state.savedLocations.length})</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {state.showSavedLocations && state.savedLocations.length > 0 && (
                  <div className="absolute left-0 mt-1 w-72 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="max-h-96 overflow-y-auto">
                      <ul className="divide-y divide-gray-100">
                        {state.savedLocations.map((loc) => (
                          <li
                            key={loc.id}
                            className="px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer pr-3"
                                onClick={() => {
                                  loadLocation(loc);
                                  setState(prev => ({ ...prev, showSavedLocations: false }));
                                }}
                              >
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {loc.name || 'Unnamed Location'}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {loc.address}
                                </p>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <button
                                  type="button"
                                  className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLocation(loc.id, e);
                                  }}
                                  title="Delete location"
                                >
                                  <span className="text-sm font-bold">×</span>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              type="button"
              onClick={handleSaveLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>

            <button
              onClick={openInMaps}
              disabled={state.lat === null || state.lng === null}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-sm disabled:bg-gray-400 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Maps
            </button>

            <button
              onClick={shareLocation}
              disabled={state.lat === null || state.lng === null}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow-sm disabled:bg-gray-400 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>

            <button
              onClick={printLocation}
              disabled={state.lat === null || state.lng === null}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow-sm disabled:bg-gray-400 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
