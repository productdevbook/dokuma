import { on } from "../_dom.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"
import type { Field, ValidationMode } from "./field.ts"

export type FormValues = Record<string, unknown>
export type FormErrors = Record<string, string | string[] | undefined>

export interface FormOptions {
  /** Map of server-side / externally-controlled errors keyed by field name. */
  errors?: FormErrors | (() => FormErrors)
  /** Default `"onSubmit"`. Inherited by Fields without an explicit mode. */
  validationMode?: ValidationMode
  /**
   * Submit handler. Invoked after all Fields validate successfully. Receives
   * `{ values, event }` and can return a Promise — UI stays in `submitting`
   * until it resolves. Throw or reject to abort.
   */
  onSubmit?: (args: { values: FormValues; event: Event }) => void | Promise<void>
  /** Clear server errors after a successful submit. Default `true`. */
  clearErrorsOnSuccess?: boolean
}

export interface Form {
  values: Signal<FormValues>
  errors: Signal<FormErrors>
  submitting: Signal<boolean>
  submitAttempted: Signal<boolean>
  /** Register a field so Form.submit() validates it. Returns unregister. */
  registerField: (field: Field) => Unsubscribe
  /**
   * Validate every registered field + run the submit handler if all are valid.
   * `event` is optional — when present, its `preventDefault()` is called.
   */
  submit: (event?: Event) => Promise<boolean>
  reset: () => void
  /** Bind a `<form>` element — intercepts submit and calls `submit()`. */
  mount: (el: HTMLFormElement) => Unsubscribe
}

export function createForm(options: FormOptions = {}): Form {
  const readErrors = (): FormErrors =>
    typeof options.errors === "function" ? options.errors() : (options.errors ?? {})

  const values = createSignal<FormValues>({})
  const errors = createSignal<FormErrors>(readErrors())
  const submitting = createSignal(false)
  const submitAttempted = createSignal(false)

  const fields = new Set<Field>()

  const registerField: Form["registerField"] = (field) => {
    fields.add(field)
    // Sync server errors into the field.
    const serverError = readErrors()[field.name ?? ""]
    if (serverError !== undefined) {
      field.invalid.set(true)
      const list = Array.isArray(serverError) ? serverError : [serverError]
      field.errorMessages.set(list)
      field.errorMessage.set(list[0] ?? "")
    }
    return () => {
      fields.delete(field)
    }
  }

  const collectValues = (): FormValues => {
    const out: FormValues = { ...values.get() }
    for (const f of fields) {
      if (f.name) out[f.name] = f.validityData.get().value
    }
    return out
  }

  const submit: Form["submit"] = async (event) => {
    submitAttempted.set(true)
    event?.preventDefault()
    const vals = collectValues()
    values.set(vals)

    const results = await Promise.all([...fields].map((f) => f.validate(vals)))
    const allValid = results.every(Boolean)
    if (!allValid) return false

    try {
      submitting.set(true)
      if (options.onSubmit) {
        await options.onSubmit({ values: vals, event: event ?? new Event("submit") })
      }
      if (options.clearErrorsOnSuccess !== false) errors.set({})
      return true
    } catch {
      return false
    } finally {
      submitting.set(false)
    }
  }

  const reset: Form["reset"] = () => {
    submitAttempted.set(false)
    for (const f of fields) f.reset()
    errors.set({})
  }

  const mount: Form["mount"] = (el) => {
    const off = on(el, "submit", (event) => {
      void submit(event)
    })
    return off
  }

  return {
    values,
    errors,
    submitting,
    submitAttempted,
    registerField,
    submit,
    reset,
    mount,
  }
}
