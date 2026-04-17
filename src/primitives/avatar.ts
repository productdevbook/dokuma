import { isBrowser, on } from "../_dom.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type AvatarStatus = "idle" | "loading" | "loaded" | "error"

export interface AvatarOptions {
  /** Image URL. When omitted, status stays `"idle"` and only the fallback is shown. */
  src?: string
  /** Optional crossOrigin attribute for the underlying preload. */
  crossOrigin?: "anonymous" | "use-credentials" | ""
  /** Optional referrerpolicy for the underlying preload. */
  referrerPolicy?: ReferrerPolicy
  /** Called whenever status changes. */
  onStatusChange?: (status: AvatarStatus) => void
}

export interface AvatarImageProps {
  /** Spread on an <img>. Includes `src`, `crossOrigin`, `referrerPolicy`. */
  src?: string
  alt?: string
  crossOrigin?: "anonymous" | "use-credentials" | ""
  referrerPolicy?: ReferrerPolicy
  "data-status": AvatarStatus
  /** When false the consumer should not render the <img>. */
  hidden: boolean
}

export interface AvatarFallbackProps {
  "data-status": AvatarStatus
  /** When false the consumer should not render the fallback. */
  hidden: boolean
}

export interface Avatar {
  status: Signal<AvatarStatus>
  getImageProps: (alt?: string) => AvatarImageProps
  getFallbackProps: () => AvatarFallbackProps
  /** Imperatively wire image preload + fallback toggling. Returns cleanup. */
  mount: (els: { image: HTMLImageElement; fallback?: HTMLElement }) => Unsubscribe
  notify: () => void
}

export function createAvatar(options: AvatarOptions = {}): Avatar {
  const initial: AvatarStatus = options.src ? "loading" : "idle"
  const internal = createSignal<AvatarStatus>(initial)
  const subscribers = new Set<(s: AvatarStatus) => void>()

  const status: Signal<AvatarStatus> = {
    get: internal.get,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: AvatarStatus) => AvatarStatus)(internal.get())
          : next
      if (resolved === internal.get()) return
      internal.set(resolved)
      options.onStatusChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  // Eager preload (browser only) — this is what makes the fallback show
  // while the image is fetching, then swap once it lands.
  if (isBrowser() && options.src) {
    const img = new Image()
    if (options.crossOrigin !== undefined) img.crossOrigin = options.crossOrigin || null
    if (options.referrerPolicy !== undefined) img.referrerPolicy = options.referrerPolicy
    img.onload = (): void => status.set("loaded")
    img.onerror = (): void => status.set("error")
    img.src = options.src
  }

  const notify = (): void => {
    const v = internal.get()
    for (const fn of subscribers) fn(v)
  }

  const getImageProps = (alt = ""): AvatarImageProps => {
    const s = internal.get()
    return {
      src: options.src,
      alt,
      crossOrigin: options.crossOrigin,
      referrerPolicy: options.referrerPolicy,
      "data-status": s,
      hidden: s !== "loaded",
    }
  }

  const getFallbackProps = (): AvatarFallbackProps => {
    const s = internal.get()
    return {
      "data-status": s,
      hidden: s === "loaded",
    }
  }

  const mount = (els: { image: HTMLImageElement; fallback?: HTMLElement }): Unsubscribe => {
    const { image, fallback } = els
    const apply = (): void => {
      const s = internal.get()
      if (options.src) image.src = options.src
      image.setAttribute("data-status", s)
      if (s === "loaded") image.removeAttribute("hidden")
      else image.setAttribute("hidden", "")
      if (fallback) {
        fallback.setAttribute("data-status", s)
        if (s === "loaded") fallback.setAttribute("hidden", "")
        else fallback.removeAttribute("hidden")
      }
    }
    apply()
    const offLoad = on(image, "load", () => status.set("loaded"))
    const offError = on(image, "error", () => status.set("error"))
    const unsub = status.subscribe(apply)
    return () => {
      offLoad()
      offError()
      unsub()
    }
  }

  return {
    status,
    getImageProps,
    getFallbackProps,
    mount,
    notify,
  }
}
