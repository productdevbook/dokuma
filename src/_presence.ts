/**
 * Bridges a boolean `open` signal to a CSS-animation-aware lifecycle.
 *
 * Without Presence, Dialog/Popover/Tooltip/Menu remove their content from
 * the DOM the instant `open` flips to false — the user never sees an
 * exit animation. With Presence, the content stays mounted until any
 * CSS transition or animation on the element finishes (or, if the user
 * has no animation, returns to unmounted on the next microtask).
 *
 * Lifecycle:
 *
 *   open=true                → status="mounted",   isMounted=true
 *   open=false               → status="unmounting", isMounted=true
 *   transitionend / no anim  → status="unmounted",  isMounted=false
 *   open=true (re-open mid)  → status="mounted",    isMounted=true
 *
 * Adapters subscribe to `isMounted` to decide whether to render the
 * element. The element gets a `data-state="open" | "closed"` from the
 * primitive that's already there — Presence doesn't manage attributes.
 */
import { isBrowser, on } from "./_dom.ts"
import { createSignal, type Signal, type Unsubscribe } from "./_signal.ts"

export type PresenceStatus = "mounted" | "unmounting" | "unmounted"

export interface Presence {
  status: Signal<PresenceStatus>
  isMounted: Signal<boolean>
  /** Stop subscribing to the source `open` signal and any pending listeners. */
  destroy: () => void
}

const hasActiveAnimation = (el: HTMLElement): boolean => {
  const cs = getComputedStyle(el)
  if (cs.animationName !== "none" && cs.animationDuration !== "0s") return true
  const dur = cs.transitionDuration.split(",").some((d) => d.trim() !== "0s")
  return dur
}

export function createPresence(
  isOpen: Signal<boolean>,
  getElement: () => HTMLElement | null,
): Presence {
  const initial = isOpen.get()
  const status = createSignal<PresenceStatus>(initial ? "mounted" : "unmounted")
  const isMounted = createSignal<boolean>(initial)

  let cleanupAnim: Unsubscribe | null = null

  const setStatus = (next: PresenceStatus): void => {
    status.set(next)
    isMounted.set(next !== "unmounted")
  }

  const cancelAnim = (): void => {
    cleanupAnim?.()
    cleanupAnim = null
  }

  const startUnmounting = (): void => {
    cancelAnim()
    setStatus("unmounting")

    if (!isBrowser()) {
      setStatus("unmounted")
      return
    }

    // Defer to allow the consumer to apply data-state="closed" first,
    // which is what triggers the CSS transition/animation.
    queueMicrotask(() => {
      const el = getElement()
      if (!el) {
        setStatus("unmounted")
        return
      }
      // If still unmounting (not re-opened), check for an active animation.
      if (status.get() !== "unmounting") return
      if (!hasActiveAnimation(el)) {
        setStatus("unmounted")
        return
      }
      const handler = (event: Event): void => {
        if (event.target !== el) return
        cancelAnim()
        if (status.get() === "unmounting") setStatus("unmounted")
      }
      const offT = on(el, "transitionend", handler)
      const offA = on(el, "animationend", handler)
      cleanupAnim = () => {
        offT()
        offA()
      }
    })
  }

  const onOpenChange = (next: boolean): void => {
    if (next) {
      cancelAnim()
      setStatus("mounted")
    } else {
      startUnmounting()
    }
  }

  const unsub = isOpen.subscribe(onOpenChange)

  return {
    status,
    isMounted,
    destroy: () => {
      cancelAnim()
      unsub()
    },
  }
}
