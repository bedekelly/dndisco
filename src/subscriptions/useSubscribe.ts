import { useEffect } from "react";
import { Observable } from "rxjs";

export default function useSubscribe<T>(
  producer$: Observable<T>,
  callback: (message: T) => void
) {
  useEffect(() => {
    const subscription = producer$.subscribe(callback);
    return () => {
      subscription.unsubscribe();
    };
  });
}
