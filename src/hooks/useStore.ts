// empty file
import { useRef, useSyncExternalStore } from "react";
import { store } from "@/services/store";

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
    }
    return true;
  }
  return false;
}

export function useStoreSnapshot<T>(selector: (s: typeof store) => T): T {
  const cache = useRef<{ value: T; set: boolean }>({ value: undefined as unknown as T, set: false });
  const getSnapshot = () => {
    const next = selector(store);
    if (!cache.current.set || !shallowEqual(cache.current.value, next)) {
      cache.current = { value: next, set: true };
    }
    return cache.current.value;
  };
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    getSnapshot,
    getSnapshot,
  );
}
