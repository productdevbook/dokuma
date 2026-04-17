import { createDisclosure, type Disclosure, type DisclosureOptions } from "./disclosure.ts"

export type CollapsibleOptions = DisclosureOptions
export type Collapsible = Disclosure

/**
 * A two-state expand/collapse region — Disclosure under a different name. Use
 * Disclosure when the trigger is a discrete control that owns the panel; use
 * Collapsible when the renamed Radix-style vocabulary fits your design system
 * better. Behavior, ARIA, and prop shape are identical.
 */
export function createCollapsible(options: CollapsibleOptions = {}): Collapsible {
  return createDisclosure(options)
}
