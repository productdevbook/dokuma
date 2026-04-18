import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface MeterOptions {
  /** The current value. */
  value: number
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /**
   * `Intl.NumberFormat` options used to format the value (e.g. `{ style: "percent" }`).
   * When provided, the formatted string also becomes the default `aria-valuetext`.
   */
  format?: Intl.NumberFormatOptions
  /** Locale override for `Intl.NumberFormat`. Defaults to the user's runtime locale. */
  locale?: Intl.LocalesArgument
  /** Custom aria-valuetext factory. Receives the already-formatted value. */
  getAriaValueText?: (formattedValue: string, value: number) => string
  /** Optional label id to wire `aria-labelledby`. */
  labelId?: string
}

export interface MeterRootProps {
  role: "meter"
  "aria-valuemin": number
  "aria-valuemax": number
  "aria-valuenow": number
  "aria-valuetext": string
  "aria-labelledby"?: string
  "data-value": number
  "data-max": number
  "data-min": number
}

export interface MeterIndicatorProps {
  "data-value": number
  "data-max": number
  "data-min": number
  /** Consumer applies as CSS; width:`<percent>%`. */
  style?: { width: string }
}

export interface MeterValueProps {
  /** The human-readable formatted value (to render inside the element). */
  children: string
}

export interface Meter {
  value: Signal<number>
  min: number
  max: number
  formattedValue: () => string
  fraction: () => number
  getRootProps: () => MeterRootProps
  getIndicatorProps: () => MeterIndicatorProps
  getValueProps: () => MeterValueProps
  /** Imperative DOM wiring — returns cleanup. */
  mount: (els: { root: HTMLElement; indicator?: HTMLElement; valueEl?: HTMLElement }) => Unsubscribe
}

function formatNumberValue(
  value: number,
  locale: Intl.LocalesArgument | undefined,
  format: Intl.NumberFormatOptions | undefined,
): string {
  if (!format) return `${value}`
  try {
    return new Intl.NumberFormat(locale, format).format(value)
  } catch {
    return `${value}`
  }
}

/**
 * ARIA `meter` widget — a non-animated gauge (e.g. disk usage, skill bar) that
 * reports a known quantity within a fixed range. Distinct from `progress`,
 * which represents task completion.
 */
export function createMeter(options: MeterOptions): Meter {
  const min = options.min ?? 0
  const max = options.max ?? 100

  const value = createSignal(options.value)

  const formattedValue = (): string =>
    formatNumberValue(value.get(), options.locale, options.format)

  const fraction = (): number => {
    const v = value.get()
    const span = max - min
    if (span <= 0) return 0
    return Math.max(0, Math.min(1, (v - min) / span))
  }

  const ariaValueText = (): string => {
    const v = value.get()
    const f = formattedValue()
    if (options.getAriaValueText) return options.getAriaValueText(f, v)
    if (options.format) return f
    return `${v}`
  }

  const getRootProps = (): MeterRootProps => {
    const v = value.get()
    const props: MeterRootProps = {
      role: "meter",
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": v,
      "aria-valuetext": ariaValueText(),
      "data-value": v,
      "data-max": max,
      "data-min": min,
    }
    if (options.labelId) props["aria-labelledby"] = options.labelId
    return props
  }

  const getIndicatorProps = (): MeterIndicatorProps => {
    const v = value.get()
    return {
      "data-value": v,
      "data-max": max,
      "data-min": min,
      style: { width: `${Math.round(fraction() * 100)}%` },
    }
  }

  const getValueProps = (): MeterValueProps => ({ children: formattedValue() })

  const mount = (els: {
    root: HTMLElement
    indicator?: HTMLElement
    valueEl?: HTMLElement
  }): Unsubscribe => {
    const apply = (): void => {
      const v = value.get()
      els.root.setAttribute("role", "meter")
      els.root.setAttribute("aria-valuemin", String(min))
      els.root.setAttribute("aria-valuemax", String(max))
      els.root.setAttribute("aria-valuenow", String(v))
      els.root.setAttribute("aria-valuetext", ariaValueText())
      els.root.setAttribute("data-value", String(v))
      els.root.setAttribute("data-max", String(max))
      els.root.setAttribute("data-min", String(min))
      if (options.labelId) els.root.setAttribute("aria-labelledby", options.labelId)

      if (els.indicator) {
        els.indicator.setAttribute("data-value", String(v))
        els.indicator.setAttribute("data-max", String(max))
        els.indicator.setAttribute("data-min", String(min))
        els.indicator.style.width = `${Math.round(fraction() * 100)}%`
      }

      if (els.valueEl) {
        els.valueEl.textContent = formattedValue()
      }
    }

    apply()
    return value.subscribe(apply)
  }

  return {
    value,
    min,
    max,
    formattedValue,
    fraction,
    getRootProps,
    getIndicatorProps,
    getValueProps,
    mount,
  }
}
