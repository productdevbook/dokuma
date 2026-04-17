export type Subscriber<T> = (value: T) => void
export type Unsubscribe = () => void

export interface Signal<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (fn: Subscriber<T>) => Unsubscribe
}

export function createSignal<T>(initial: T): Signal<T> {
  let value = initial
  const subs = new Set<Subscriber<T>>()

  return {
    get: () => value,
    set: (next) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next
      if (Object.is(resolved, value)) return
      value = resolved
      for (const fn of subs) fn(value)
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}
