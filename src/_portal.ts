/**
 * Portal targeting helpers. The actual rendering is adapter-specific
 * (React uses createPortal, Vue uses <Teleport>, vanilla uses
 * appendChild) — the core only resolves the destination element.
 */
import { isBrowser } from "./_dom.ts"

export type PortalTarget = HTMLElement | string | null | undefined

/**
 * Default portal mount point. `document.body` in the browser; null in
 * SSR — adapters must short-circuit when the result is null.
 */
export function getDefaultPortalTarget(): HTMLElement | null {
  if (!isBrowser()) return null
  return document.body
}

/**
 * Resolve a portal target. Accepts an element, a CSS selector string, or
 * null/undefined (which falls back to document.body). Returns null when
 * the selector doesn't match or when called outside the browser.
 */
export function resolvePortalTarget(target: PortalTarget): HTMLElement | null {
  if (!isBrowser()) return null
  if (target == null) return getDefaultPortalTarget()
  if (typeof target === "string") {
    return document.querySelector(target) as HTMLElement | null
  }
  return target
}
