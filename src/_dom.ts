export function isBrowser(): boolean {
  return typeof document !== "undefined" && typeof window !== "undefined"
}

export type Cleanup = () => void

export function on<K extends keyof HTMLElementEventMap>(
  el: EventTarget,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
): Cleanup
export function on(
  el: EventTarget,
  type: string,
  handler: EventListener,
  options?: AddEventListenerOptions | boolean,
): Cleanup
export function on(
  el: EventTarget,
  type: string,
  handler: EventListener,
  options?: AddEventListenerOptions | boolean,
): Cleanup {
  el.addEventListener(type, handler, options)
  return () => el.removeEventListener(type, handler, options)
}

export function noop(): void {}
