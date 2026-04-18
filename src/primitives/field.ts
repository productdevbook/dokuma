import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type ValidationMode = "onBlur" | "onChange" | "onSubmit"

export interface FieldValidityState {
  valid: boolean | null
  badInput: boolean
  customError: boolean
  patternMismatch: boolean
  rangeOverflow: boolean
  rangeUnderflow: boolean
  stepMismatch: boolean
  tooLong: boolean
  tooShort: boolean
  typeMismatch: boolean
  valueMissing: boolean
}

const DEFAULT_VALIDITY: FieldValidityState = {
  valid: null,
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valueMissing: false,
}

export interface FieldValidityData {
  state: FieldValidityState
  error: string
  errors: string[]
  value: unknown
  initialValue: unknown
}

export interface FieldOptions {
  /** Name used by form submission + form-level errors map. */
  name?: string
  /** Disables the control and propagates via Field context. */
  disabled?: boolean
  /** Externally-controlled invalid state (e.g. server-side errors). */
  invalid?: boolean | (() => boolean)
  /** Externally-controlled touched state. */
  touched?: boolean | (() => boolean)
  /** Externally-controlled dirty state. */
  dirty?: boolean | (() => boolean)
  /** Default `"onSubmit"`. */
  validationMode?: ValidationMode
  /** Debounce for `onChange` validation (ms). Default `0`. */
  validationDebounceTime?: number
  /** Synchronous or async custom validator. Return `null` for valid. */
  validate?: (
    value: unknown,
    formValues: Record<string, unknown>,
  ) => string | string[] | null | Promise<string | string[] | null>
  /** Explicit id override; otherwise auto-generated. */
  id?: string
}

export interface FieldRootProps {
  "data-field"?: ""
  "data-disabled"?: ""
  "data-touched"?: ""
  "data-dirty"?: ""
  "data-filled"?: ""
  "data-focused"?: ""
  "data-valid"?: "" | "false"
  "data-invalid"?: ""
}

export interface FieldControlProps {
  id: string
  name?: string
  disabled?: boolean
  "aria-describedby"?: string
  "aria-invalid"?: "true"
  "aria-errormessage"?: string
}

export interface FieldLabelProps {
  for: string
  id: string
}

export interface FieldDescriptionProps {
  id: string
}

export interface FieldErrorProps {
  id: string
  role: "alert"
  children: string
}

export interface Field {
  id: string
  controlId: string
  labelId: string
  descriptionId: string
  errorId: string

  name?: string
  validationMode: ValidationMode
  disabled: Signal<boolean>
  invalid: Signal<boolean>
  touched: Signal<boolean>
  dirty: Signal<boolean>
  filled: Signal<boolean>
  focused: Signal<boolean>
  /** Latest error message ("" when valid). */
  errorMessage: Signal<string>
  /** Latest error list. */
  errorMessages: Signal<string[]>
  /** Full validity data. */
  validityData: Signal<FieldValidityData>

  /** Mark the field dirty — auto-called when `value` changes. */
  setValue: (value: unknown) => void
  /** Commit validation (sync + async). Resolves when done. */
  validate: (formValues?: Record<string, unknown>) => Promise<boolean>
  /** Reset to pristine state. */
  reset: () => void

  getRootProps: () => FieldRootProps
  getControlProps: () => FieldControlProps
  getLabelProps: () => FieldLabelProps
  getDescriptionProps: () => FieldDescriptionProps
  getErrorProps: () => FieldErrorProps | null

  /** Hook a control element to register focus/blur/input events. Returns cleanup. */
  registerControl: (el: HTMLElement) => Unsubscribe
  /** Hook a description element — exposes it via aria-describedby. */
  registerDescription: (el: HTMLElement) => Unsubscribe
  /** Hook an error element — exposes it via aria-errormessage + describedby when invalid. */
  registerError: (el: HTMLElement) => Unsubscribe
}

/**
 * Field groups a labelled control with its description, validation error, and
 * validity state. Consumers wire:
 *  - Root: emits data-* attributes for CSS state styling
 *  - Label: `for` points to `controlId`
 *  - Control: receives id, name, aria-describedby, aria-invalid
 *  - Description: paired via aria-describedby
 *  - Error: role=alert, id in aria-errormessage when invalid
 *
 * Validation runs on `validate()`; `validationMode` only indicates intent.
 * Form integration is loose — pass `formValues` to `validate()` as needed.
 */
