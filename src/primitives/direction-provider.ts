import { createSignal, type Signal } from "../_signal.ts"

export type TextDirection = "ltr" | "rtl"

export interface DirectionProviderOptions {
  /** Initial direction. Default `"ltr"`. */
  direction?: TextDirection
}

export interface DirectionProvider {
  direction: Signal<TextDirection>
  /** Convenience reader — same as `direction.get()`. */
  get: () => TextDirection
  set: (next: TextDirection) => void
}

/**
 * Minimal direction (LTR/RTL) signal. Primitives that depend on direction
 * (slider, combobox, menu, floating) can accept a `direction` signal
 * override or read from this provider at mount time.
 *
 * Framework-free: no React context. Adapters build `<DirectionProvider>`
 * components by subscribing to `direction` and re-rendering descendants.
 */
export function createDirectionProvider(options: DirectionProviderOptions = {}): DirectionProvider {
  const direction = createSignal<TextDirection>(options.direction ?? "ltr")
  return {
    direction,
    get: () => direction.get(),
    set: (next) => direction.set(next),
  }
}
