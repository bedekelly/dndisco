import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

export default function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(defaultValue);

  /**
   * Load any previous values.
   */
  useEffect(() => {
    let sessionStorageItem = sessionStorage.getItem(key);
    if (sessionStorageItem == null) return;
    const loadedValue = JSON.parse(sessionStorageItem) as T;
    if (loadedValue !== null) setValue(loadedValue);
  }, [key]);

  /**
   * Save every new value.
   */
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  /**
   * Clear this key from localstorage.
   */
  const clearValue = useCallback(() => {
    sessionStorage.removeItem(key);
  }, [key]);

  return [value, setValue, clearValue];
}
