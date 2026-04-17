export type Orientation = "horizontal" | "vertical"

export interface SeparatorOptions {
  /** Default `"horizontal"`. Sets `aria-orientation` when `decorative` is false. */
  orientation?: Orientation
  /**
   * Default `false`. When `true`, the separator is purely visual and is hidden
   * from assistive tech (`role="none"`, no `aria-orientation`). When `false`,
   * it exposes `role="separator"` with `aria-orientation`.
   */
  decorative?: boolean
}

export interface SeparatorProps {
  role: "separator" | "none"
  "aria-orientation"?: Orientation
  "data-orientation": Orientation
}

export interface Separator {
  orientation: Orientation
  decorative: boolean
  getRootProps: () => SeparatorProps
}

/**
 * A divider between sections. Stateless — the entire primitive is one prop
 * getter that emits the right ARIA role and orientation. Use `decorative: true`
 * (the default in most design systems' visual hierarchy is purely cosmetic) to
 * keep screen readers from announcing a meaningless region boundary.
 */
export function createSeparator(options: SeparatorOptions = {}): Separator {
  const orientation: Orientation = options.orientation ?? "horizontal"
  const decorative = options.decorative ?? false

  const getRootProps = (): SeparatorProps => {
    const props: SeparatorProps = {
      role: decorative ? "none" : "separator",
      "data-orientation": orientation,
    }
    if (!decorative) props["aria-orientation"] = orientation
    return props
  }

  return { orientation, decorative, getRootProps }
}
