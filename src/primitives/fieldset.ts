import { createId } from "../_id.ts"
import { createSignal, type Signal } from "../_signal.ts"

export interface FieldsetOptions {
  /** Default `false`. Propagates to descendant fields (consumer wires). */
  disabled?: boolean
  /** Optional explicit id. */
  id?: string
}

export interface FieldsetRootProps {
  id: string
  "aria-labelledby": string
  disabled?: boolean
  "data-disabled"?: ""
}

export interface FieldsetLegendProps {
  id: string
}

export interface Fieldset {
  id: string
  legendId: string
  disabled: Signal<boolean>
  getRootProps: () => FieldsetRootProps
  getLegendProps: () => FieldsetLegendProps
}

/**
 * `<fieldset>` + `<legend>` wiring with disabled propagation. Use when
 * grouping related form controls under a shared heading (radio groups,
 * multi-field sections). Descendant Fields should read `disabled` from
 * the nearest Fieldset.
 */
export function createFieldset(options: FieldsetOptions = {}): Fieldset {
  const id = options.id ?? createId("fieldset")
  const legendId = `${id}-legend`
  const disabled = createSignal(options.disabled ?? false)

  const getRootProps = (): FieldsetRootProps => {
    const props: FieldsetRootProps = {
      id,
      "aria-labelledby": legendId,
    }
    if (disabled.get()) {
      props.disabled = true
      props["data-disabled"] = ""
    }
    return props
  }

  const getLegendProps = (): FieldsetLegendProps => ({ id: legendId })

  return { id, legendId, disabled, getRootProps, getLegendProps }
}
