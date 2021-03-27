import { useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";

type Callback = (event: any) => void;
type Listeners = {
  [id: string]: Callback;
};

export default function useSubject() {
  const listeners = useRef<Listeners>({});

  const subscribe = useCallback((callback: Callback) => {
    const id = uuid();
    listeners.current[id] = callback;
    return id;
  }, []);

  const send = useCallback((value) => {
    for (let listener of Object.values(listeners.current)) {
      listener(value);
    }
  }, []);

  const unsubscribe = useCallback((id: string) => {
    delete listeners.current[id];
  }, []);

  return { subscribe, unsubscribe, send };
}
