import { on } from "../_dom.ts"
import { createSignal, type Signal } from "../_signal.ts"

export interface ButtonOptions {
  /** Default `false`. Prevents activation (click, Enter/Space) while set. */
  disabled?: boolean | (() => boolean)
  /** When `true`, the element receives `aria-disabled` but remains in tab order. */
  focusableWhenDisabled?: boolean
  /**
   * Default `true`. Set `false` when rendering a non-`<button>` element
   * (e.g. `<div role="button">`). Adds `role="button"` and keyboard
   * activation (Enter + Space) when disabled=false.
   */
  nativeButton?: boolean
  /**
   * Default `false`. When `true`, Space activation happens on `keydown`
   * instead of `keyup` (matches composite widgets like Toolbar, Menubar).
   */
  composite?: boolean
  /** Tabindex applied when the element is focusable. Default `0`. */
  tabIndex?: number
  onClick?: (event: Event) => void
}

export interface ButtonRootProps {
  type?: "button"
  role?: "button"
  disabled?: boolean
  "aria-disabled"?: true
  tabIndex?: number
  "data-disabled"?: ""
}

export interface Button {
  disabled: Signal<boolean>
  getRootProps: () => ButtonRootProps
  /** Imperative DOM wiring. Returns cleanup. */
  mount: (el: HTMLElement) => () => void
}

function isLinkElement(el: Element | null): el is HTMLAnchorElement {
  return !!el && el.tagName === "A" && !!(el as HTMLAnchorElement).href
}

function isButtonElement(el: Element | null): el is HTMLButtonElement {
  return !!el && el.tagName === "BUTTON"
}

/**
 * Cross-tag button behavior. Handles:
 *  - disabled / focusableWhenDisabled gating for click + keydown + pointerdown
 *  - Enter + Space activation on non-native buttons
 *  - Space-on-keydown when part of a composite widget (Toolbar, Menubar)
 *  - aria-disabled + removed native `disabled` when focusable-while-disabled
 */
export function createButton(options: ButtonOptions = {}): Button {
  const nativeButton = options.nativeButton ?? true
  const focusableWhenDisabled = options.focusableWhenDisabled ?? false
  const composite = options.composite ?? false
  const tabIndex = options.tabIndex ?? 0

  const isDisabledFn = typeof options.disabled === "function"
  const disabledSignal = createSignal(
    typeof options.disabled === "boolean" ? options.disabled : false,
  )
  const readDisabled = (): boolean =>
    isDisabledFn ? (options.disabled as () => boolean)() : (disabledSignal.get() ?? false)

  const getRootProps = (): ButtonRootProps => {
    const disabled = readDisabled()
    const props: ButtonRootProps = {}

    if (nativeButton) {
      props.type = "button"
      if (disabled && !focusableWhenDisabled) props.disabled = true
    } else {
      props.role = "button"
      props.tabIndex = disabled && !focusableWhenDisabled ? -1 : tabIndex
    }

    if (disabled) {
      if (focusableWhenDisabled) props["aria-disabled"] = true
      props["data-disabled"] = ""
    }

    return props
  }

  const mount = (el: HTMLElement): (() => void) => {
    const applyAttrs = (): void => {
      const disabled = readDisabled()

      if (nativeButton) {
        if (disabled && !focusableWhenDisabled) {
          ;(el as HTMLButtonElement).disabled = true
        } else if (isButtonElement(el)) {
          el.disabled = false
        }
      } else {
        el.setAttribute("role", "button")
        el.tabIndex = disabled && !focusableWhenDisabled ? -1 : tabIndex
      }

      if (disabled) {
        el.setAttribute("data-disabled", "")
        if (focusableWhenDisabled) el.setAttribute("aria-disabled", "true")
        else el.removeAttribute("aria-disabled")
      } else {
        el.removeAttribute("data-disabled")
        el.removeAttribute("aria-disabled")
      }
    }

    const offClick = on(el, "click", (event) => {
      if (readDisabled()) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      options.onClick?.(event)
    })

    const offPointerDown = on(el, "pointerdown", (event) => {
      if (readDisabled()) {
        event.preventDefault()
      }
    })

    const offKeyDown = on(el, "keydown", (event) => {
      if (readDisabled()) return
      const ke = event as KeyboardEvent
      const isEnter = ke.key === "Enter"
      const isSpace = ke.key === " " || ke.key === "Spacebar"

      if (!nativeButton && !isLinkElement(el)) {
        if (isEnter) {
          ke.preventDefault()
          ;(el as HTMLElement).click()
          return
        }
        if (isSpace && composite) {
          ke.preventDefault()
          ;(el as HTMLElement).click()
        } else if (isSpace) {
          // Default: prevent page scroll; activation happens on keyup (native pattern).
          ke.preventDefault()
        }
      } else if (composite && isSpace) {
        // Native <button> inside composite: fire on keydown to match native
        // behavior where Space activates on keydown.
        ke.preventDefault()
        ;(el as HTMLElement).click()
      }
    })

    const offKeyUp = on(el, "keyup", (event) => {
      if (readDisabled()) return
      const ke = event as KeyboardEvent
      const isSpace = ke.key === " " || ke.key === "Spacebar"

      if (!nativeButton && !composite && isSpace && !isLinkElement(el)) {
        ke.preventDefault()
        ;(el as HTMLElement).click()
      }
    })

    applyAttrs()
    const unsubscribe = isDisabledFn ? () => {} : disabledSignal.subscribe(applyAttrs)

    return () => {
      offClick()
      offPointerDown()
      offKeyDown()
      offKeyUp()
      unsubscribe()
    }
  }

  return {
    disabled: disabledSignal,
    getRootProps,
    mount,
  }
}
