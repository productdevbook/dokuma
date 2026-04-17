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

// --- scroll lock (ref-counted, per-document) -------------------------------

interface ScrollLockState {
  count: number
  bodyOverflow: string
  bodyPaddingRight: string
  htmlOverflow: string
}

const SCROLL_LOCK_KEY = Symbol.for("dokuma.scrollLock")

interface DocumentWithLock extends Document {
  [SCROLL_LOCK_KEY]?: ScrollLockState
}

/**
 * Locks `<body>` and `<html>` scrolling. Compensates for the disappearing
 * scrollbar by padding `<body>` to prevent layout shift. Ref-counted per
 * document so nested dialogs stack without fighting; the lock releases when
 * the count returns to zero. State lives on the document itself (not module
 * scope), keeping SSR safe and surviving module duplication. Returns a
 * release function (idempotent — safe to call twice).
 */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {}

  const doc = document as DocumentWithLock
  let state = doc[SCROLL_LOCK_KEY]
  if (!state) {
    state = { count: 0, bodyOverflow: "", bodyPaddingRight: "", htmlOverflow: "" }
    doc[SCROLL_LOCK_KEY] = state
  }

  if (state.count === 0) {
    const body = doc.body
    const html = doc.documentElement
    const scrollbarWidth = window.innerWidth - html.clientWidth
    state.bodyOverflow = body.style.overflow
    state.bodyPaddingRight = body.style.paddingRight
    state.htmlOverflow = html.style.overflow
    body.style.overflow = "hidden"
    html.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      const current = parseInt(getComputedStyle(body).paddingRight || "0", 10)
      body.style.paddingRight = `${current + scrollbarWidth}px`
    }
  }
  state.count++

  let released = false
  return () => {
    if (released) return
    released = true
    state!.count--
    if (state!.count === 0) {
      const body = doc.body
      const html = doc.documentElement
      body.style.overflow = state!.bodyOverflow
      body.style.paddingRight = state!.bodyPaddingRight
      html.style.overflow = state!.htmlOverflow
      state!.bodyOverflow = ""
      state!.bodyPaddingRight = ""
      state!.htmlOverflow = ""
    }
  }
}
