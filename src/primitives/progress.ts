import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type ProgressState = "indeterminate" | "loading" | "complete"

export interface ProgressOptions {
  /** Numeric value 0..max, or `null` for indeterminate. */
  defaultValue?: number | null
  value?: () => number | null
  /** Default 100. */
  max?: number
  /** Default `(v, max) => Math.round((v / max) * 100) + "%"`. */
  getValueLabel?: (value: number, max: number) => string
  onValueChange?: (value: number | null) => void
}

export interface ProgressRootProps {
  role: "progressbar"
  "aria-valuemin": 0
  "aria-valuemax": number
  "aria-valuenow"?: number
  "aria-valuetext"?: string
  "data-state": ProgressState
  "data-value"?: number
  "data-max": number
}

export interface ProgressIndicatorProps {
  "data-state": ProgressState
  "data-value"?: number
  "data-max": number
  /** Style helper: width:`<percent>%` for horizontal bars; consumer applies. */
  style?: { width: string }
}

export interface Progress {
  value: Signal<number | null>
  max: number
  getRootProps: () => ProgressRootProps
  getIndicatorProps: () => ProgressIndicatorProps
  /** Returns a number 0..1, or null when indeterminate. */
  fraction: () => number | null
  /** Imperative DOM wiring. Returns cleanup. */
  mount: (els: { root: HTMLElement; indicator?: HTMLElement }) => Unsubscribe
  notify: () => void
}

const defaultLabel = (v: number, m: number): string => `${Math.round((v / m) * 100)}%`

export function createProgress(options: ProgressOptions = {}): Progress {
  const max = options.max ?? 100
  const getLabel = options.getValueLabel ?? defaultLabel
  const isControlled = typeof options.value === "function"

  const internal = createSignal<number | null>(options.defaultValue ?? null)
  const subscribers = new Set<(v: number | null) => void>()

  const readValue = (): number | null =>
    isControlled ? (options.value as () => number | null)() : internal.get()

  const value: Signal<number | null> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: number | null) => number | null)(readValue())
          : next
      if (resolved === readValue()) return
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const notify = (): void => {
    const v = readValue()
    for (const fn of subscribers) fn(v)
  }

  const stateFor = (v: number | null): ProgressState => {
    if (v === null) return "indeterminate"
    if (v >= max) return "complete"
    return "loading"
  }

  const fraction = (): number | null => {
    const v = readValue()
    if (v === null) return null
    return Math.max(0, Math.min(1, v / max))
  }

  const getRootProps = (): ProgressRootProps => {
    const v = readValue()
    const state = stateFor(v)
    const props: ProgressRootProps = {
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": max,
      "data-state": state,
      "data-max": max,
    }
    if (v !== null) {
      props["aria-valuenow"] = v
      props["aria-valuetext"] = getLabel(v, max)
      props["data-value"] = v
    }
    return props
  }

  const getIndicatorProps = (): ProgressIndicatorProps => {
    const v = readValue()
    const state = stateFor(v)
    const props: ProgressIndicatorProps = {
      "data-state": state,
      "data-max": max,
    }
    if (v !== null) {
      props["data-value"] = v
      props.style = { width: `${Math.round((v / max) * 100)}%` }
    }
    return props
  }

  const mount = (els: { root: HTMLElement; indicator?: HTMLElement }): Unsubscribe => {
    const { root, indicator } = els
    const apply = (): void => {
      const v = readValue()
      const state = stateFor(v)
      root.setAttribute("role", "progressbar")
      root.setAttribute("aria-valuemin", "0")
      root.setAttribute("aria-valuemax", String(max))
      root.setAttribute("data-state", state)
      root.setAttribute("data-max", String(max))
      if (v !== null) {
        root.setAttribute("aria-valuenow", String(v))
        root.setAttribute("aria-valuetext", getLabel(v, max))
        root.setAttribute("data-value", String(v))
      } else {
        root.removeAttribute("aria-valuenow")
        root.removeAttribute("aria-valuetext")
        root.removeAttribute("data-value")
      }
      if (indicator) {
        indicator.setAttribute("data-state", state)
        indicator.setAttribute("data-max", String(max))
        if (v !== null) {
          indicator.setAttribute("data-value", String(v))
          indicator.style.width = `${Math.round((v / max) * 100)}%`
        } else {
          indicator.removeAttribute("data-value")
          indicator.style.width = ""
        }
      }
    }
    apply()
    return value.subscribe(apply)
  }

  return {
    value,
    max,
    getRootProps,
    getIndicatorProps,
    fraction,
    mount,
    notify,
  }
}
