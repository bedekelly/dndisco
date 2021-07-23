import { useState } from "react";
import { Subject } from "rxjs";

export default function useSubject<T>() {
  const [subject] = useState(() => new Subject<T>());
  return subject;
}
