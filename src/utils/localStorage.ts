/**
 * Component-level localStorage utilities
 * For simple get/set operations in components
 */

export const getFromStorage = <T = any>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error reading "${key}" from localStorage:`, error);
    return defaultValue;
  }
};

export const setInStorage = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing "${key}" to localStorage:`, error);
    return false;
  }
};

export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing "${key}" from localStorage:`, error);
    return false;
  }
};

