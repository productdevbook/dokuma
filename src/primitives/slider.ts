import { isBrowser, on } from "../_dom.ts"
import { createId } from "../_id.ts"
import type { Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type SliderValue = number | [number, number]

export interface SliderOptions {
  defaultValue?: SliderValue
  value?: () => SliderValue
  /** Fires on every value change (drag, key, programmatic). */
  onValueChange?: (value: SliderValue) => void
  /** Fires only when the user releases (pointerup / key release / blur). For form submit. */
  onValueCommit?: (value: SliderValue) => void
  min?: number
  max?: number
  step?: number
  /** Default = step * 10. PageUp/PageDown / Shift+Arrow uses this. */
  largeStep?: number
  /**
   * Two-thumb range mode. Inferred from the array shape of defaultValue/value
   * when omitted; pass explicitly when bootstrapping from `undefined`.
   */
  range?: boolean
  orientation?: Orientation
  inverted?: boolean
  dir?: "ltr" | "rtl"
  disabled?: () => boolean
  name?: string
  /** Custom aria-valuetext per thumb. Default: `String(value)`. */
  getValueText?: (value: number, thumbIdx: number) => string
}

export interface SliderRootProps {
  role: "presentation"
  "data-orientation": Orientation
  "data-disabled"?: boolean
}

export interface SliderTrackProps {
  "data-orientation": Orientation
  "data-disabled"?: boolean
}

export interface SliderRangeProps {
  "data-orientation": Orientation
  "data-disabled"?: boolean
  /** Inline style positioning the filled portion. */
  style: Record<string, string>
}

export interface SliderThumbProps {
  role: "slider"
  id: string
  "aria-orientation"?: "vertical"
  "aria-valuemin": number
  "aria-valuemax": number
  "aria-valuenow": number
  "aria-valuetext": string
  "aria-disabled"?: boolean
  "data-disabled"?: boolean
  "data-orientation": Orientation
  tabIndex: 0 | -1
  /** Inline style positioning the thumb. */
  style: Record<string, string>
  onKeyDown: (event: { key: string; shiftKey?: boolean; preventDefault?: () => void }) => void
}

export interface SliderHiddenInputProps {
  type: "hidden"
  name: string
  value: string
}

export interface Slider {
  value: Signal<SliderValue>
  min: number
  max: number
  step: number
  largeStep: number
  orientation: Orientation
  range: boolean
  isDisabled: () => boolean
  setValue: (v: SliderValue) => void
  setThumbValue: (idx: 0 | 1, v: number) => void
  getRootProps: () => SliderRootProps
  getTrackProps: () => SliderTrackProps
  getRangeProps: () => SliderRangeProps
  getThumbProps: (thumbIdx?: 0 | 1) => SliderThumbProps
  getHiddenInputProps: () =>
    | SliderHiddenInputProps
    | [SliderHiddenInputProps, SliderHiddenInputProps]
    | null
  /**
   * Imperatively wire DOM. `thumbs` length must match the mode (1 or 2).
   * `range` element is optional (some designs use a CSS-only fill).
   */
  mount: (els: {
    root: HTMLElement
    track: HTMLElement
    range?: HTMLElement
    thumbs: HTMLElement[]
  }) => Unsubscribe
}

const isTuple = (v: SliderValue): v is [number, number] => Array.isArray(v)

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo
  if (v > hi) return hi
  return v
}

function snap(v: number, min: number, step: number): number {
  return Math.round((v - min) / step) * step + min
}

