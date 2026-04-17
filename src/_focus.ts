import { on } from "./_dom.ts"

/**
 * Returns elements inside `root` that can receive focus, in document order.
 * Excludes elements that are disabled, inert, or visually hidden.
 */
export function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(",")

  const list: HTMLElement[] = []
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(selector))) {
    if (el.hasAttribute("inert")) continue
    if (el.closest("[inert]")) continue
    const style = getComputedStyle(el)
    if (style.visibility === "hidden" || style.display === "none") continue
    list.push(el)
  }
  return list
}

export interface TrapFocusOptions {
  initialFocus?: HTMLElement | null
}

/**
 * Confines tab navigation inside `root`. On open, focus jumps to the first
 * focusable child (or the explicit `initialFocus`); if none exist, the root
 * itself gets focus (root must have `tabindex="-1"` to be focusable).
 *
 * Returns a release function that removes listeners.
 */
export function trapFocus(root: HTMLElement, options: TrapFocusOptions = {}): () => void {
  const focusable = getFocusable(root)
  const initial = options.initialFocus ?? focusable[0] ?? root
  initial.focus()

  const handler = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") return
    const list = getFocusable(root)
    if (!list.length) {
      event.preventDefault()
      root.focus()
      return
    }
    const first = list[0]!
    const last = list[list.length - 1]!
    const active = document.activeElement as HTMLElement | null

    if (event.shiftKey) {
      if (active === first || !root.contains(active)) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (active === last || !root.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return on(document, "keydown", handler as EventListener, true)
}

// --- scroll lock (ref-counted) ----------------------------------------------

let lockCount = 0
let savedBodyOverflow = ""
let savedBodyPaddingRight = ""
let savedHtmlOverflow = ""

/**
 * Locks `<body>` and `<html>` scrolling. Compensates for the disappearing
 * scrollbar by padding `<body>` to prevent layout shift. Ref-counted so nested
 * dialogs can stack without fighting; the lock releases when the count returns
 * to zero. Returns a release function (idempotent — safe to call twice).
 */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {}

  if (lockCount === 0) {
    const body = document.body
    const html = document.documentElement
    const scrollbarWidth = window.innerWidth - html.clientWidth
    savedBodyOverflow = body.style.overflow
    savedBodyPaddingRight = body.style.paddingRight
    savedHtmlOverflow = html.style.overflow
    body.style.overflow = "hidden"
    html.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      const current = parseInt(getComputedStyle(body).paddingRight || "0", 10)
      body.style.paddingRight = `${current + scrollbarWidth}px`
    }
  }
  lockCount++

  let released = false
  return () => {
    if (released) return
    released = true
    lockCount--
    if (lockCount === 0) {
      const body = document.body
      const html = document.documentElement
      body.style.overflow = savedBodyOverflow
      body.style.paddingRight = savedBodyPaddingRight
      html.style.overflow = savedHtmlOverflow
      savedBodyOverflow = ""
      savedBodyPaddingRight = ""
      savedHtmlOverflow = ""
    }
  }
}
