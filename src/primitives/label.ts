export interface LabelOptions {
  /** The id of the form control this label describes. */
  htmlFor?: string
  /** Optional id on the label element itself. */
  id?: string
}

export interface LabelProps {
  /**
   * DOM attribute name (`for`), not the JSX `htmlFor` form. React/Vue adapters
   * keep their respective renames; vanilla mounts emit the DOM attribute as-is.
   */
  for?: string
  id?: string
}

export interface Label {
  getRootProps: () => LabelProps
}

/**
 * A `<label>` association helper. The primitive doesn't render a `<label>`
 * itself — the consumer does — and only emits the `for` and `id` attributes so
 * SR pairings stay correct. Useful when the label points to a non-`<input>`
 * widget (a custom Switch, a Checkbox composite) where `<label>` wrapping
 * doesn't auto-associate.
 */
export function createLabel(options: LabelOptions = {}): Label {
  return {
    getRootProps: () => {
      const props: LabelProps = {}
      if (options.htmlFor) props.for = options.htmlFor
      if (options.id) props.id = options.id
      return props
    },
  }
}
