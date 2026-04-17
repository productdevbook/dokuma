/**
 * Singleton stacks for two cross-cutting concerns shared by Dialog,
 * Popover, Menu, and Tooltip:
 *
 * - **Focus scopes**: Tab navigation must be confined to the topmost open
 *   modal. Stacking matters when a Popover opens inside a Dialog — Tab
 *   should stay within the Popover until it closes.
 *
 * - **Dismissible layers**: Escape (and outside-click, where wired) must
 *   only close the topmost layer. Pressing Escape inside a Popover-in-
 *   Dialog should close the Popover, not both.
 *
 * Both stacks live on the document via Symbol-keyed properties so SSR
 * processes don't share state across requests, and so the runtime is
 * resilient to module duplication.
 */
import { isBrowser, on } from "./_dom.ts"
import { getFocusable } from "./_focus.ts"

// --- focus scope stack -----------------------------------------------------

export interface FocusScopeOptions {
  initialFocus?: HTMLElement | null
}

interface FocusScopeEntry {
  root: HTMLElement
  handler: (e: KeyboardEvent) => void
  release?: () => void
}

interface FocusStackState {
  stack: FocusScopeEntry[]
  release: (() => void) | null
}

const FOCUS_STACK_KEY = Symbol.for("dokuma.focusStack")

interface DocumentWithFocusStack extends Document {
  [FOCUS_STACK_KEY]?: FocusStackState
}

const getFocusStack = (): FocusStackState => {
  const doc = document as DocumentWithFocusStack
  let state = doc[FOCUS_STACK_KEY]
  if (!state) {
    state = { stack: [], release: null }
    doc[FOCUS_STACK_KEY] = state
  }
  return state
}

const installTopFocusHandler = (state: FocusStackState): void => {
  state.release?.()
  state.release = null
  const top = state.stack[state.stack.length - 1]
  if (!top) return
  state.release = on(document, "keydown", top.handler as EventListener, true)
}

/**
 * Push a focus scope onto the stack. Tab and Shift+Tab loop within `root`
 * until the returned cleanup runs. While this scope is on top, no parent
 * scope's Tab handler fires. Cleanup re-installs the previous scope.
 *
 * Idempotent on the cleanup side — calling the returned function twice is
 * safe.
 */
export function pushFocusScope(root: HTMLElement, options: FocusScopeOptions = {}): () => void {
  if (!isBrowser()) return () => {}

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

  const entry: FocusScopeEntry = { root, handler }
  const state = getFocusStack()
  state.stack.push(entry)
  installTopFocusHandler(state)

  const initial = options.initialFocus ?? getFocusable(root)[0] ?? root
  initial.focus()

  let released = false
  return () => {
    if (released) return
    released = true
    const idx = state.stack.indexOf(entry)
    if (idx >= 0) state.stack.splice(idx, 1)
    installTopFocusHandler(state)
  }
}

// --- dismissible layer stack -----------------------------------------------

interface DismissibleEntry {
  onDismiss: () => void
}

interface DismissStackState {
  stack: DismissibleEntry[]
  release: (() => void) | null
}

const DISMISS_STACK_KEY = Symbol.for("dokuma.dismissStack")

interface DocumentWithDismissStack extends Document {
  [DISMISS_STACK_KEY]?: DismissStackState
}

const getDismissStack = (): DismissStackState => {
  const doc = document as DocumentWithDismissStack
  let state = doc[DISMISS_STACK_KEY]
  if (!state) {
    state = { stack: [], release: null }
    doc[DISMISS_STACK_KEY] = state
  }
  return state
}

const installDismissHandler = (state: DismissStackState): void => {
  state.release?.()
  state.release = null
  if (!state.stack.length) return
  const handler = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return
    const top = state.stack[state.stack.length - 1]
    if (!top) return
    event.preventDefault()
    top.onDismiss()
  }
  state.release = on(document, "keydown", handler as EventListener, true)
}

/**
 * Push a dismissible layer. Escape calls `onDismiss` only while this entry
 * is at the top of the stack. Returns a cleanup; calling it pops the entry
 * and re-installs the previous layer's handler.
 *
 * Idempotent on the cleanup side.
 */
export function pushDismissibleLayer(onDismiss: () => void): () => void {
  if (!isBrowser()) return () => {}

  const entry: DismissibleEntry = { onDismiss }
  const state = getDismissStack()
  state.stack.push(entry)
  installDismissHandler(state)

  let released = false
  return () => {
    if (released) return
    released = true
    const idx = state.stack.indexOf(entry)
    if (idx >= 0) state.stack.splice(idx, 1)
    installDismissHandler(state)
  }
}
