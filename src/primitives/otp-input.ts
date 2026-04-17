import { createId } from "../_id.ts"
import { createSignal, type Signal } from "../_signal.ts"

export interface OtpInputOptions {
  /** Default `6`. Number of cells. */
  length?: number
  defaultValue?: string
  /** Controlled value getter. Must always be `length` chars or fewer. */
  value?: () => string
  onValueChange?: (value: string) => void
  /** Fires once when all cells are filled. */
  onComplete?: (value: string) => void
  /** Default `false`. When true, cells render as `type="password"`. */
  mask?: boolean
  /**
   * Default `[0-9]`. Regex character class (without anchors / brackets) used
   * to validate each input. Examples: `"a-zA-Z0-9"` for alphanumeric.
   */
  pattern?: string
  /** Optional name for hidden form input emitting the joined value. */
  name?: string
  disabled?: () => boolean
}

export interface OtpInputCellProps {
  id: string
  type: "text" | "password"
  inputmode: "numeric" | "text"
  autocomplete: "one-time-code"
  maxlength: 1
  pattern: string
  value: string
  "aria-label": string
  "aria-disabled"?: boolean
  disabled?: boolean
  onInput: (event: { currentTarget: { value: string } }) => void
  onKeyDown: (event: { key: string; preventDefault?: () => void }) => void
  onPaste: (event: {
    clipboardData?: { getData: (t: string) => string }
    preventDefault?: () => void
  }) => void
  onFocus: (event: { currentTarget: HTMLInputElement }) => void
}

export interface OtpInputHiddenInputProps {
  type: "hidden"
  name: string
  value: string
}

export interface OtpInput {
  value: Signal<string>
  isComplete: Signal<boolean>
  length: number
  setValue: (v: string) => void
  clear: () => void
  getCellProps: (index: number) => OtpInputCellProps
  getCellId: (index: number) => string
  getHiddenInputProps: () => OtpInputHiddenInputProps | null
}

