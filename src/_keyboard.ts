export type Orientation = "vertical" | "horizontal"

export interface KeyboardLikeEvent {
  key: string
  preventDefault?: () => void
  stopPropagation?: () => void
}

/**
 * Pure helper for roving-style arrow-key navigation across a list of focusable triggers.
 * Returns the element that should receive focus (caller does the .focus() + preventDefault),
 * or null if the key wasn't handled.
 *
 * Disabled items are skipped. Looping wraps around either end.
 */
export function rovingKeyDown(
  triggers: ReadonlyArray<HTMLElement>,
  current: HTMLElement | null,
  orientation: Orientation,
  event: KeyboardLikeEvent,
): HTMLElement | null {
  if (!triggers.length) return null

  const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight"
  const prev = orientation === "vertical" ? "ArrowUp" : "ArrowLeft"

  const isDisabled = (el: HTMLElement): boolean =>
    el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled")

  const enabled = triggers.filter((el) => !isDisabled(el))
  if (!enabled.length) return null

  if (event.key === "Home") return enabled[0] ?? null
  if (event.key === "End") return enabled[enabled.length - 1] ?? null

  if (event.key !== next && event.key !== prev) return null

  const idx = current ? enabled.indexOf(current) : -1
  if (event.key === next) {
    const target = idx < 0 ? enabled[0] : enabled[(idx + 1) % enabled.length]
    return target ?? null
  }
  const target =
    idx < 0
      ? (enabled[enabled.length - 1] ?? null)
      : (enabled[(idx - 1 + enabled.length) % enabled.length] ?? null)
  return target
}
