import { Dispatch, SetStateAction, useCallback, useState } from "react";

export default function useStateWithCallback<T>(
  defaultState: T | (() => T)
): readonly [T, Dispatch<SetStateAction<T>>, () => Promise<T>] {
  const [state, setState] = useState<T>(defaultState);

  const getState = useCallback(async () => {
    return new Promise<T>((resolve) => {
      setState((oldValue) => {
        resolve(oldValue);
        return oldValue;
      });
    });
  }, []);

  return [state, setState, getState] as const;
}
