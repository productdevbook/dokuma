export interface VisuallyHiddenProps {
  /**
   * Inline style that visually hides the element while leaving it in the
   * accessibility tree. Equivalent to the well-known `.sr-only` utility class.
   */
  style: {
    position: "absolute"
    width: string
    height: string
    padding: string
    margin: string
    overflow: "hidden"
    clip: string
    clipPath: string
    whiteSpace: "nowrap"
    border: string
  }
}

export interface VisuallyHidden {
  getRootProps: () => VisuallyHiddenProps
}

const STYLE = {
  position: "absolute" as const,
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden" as const,
  clip: "rect(0, 0, 0, 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap" as const,
  border: "0",
}

/**
 * Renders content that is invisible to sighted users but read by assistive
 * tech. Use for icon-only buttons (`<button><Icon /><VisuallyHidden>Close
 * dialog</VisuallyHidden></button>`), live-region announcements, or any text
 * that exists for screen readers only. Stateless — pure prop getter.
 */
export function createVisuallyHidden(): VisuallyHidden {
  return {
    getRootProps: () => ({ style: { ...STYLE } }),
  }
}
