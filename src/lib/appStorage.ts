export interface FromToLocationData {
  name: string;
  phone: string;
  address: string;
  udpin: string;
  lat: number;
  lng: number;
}

const FROM_ADDRESS_STORAGE_KEY = 'fromAddressData';
const TO_ADDRESS_STORAGE_KEY = 'toAddressData';

/**
 * Saves the 'From Address' data to localStorage.
 */
export function saveFromAddressData(data: FromToLocationData): void {
  try {
    localStorage.setItem(FROM_ADDRESS_STORAGE_KEY, JSON.stringify(data));
    console.log('From Address data saved successfully.');
  } catch (error) {
    console.error('Error saving From Address data:', error);
  }
}

/**
 * Loads the 'From Address' data from localStorage.
 */
export function loadFromAddressData(): FromToLocationData | null {
  try {
    const savedData = localStorage.getItem(FROM_ADDRESS_STORAGE_KEY);
    return savedData ? (JSON.parse(savedData) as FromToLocationData) : null;
  } catch (error) {
    console.error('Error loading From Address data:', error);
    return null;
  }
}

/**
 * Saves the 'To Address' data to localStorage.
 */
export function saveToAddressData(data: FromToLocationData): void {
  try {
    localStorage.setItem(TO_ADDRESS_STORAGE_KEY, JSON.stringify(data));
    console.log('To Address data saved successfully.');
  } catch (error) {
    console.error('Error saving To Address data:', error);
  }
}

/**
 * Loads the 'To Address' data from localStorage.
 */
export function loadToAddressData(): FromToLocationData | null {
  try {
    const savedData = localStorage.getItem(TO_ADDRESS_STORAGE_KEY);
    return savedData ? (JSON.parse(savedData) as FromToLocationData) : null;
  } catch (error) {
    console.error('Error loading To Address data:', error);
    return null;
  }
}