export function createSlider(options: SliderOptions = {}): Slider {
  const min = options.min ?? 0
  const max = options.max ?? 100
  const step = options.step ?? 1
  const largeStep = options.largeStep ?? step * 10
  const orientation: Orientation = options.orientation ?? "horizontal"
  const dir: "ltr" | "rtl" = options.dir ?? "ltr"
  const inverted = options.inverted ?? false
  const isControlled = typeof options.value === "function"

  const inferredRange =
    options.range ?? (options.defaultValue !== undefined ? isTuple(options.defaultValue) : false)
  const range = inferredRange

  const initial: SliderValue =
    options.defaultValue ?? (range ? ([min, max] as [number, number]) : min)

  const internal = createSignal<SliderValue>(initial)
  const subscribers = new Set<(v: SliderValue) => void>()

  const readValue = (): SliderValue =>
    isControlled ? (options.value as () => SliderValue)() : internal.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const normalize = (v: SliderValue): SliderValue => {
    const sn = (n: number): number => clamp(snap(n, min, step), min, max)
    if (range) {
      const arr = isTuple(v) ? v : ([v, v] as [number, number])
      let a = sn(arr[0])
      let b = sn(arr[1])
      if (a > b) {
        // clamp not swap: keep the previous tuple's order; drop the offender to the other.
        // Without prev context we just sort.
        ;[a, b] = [Math.min(a, b), Math.max(a, b)]
      }
      return [a, b] as [number, number]
    }
    return sn(isTuple(v) ? v[0] : v)
  }

  const value: Signal<SliderValue> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: SliderValue) => SliderValue)(readValue())
          : next
      const normalized = normalize(resolved)
      const cur = readValue()
      const same =
        isTuple(cur) && isTuple(normalized)
          ? cur[0] === normalized[0] && cur[1] === normalized[1]
          : cur === normalized
      if (same) return
      if (!isControlled) internal.set(normalized)
      options.onValueChange?.(normalized)
      for (const fn of subscribers) fn(normalized)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const setValue = (v: SliderValue): void => value.set(v)
  const setThumbValue = (idx: 0 | 1, v: number): void => {
    const cur = readValue()
    if (range) {
      const arr = isTuple(cur) ? [...cur] : ([cur, cur] as [number, number])
      if (idx === 0) arr[0] = clamp(snap(v, min, step), min, arr[1])
      else arr[1] = clamp(snap(v, min, step), arr[0], max)
      value.set(arr as [number, number])
    } else {
      value.set(v)
    }
  }

  // --- positioning math ---------------------------------------------------

  const flipped = inverted !== (dir === "rtl")

  const toPercent = (v: number): number => {
    const pct = ((v - min) / (max - min)) * 100
    return flipped ? 100 - pct : pct
  }

  const fromPercent = (pct: number): number => {
    const eff = flipped ? 100 - pct : pct
    return min + (eff / 100) * (max - min)
  }

  const valueArray = (): [number, number] => {
    const v = readValue()
    if (isTuple(v)) return v
    return [min, v]
  }

  const positionStyle = (v: number): Record<string, string> => {
    const pct = toPercent(v)
    if (orientation === "vertical") {
      return { top: `${pct}%`, transform: "translate(-50%, -50%)" }
    }
    return { left: `${pct}%`, transform: "translate(-50%, -50%)" }
  }

  const rangeStyle = (): Record<string, string> => {
    if (range) {
      const [a, b] = valueArray()
      const pa = toPercent(a)
      const pb = toPercent(b)
      const start = Math.min(pa, pb)
      const length = Math.abs(pb - pa)
      if (orientation === "vertical") {
        return { top: `${start}%`, height: `${length}%` }
      }
      return { left: `${start}%`, width: `${length}%` }
    }
    const v = readValue()
    const pct = toPercent(typeof v === "number" ? v : 0)
    if (orientation === "vertical") {
      return flipped ? { top: `${pct}%`, height: `${100 - pct}%` } : { top: "0", height: `${pct}%` }
    }
    return flipped ? { left: `${pct}%`, width: `${100 - pct}%` } : { left: "0", width: `${pct}%` }
  }

  // --- props --------------------------------------------------------------

  const thumbIds: [string, string] = [
    createId("dokuma-slider-thumb"),
    createId("dokuma-slider-thumb"),
  ]
  const valueText = (v: number, idx: number): string =>
    options.getValueText ? options.getValueText(v, idx) : String(v)

  const getRootProps = (): SliderRootProps => {
    const props: SliderRootProps = {
      role: "presentation",
      "data-orientation": orientation,
    }
    if (isDisabled()) props["data-disabled"] = true
    return props
  }

  const getTrackProps = (): SliderTrackProps => {
    const props: SliderTrackProps = {
      "data-orientation": orientation,
    }
    if (isDisabled()) props["data-disabled"] = true
    return props
  }

  const getRangeProps = (): SliderRangeProps => {
    const props: SliderRangeProps = {
      "data-orientation": orientation,
      style: rangeStyle(),
    }
    if (isDisabled()) props["data-disabled"] = true
    return props
  }

  const adjustValue = (idx: 0 | 1, delta: number): void => {
    const cur = readValue()
    if (range) {
      const arr = isTuple(cur) ? [...cur] : ([cur, cur] as [number, number])
      const next = arr[idx] + delta
      if (idx === 0) arr[0] = clamp(snap(next, min, step), min, arr[1])
      else arr[1] = clamp(snap(next, min, step), arr[0], max)
      value.set(arr as [number, number])
    } else {
      const v = typeof cur === "number" ? cur : cur[0]
      value.set(clamp(snap(v + delta, min, step), min, max))
    }
  }

  const setThumb = (idx: 0 | 1, v: number): void => {
    setThumbValue(idx, v)
  }

  const handleThumbKeyDown = (
    idx: 0 | 1,
    event: { key: string; shiftKey?: boolean; preventDefault?: () => void },
  ): void => {
    if (isDisabled()) return
    const dec =
      orientation === "vertical" ? "ArrowDown" : dir === "rtl" ? "ArrowRight" : "ArrowLeft"
    const inc = orientation === "vertical" ? "ArrowUp" : dir === "rtl" ? "ArrowLeft" : "ArrowRight"
    const stepSize = event.shiftKey ? largeStep : step

    if (event.key === inc) {
      event.preventDefault?.()
      adjustValue(idx, +stepSize)
      return
    }
    if (event.key === dec) {
      event.preventDefault?.()
      adjustValue(idx, -stepSize)
      return
    }
    if (event.key === "PageUp") {
      event.preventDefault?.()
      adjustValue(idx, +largeStep)
      return
    }
    if (event.key === "PageDown") {
      event.preventDefault?.()
      adjustValue(idx, -largeStep)
      return
    }
    if (event.key === "Home") {
      event.preventDefault?.()
      setThumb(idx, min)
      return
    }
    if (event.key === "End") {
      event.preventDefault?.()
      setThumb(idx, max)
      return
    }
  }

  const getThumbProps = (thumbIdx: 0 | 1 = 0): SliderThumbProps => {
    const arr = valueArray()
    const v = range
      ? arr[thumbIdx]
      : typeof readValue() === "number"
        ? (readValue() as number)
        : arr[0]
    const props: SliderThumbProps = {
      role: "slider",
      id: thumbIds[thumbIdx],
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": v,
      "aria-valuetext": valueText(v, thumbIdx),
      "data-orientation": orientation,
      tabIndex: isDisabled() ? -1 : 0,
      style: positionStyle(v),
      onKeyDown: (event) => handleThumbKeyDown(thumbIdx, event),
    }
    if (orientation === "vertical") props["aria-orientation"] = "vertical"
    if (isDisabled()) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    return props
  }

  const getHiddenInputProps = ():
    | SliderHiddenInputProps
    | [SliderHiddenInputProps, SliderHiddenInputProps]
    | null => {
    if (!options.name) return null
    const cur = readValue()
    if (range) {
      const arr = isTuple(cur) ? cur : ([cur, cur] as [number, number])
      return [
        { type: "hidden", name: `${options.name}.0`, value: String(arr[0]) },
        { type: "hidden", name: `${options.name}.1`, value: String(arr[1]) },
      ]
    }
    return {
      type: "hidden",
      name: options.name,
      value: String(typeof cur === "number" ? cur : cur[0]),
    }
  }

  // --- mount --------------------------------------------------------------

  const mount = (els: {
    root: HTMLElement
    track: HTMLElement
    range?: HTMLElement
    thumbs: HTMLElement[]
  }): Unsubscribe => {
    const { root, track, range: rangeEl, thumbs } = els
    let savedCursor = ""
    let savedUserSelect = ""

    const startBodyDragStyles = (): void => {
      if (!isBrowser()) return
      savedCursor = document.body.style.cursor
      savedUserSelect = document.body.style.userSelect
      document.body.style.cursor = orientation === "vertical" ? "ns-resize" : "ew-resize"
      document.body.style.userSelect = "none"
    }
    const endBodyDragStyles = (): void => {
      if (!isBrowser()) return
      document.body.style.cursor = savedCursor
      document.body.style.userSelect = savedUserSelect
    }

    const apply = (): void => {
      // root
      root.setAttribute("role", "presentation")
      root.setAttribute("data-orientation", orientation)
      if (isDisabled()) root.setAttribute("data-disabled", "")
      else root.removeAttribute("data-disabled")
      // track
      track.setAttribute("data-orientation", orientation)
      // range
      if (rangeEl) {
        rangeEl.setAttribute("data-orientation", orientation)
        const s = rangeStyle()
        for (const k in s) (rangeEl.style as unknown as Record<string, string>)[k] = s[k] as string
      }
      // thumbs
      for (let i = 0 as 0 | 1; i < (range ? 2 : 1); i = (i + 1) as 0 | 1) {
        const el = thumbs[i]
        if (!el) continue
        const arr = valueArray()
        const v = range
          ? arr[i]
          : typeof readValue() === "number"
            ? (readValue() as number)
            : arr[0]
        el.setAttribute("role", "slider")
        el.id = thumbIds[i]
        el.setAttribute("aria-valuemin", String(min))
        el.setAttribute("aria-valuemax", String(max))
        el.setAttribute("aria-valuenow", String(v))
        el.setAttribute("aria-valuetext", valueText(v, i))
        el.setAttribute("data-orientation", orientation)
        if (orientation === "vertical") el.setAttribute("aria-orientation", "vertical")
        el.tabIndex = isDisabled() ? -1 : 0
        const s = positionStyle(v)
        for (const k in s) (el.style as unknown as Record<string, string>)[k] = s[k] as string
        if (isDisabled()) {
          el.setAttribute("aria-disabled", "true")
          el.setAttribute("data-disabled", "")
        } else {
          el.removeAttribute("aria-disabled")
          el.removeAttribute("data-disabled")
        }
        if (i === 1 && !range) break
      }
    }

    const valueFromPointer = (clientX: number, clientY: number): number => {
      const rect = track.getBoundingClientRect()
      let pct: number
      if (orientation === "vertical") {
        pct = ((clientY - rect.top) / rect.height) * 100
      } else {
        pct = ((clientX - rect.left) / rect.width) * 100
      }
      pct = clamp(pct, 0, 100)
      const raw = fromPercent(pct)
      return clamp(snap(raw, min, step), min, max)
    }

    const closestThumb = (v: number): 0 | 1 => {
      if (!range) return 0
      const arr = valueArray()
      return Math.abs(v - arr[0]) <= Math.abs(v - arr[1]) ? 0 : 1
    }

    let activeThumb: 0 | 1 | null = null
    let activeEl: HTMLElement | null = null

    const onPointerMove = (e: PointerEvent): void => {
      if (activeThumb === null) return
      const v = valueFromPointer(e.clientX, e.clientY)
      setThumb(activeThumb, v)
    }
    const onPointerUp = (): void => {
      if (activeThumb === null) return
      activeThumb = null
      activeEl = null
      endBodyDragStyles()
      options.onValueCommit?.(readValue())
    }

    const onTrackPointerDown = (e: PointerEvent): void => {
      if (isDisabled()) return
      e.preventDefault()
      const v = valueFromPointer(e.clientX, e.clientY)
      const idx = closestThumb(v)
      activeThumb = idx
      activeEl = thumbs[idx] ?? null
      activeEl?.focus()
      setThumb(idx, v)
      // Capture on the chosen thumb so subsequent pointermove follows it.
      try {
        activeEl?.setPointerCapture(e.pointerId)
      } catch {}
      startBodyDragStyles()
    }

    const onThumbPointerDown =
      (idx: 0 | 1) =>
      (e: PointerEvent): void => {
        if (isDisabled()) return
        e.preventDefault()
        activeThumb = idx
        activeEl = thumbs[idx] ?? null
        activeEl?.focus()
        try {
          activeEl?.setPointerCapture(e.pointerId)
        } catch {}
        startBodyDragStyles()
      }

    const onThumbKeyDown =
      (idx: 0 | 1) =>
      (e: KeyboardEvent): void => {
        handleThumbKeyDown(idx, e)
        // After a keyboard adjustment, treat it as committed.
        // Many libraries commit on keyup; we commit on keydown for simplicity (every key produces a final value).
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "PageUp",
            "PageDown",
            "Home",
            "End",
          ].includes(e.key)
        ) {
          options.onValueCommit?.(readValue())
        }
      }

    apply()

    const cleanups: Array<() => void> = []
    cleanups.push(on(track, "pointerdown", onTrackPointerDown as EventListener))
    for (let i = 0 as 0 | 1; i < (range ? 2 : 1); i = (i + 1) as 0 | 1) {
      const el = thumbs[i]
      if (!el) continue
      cleanups.push(on(el, "pointerdown", onThumbPointerDown(i) as EventListener))
      cleanups.push(on(el, "keydown", onThumbKeyDown(i) as EventListener))
      cleanups.push(on(el, "pointermove", onPointerMove as EventListener))
      cleanups.push(on(el, "pointerup", onPointerUp))
      cleanups.push(on(el, "pointercancel", onPointerUp))
    }

    const unsub = value.subscribe(apply)
    cleanups.push(unsub)

    return () => {
      endBodyDragStyles()
      for (const fn of cleanups) fn()
    }
  }

  return {
    value,
    min,
    max,
    step,
    largeStep,
    orientation,
    range,
    isDisabled,
    setValue,
    setThumbValue,
    getRootProps,
    getTrackProps,
    getRangeProps,
    getThumbProps,
    getHiddenInputProps,
    mount,
  }
}
