'use client';

import { useState, useEffect } from 'react';

/**
 * SSR-safe localStorage hook that avoids hydration mismatches.
 * Always starts with initialValue on both server and client,
 * then syncs with localStorage in useEffect after hydration.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Always use initialValue first to avoid hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with localStorage after hydration
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Persist to localStorage
  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * SSR-safe localStorage hook for string values.
 * Avoids hydration mismatches by syncing after mount.
 */
export function useLocalStorageString(key: string, initialValue: string): [string, (value: string) => void] {
  // Always use initialValue first to avoid hydration mismatch
  const [storedValue, setStoredValue] = useState<string>(initialValue);

  // Sync with localStorage after hydration
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(item);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Persist to localStorage
  const setValue = (value: string) => {
    try {
      setStoredValue(value);
      if (value) {
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