export function createField(options: FieldOptions = {}): Field {
  const id = options.id ?? createId("field")
  const controlId = `${id}-control`
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`

  const validationMode: ValidationMode = options.validationMode ?? "onSubmit"

  const disabled = createSignal(options.disabled ?? false)

  const readFn = <T>(src: T | (() => T) | undefined, fallback: T): T => {
    if (src === undefined) return fallback
    if (typeof src === "function") return (src as () => T)()
    return src
  }

  const invalidSignal = createSignal(readFn(options.invalid, false))
  const touchedSignal = createSignal(readFn(options.touched, false))
  const dirtySignal = createSignal(readFn(options.dirty, false))
  const filled = createSignal(false)
  const focused = createSignal(false)
  const errorMessage = createSignal("")
  const errorMessages = createSignal<string[]>([])
  const validityData = createSignal<FieldValidityData>({
    state: { ...DEFAULT_VALIDITY },
    error: "",
    errors: [],
    value: null,
    initialValue: null,
  })

  const descriptionIds = new Set<string>()
  const registeredErrorEl = { current: null as HTMLElement | null }
  let initialValue: unknown = null

  const updateDescribedBy = (): string | undefined => {
    const ids: string[] = []
    for (const d of descriptionIds) ids.push(d)
    if (invalidSignal.get() && registeredErrorEl.current) ids.push(errorId)
    return ids.length > 0 ? ids.join(" ") : undefined
  }

  const setValue = (value: unknown): void => {
    const prev = validityData.get().value
    validityData.set({ ...validityData.get(), value })
    filled.set(value !== "" && value !== null && value !== undefined)
    if (prev !== value) dirtySignal.set(true)
  }

  const validate = async (formValues: Record<string, unknown> = {}): Promise<boolean> => {
    const value = validityData.get().value
    if (!options.validate) {
      const next = { ...DEFAULT_VALIDITY, valid: true }
      validityData.set({
        state: next,
        error: "",
        errors: [],
        value,
        initialValue,
      })
      errorMessage.set("")
      errorMessages.set([])
      invalidSignal.set(false)
      return true
    }

    const result = await options.validate(value, formValues)
    const messages = result == null ? [] : Array.isArray(result) ? result : [result]
    const valid = messages.length === 0
    validityData.set({
      state: { ...DEFAULT_VALIDITY, customError: !valid, valid },
      error: messages[0] ?? "",
      errors: messages,
      value,
      initialValue,
    })
    errorMessage.set(messages[0] ?? "")
    errorMessages.set(messages)
    invalidSignal.set(!valid)
    return valid
  }

  const reset = (): void => {
    touchedSignal.set(false)
    dirtySignal.set(false)
    filled.set(false)
    focused.set(false)
    invalidSignal.set(false)
    errorMessage.set("")
    errorMessages.set([])
    validityData.set({
      state: { ...DEFAULT_VALIDITY },
      error: "",
      errors: [],
      value: initialValue,
      initialValue,
    })
  }

  const getRootProps = (): FieldRootProps => {
    const props: FieldRootProps = {}
    if (disabled.get()) props["data-disabled"] = ""
    if (touchedSignal.get()) props["data-touched"] = ""
    if (dirtySignal.get()) props["data-dirty"] = ""
    if (filled.get()) props["data-filled"] = ""
    if (focused.get()) props["data-focused"] = ""
    if (invalidSignal.get()) props["data-invalid"] = ""
    else if (validityData.get().state.valid === true) props["data-valid"] = ""
    return props
  }

  const getControlProps = (): FieldControlProps => {
    const props: FieldControlProps = { id: controlId }
    if (options.name) props.name = options.name
    if (disabled.get()) props.disabled = true
    const describedBy = updateDescribedBy()
    if (describedBy) props["aria-describedby"] = describedBy
    if (invalidSignal.get()) {
      props["aria-invalid"] = "true"
      if (registeredErrorEl.current) props["aria-errormessage"] = errorId
    }
    return props
  }

  const getLabelProps = (): FieldLabelProps => ({ for: controlId, id: labelId })

  const getDescriptionProps = (): FieldDescriptionProps => ({ id: descriptionId })

  const getErrorProps = (): FieldErrorProps | null => {
    if (!invalidSignal.get()) return null
    return { id: errorId, role: "alert", children: errorMessage.get() }
  }

  const registerControl = (el: HTMLElement): Unsubscribe => {
    el.id ||= controlId
    if (options.name) el.setAttribute("name", options.name)
    if (disabled.get()) (el as HTMLInputElement).disabled = true

    initialValue = (el as HTMLInputElement).value ?? null
    validityData.set({ ...validityData.get(), initialValue })

    const onFocus = (): void => {
      focused.set(true)
    }
    const onBlur = (): void => {
      focused.set(false)
      touchedSignal.set(true)
    }
    const onInput = (event: Event): void => {
      const target = event.target as HTMLInputElement
      setValue(target.value)
    }

    el.addEventListener("focus", onFocus)
    el.addEventListener("blur", onBlur)
    el.addEventListener("input", onInput)

    const applyAria = (): void => {
      const db = updateDescribedBy()
      if (db) el.setAttribute("aria-describedby", db)
      else el.removeAttribute("aria-describedby")
      if (invalidSignal.get()) {
        el.setAttribute("aria-invalid", "true")
        if (registeredErrorEl.current) el.setAttribute("aria-errormessage", errorId)
        else el.removeAttribute("aria-errormessage")
      } else {
        el.removeAttribute("aria-invalid")
        el.removeAttribute("aria-errormessage")
      }
    }
    applyAria()
    const un1 = invalidSignal.subscribe(applyAria)

    return () => {
      el.removeEventListener("focus", onFocus)
      el.removeEventListener("blur", onBlur)
      el.removeEventListener("input", onInput)
      un1()
    }
  }

  const registerDescription = (el: HTMLElement): Unsubscribe => {
    el.id ||= descriptionId
    descriptionIds.add(el.id)
    return () => {
      descriptionIds.delete(el.id)
    }
  }

  const registerError = (el: HTMLElement): Unsubscribe => {
    el.id ||= errorId
    el.setAttribute("role", "alert")
    registeredErrorEl.current = el
    const apply = (): void => {
      el.textContent = errorMessage.get()
      el.style.display = invalidSignal.get() && errorMessage.get() ? "" : "none"
    }
    apply()
    const un = errorMessage.subscribe(apply)
    const un2 = invalidSignal.subscribe(apply)
    return () => {
      un()
      un2()
      if (registeredErrorEl.current === el) registeredErrorEl.current = null
    }
  }

  return {
    id,
    controlId,
    labelId,
    descriptionId,
    errorId,
    name: options.name,
    validationMode,
    disabled,
    invalid: invalidSignal,
    touched: touchedSignal,
    dirty: dirtySignal,
    filled,
    focused,
    errorMessage,
    errorMessages,
    validityData,

    setValue,
    validate,
    reset,

    getRootProps,
    getControlProps,
    getLabelProps,
    getDescriptionProps,
    getErrorProps,

    registerControl,
    registerDescription,
    registerError,
  }
}