export function createOtpInput(options: OtpInputOptions = {}): OtpInput {
  const length = options.length ?? 6
  const mask = options.mask ?? false
  const patternClass = options.pattern ?? "0-9"
  const inputType = mask ? "password" : "text"
  const inputMode = patternClass === "0-9" ? "numeric" : "text"
  const validRe = new RegExp(`^[${patternClass}]+$`)
  const isControlled = typeof options.value === "function"

  const cellIds: string[] = Array.from({ length }, () => createId("dokuma-otp-cell"))
  const internalValue = createSignal((options.defaultValue ?? "").slice(0, length))
  const valueSubs = new Set<(v: string) => void>()
  const completeSubs = new Set<(v: boolean) => void>()
  let lastCompleteFired = false

  const readValue = (): string =>
    (isControlled ? (options.value as () => string)() : internalValue.get()).slice(0, length)

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const value: Signal<string> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string) => string)(readValue()) : next
      const clipped = resolved.slice(0, length)
      if (clipped === readValue()) return
      if (!isControlled) internalValue.set(clipped)
      options.onValueChange?.(clipped)
      for (const fn of valueSubs) fn(clipped)
      const complete = clipped.length === length
      if (complete !== lastCompleteFired) {
        lastCompleteFired = complete
        for (const fn of completeSubs) fn(complete)
        if (complete) options.onComplete?.(clipped)
      }
    },
    subscribe: (fn) => {
      valueSubs.add(fn)
      return () => valueSubs.delete(fn)
    },
  }

  const isComplete: Signal<boolean> = {
    get: () => readValue().length === length,
    set: () => {
      throw new Error("dokuma: otp.isComplete is read-only.")
    },
    subscribe: (fn) => {
      completeSubs.add(fn)
      return () => completeSubs.delete(fn)
    },
  }

  const setValue = (v: string): void => value.set(v)
  const clear = (): void => value.set("")

  const focusCell = (index: number): void => {
    if (typeof document === "undefined") return
    if (index < 0 || index >= length) return
    const el = document.getElementById(cellIds[index]!) as HTMLInputElement | null
    el?.focus()
    el?.select?.()
  }

  const setCharAt = (index: number, char: string): void => {
    const cur = readValue().padEnd(length, " ")
    const next = cur.slice(0, index) + char + cur.slice(index + 1)
    value.set(next.replace(/ +$/, ""))
  }

  const getCellId = (index: number): string => cellIds[index] ?? ""

  const handleInput =
    (index: number) =>
    (event: { currentTarget: { value: string } }): void => {
      const raw = event.currentTarget.value
      // Modern browsers fire `input` with the new full value of the field;
      // because maxlength=1, raw is "" (cleared) or 1 char or sometimes multiple
      // (paste in one cell). Take last char if multi.
      const ch = raw.slice(-1)
      if (ch === "") {
        // Cleared by the OS / IME.
        setCharAt(index, " ")
        return
      }
      if (!validRe.test(ch)) return
      setCharAt(index, ch)
      if (index < length - 1) focusCell(index + 1)
    }

  const handleKeyDown =
    (index: number) =>
    (event: { key: string; preventDefault?: () => void }): void => {
      if (isDisabled()) return
      if (event.key === "Backspace") {
        const cur = readValue()
        if ((cur[index] ?? "") === "") {
          // Empty cell — move back and clear previous.
          if (index > 0) {
            event.preventDefault?.()
            setCharAt(index - 1, " ")
            focusCell(index - 1)
          }
        } else {
          event.preventDefault?.()
          setCharAt(index, " ")
        }
      } else if (event.key === "ArrowLeft") {
        event.preventDefault?.()
        focusCell(index - 1)
      } else if (event.key === "ArrowRight") {
        event.preventDefault?.()
        focusCell(index + 1)
      } else if (event.key === "Home") {
        event.preventDefault?.()
        focusCell(0)
      } else if (event.key === "End") {
        event.preventDefault?.()
        focusCell(length - 1)
      }
    }

  const handlePaste =
    (index: number) =>
    (event: {
      clipboardData?: { getData: (t: string) => string }
      preventDefault?: () => void
    }): void => {
      const text = event.clipboardData?.getData("text") ?? ""
      const filtered = [...text].filter((c) => validRe.test(c)).join("")
      if (!filtered) return
      event.preventDefault?.()
      const cur = readValue().padEnd(length, " ")
      const sliced = filtered.slice(0, length - index)
      const next = cur.slice(0, index) + sliced + cur.slice(index + sliced.length)
      value.set(next.replace(/ +$/, ""))
      const lastFilled = Math.min(index + sliced.length, length - 1)
      focusCell(lastFilled)
    }

  const handleFocus =
    (_index: number) =>
    (event: { currentTarget: HTMLInputElement }): void => {
      // Select existing content so typing replaces it cleanly.
      event.currentTarget.select?.()
    }

  const getCellProps = (index: number): OtpInputCellProps => {
    const cur = readValue()
    const char = cur[index] ?? ""
    const props: OtpInputCellProps = {
      id: cellIds[index] ?? "",
      type: inputType,
      inputmode: inputMode,
      autocomplete: "one-time-code",
      maxlength: 1,
      pattern: `[${patternClass}]`,
      value: char,
      "aria-label": `Character ${index + 1} of ${length}`,
      onInput: handleInput(index),
      onKeyDown: handleKeyDown(index),
      onPaste: handlePaste(index),
      onFocus: handleFocus(index),
    }
    if (isDisabled()) {
      props["aria-disabled"] = true
      props.disabled = true
    }
    return props
  }

  const getHiddenInputProps = (): OtpInputHiddenInputProps | null => {
    if (!options.name) return null
    return { type: "hidden", name: options.name, value: readValue() }
  }

  return {
    value,
    isComplete,
    length,
    setValue,
    clear,
    getCellProps,
    getCellId,
    getHiddenInputProps,
  }
}
