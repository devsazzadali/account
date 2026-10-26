/** Safe localStorage accessors.
 *  NEVER detach Storage methods (e.g. `const f = localStorage.getItem; f(k)`)
 *  or select them via a ternary and call the result — Storage methods require
 *  their receiver and throw "TypeError: Illegal invocation" when detached.
 *  Always call them as methods on window.localStorage, as done here. */
export function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / blocked) */
  }
}

export function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function lsClear(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
}
