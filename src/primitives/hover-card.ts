import { createTooltip, type Tooltip, type TooltipOptions } from "./tooltip.ts"

export type HoverCardOptions = Omit<TooltipOptions, "contentRole">
export type HoverCard = Tooltip

/**
 * A floating card shown on hover/focus that may contain interactive content
 * (links, buttons). Differs from Tooltip in two ways: longer default delays
 * suited to a heavier surface, and `role="dialog"` instead of
 * `role="tooltip"` so screen readers don't strip its interactive children.
 */
export function createHoverCard(options: HoverCardOptions = {}): HoverCard {
  return createTooltip({
    delayShow: 700,
    delayHide: 300,
    ...options,
    contentRole: "dialog",
  })
}
