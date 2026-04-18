// Agnostic signal-based wrapper over the computePosition engine.
// Inspired by @floating-ui/react-dom's useFloating, but framework-free.

import { isBrowser } from "../_dom.ts"
import type { Signal } from "../_signal.ts"
import { createSignal } from "../_signal.ts"
import { autoUpdate, type AutoUpdateOptions } from "./auto-update.ts"
import { computePosition } from "./index.ts"
import type {
  DomFloatingElement,
  DomReferenceElement,
  Middleware,
  MiddlewareData,
} from "./types.ts"
import type { Placement, Strategy } from "./utils.ts"

export interface CreateFloatingOptions {
  placement?: Placement
  strategy?: Strategy
  middleware?: Array<Middleware | null | undefined | false>
  /**
   * Called when both reference and floating are set. Should invoke `update()`
   * on every layout-relevant event and return a cleanup function. Defaults to
   * `autoUpdate` when `autoUpdate` is `true`; pass a custom function for finer
   * control or omit entirely for manual updates.
   */
  whileElementsMounted?: (
    reference: DomReferenceElement,
    floating: DomFloatingElement,
    update: () => void,
  ) => () => void
  /** Shortcut: use the built-in `autoUpdate` with the given options. */
  autoUpdate?: boolean | AutoUpdateOptions
}

export interface Floating {
  /** Current x coordinate. */
  x: Signal<number>
  /** Current y coordinate. */
  y: Signal<number>
  /** Resolved placement after all middleware. */
  placement: Signal<Placement>
  /** Positioning strategy. */
  strategy: Signal<Strategy>
  /** Raw data returned by each middleware (keyed by name). */
  middlewareData: Signal<MiddlewareData>
  /** `true` once `computePosition` has resolved at least once. */
  isPositioned: Signal<boolean>
  /** Bind the reference element. Pass `null` to detach. */
  setReference: (el: DomReferenceElement | null) => void
  /** Bind the floating element. Pass `null` to detach. */
  setFloating: (el: DomFloatingElement | null) => void
  /** Recompute position on demand (no-op when elements are not mounted). */
  update: () => void
  /** Detach observers + release references. Safe to call multiple times. */
  destroy: () => void
}

export function createFloating(options: CreateFloatingOptions = {}): Floating {
  const placement = options.placement ?? "bottom"
  const strategy = options.strategy ?? "absolute"

  const x = createSignal(0)
  const y = createSignal(0)
  const placementSignal = createSignal<Placement>(placement)
  const strategySignal = createSignal<Strategy>(strategy)
  const middlewareData = createSignal<MiddlewareData>({})
  const isPositioned = createSignal(false)

  let reference: DomReferenceElement | null = null
  let floating: DomFloatingElement | null = null
  let cleanupAutoUpdate: (() => void) | null = null
  let destroyed = false

  const resolveWhileElementsMounted = (): CreateFloatingOptions["whileElementsMounted"] => {
    if (options.whileElementsMounted) return options.whileElementsMounted
    if (options.autoUpdate) {
      const autoOpts = typeof options.autoUpdate === "object" ? options.autoUpdate : undefined
      return (ref, flo, update) => autoUpdate(ref, flo, update, autoOpts)
    }
    return undefined
  }

  const update = (): void => {
    if (destroyed) return
    if (!isBrowser() || !reference || !floating) return

    void computePosition(reference, floating, {
      placement: placementSignal.get(),
      strategy: strategySignal.get(),
      middleware: options.middleware,
    }).then((result) => {
      if (destroyed) return
      x.set(result.x)
      y.set(result.y)
      placementSignal.set(result.placement)
      strategySignal.set(result.strategy)
      middlewareData.set(result.middlewareData)
      isPositioned.set(true)
    })
  }

  const attachAutoUpdate = (): void => {
    cleanupAutoUpdate?.()
    cleanupAutoUpdate = null

    if (!reference || !floating) return
    const fn = resolveWhileElementsMounted()
    if (fn) {
      cleanupAutoUpdate = fn(reference, floating, update)
    } else {
      update()
    }
  }

  const setReference = (el: DomReferenceElement | null): void => {
    reference = el
    attachAutoUpdate()
  }

  const setFloating = (el: DomFloatingElement | null): void => {
    floating = el
    attachAutoUpdate()
  }

  const destroy = (): void => {
    destroyed = true
    cleanupAutoUpdate?.()
    cleanupAutoUpdate = null
    reference = null
    floating = null
  }

  return {
    x,
    y,
    placement: placementSignal,
    strategy: strategySignal,
    middlewareData,
    isPositioned,
    setReference,
    setFloating,
    update,
    destroy,
  }
}
