import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface ToggleOptions {
  defaultPressed?: boolean
  /** Controlled pressed getter. */
  pressed?: () => boolean
  onPressedChange?: (pressed: boolean) => void
  disabled?: () => boolean
}

export interface ToggleRootProps {
  type: "button"
  id: string
  "aria-pressed": "true" | "false"
  "aria-disabled"?: boolean
  "data-state": "on" | "off"
  "data-disabled"?: boolean
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface Toggle {
  pressed: Signal<boolean>
  rootId: string
  isDisabled: () => boolean
  toggle: () => void
  press: () => void
  unpress: () => void
  getRootProps: () => ToggleRootProps
  mount: (root: HTMLElement) => Unsubscribe
  notify: () => void
}

export function createToggle(options: ToggleOptions = {}): Toggle {
  const rootId = createId("dokuma-toggle")
  const internal = createSignal(options.defaultPressed ?? false)
  const isControlled = typeof options.pressed === "function"
  const subscribers = new Set<(v: boolean) => void>()

  const readPressed = (): boolean =>
    isControlled ? (options.pressed as () => boolean)() : internal.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const pressed: Signal<boolean> = {
    get: readPressed,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: boolean) => boolean)(readPressed()) : next
      if (resolved === readPressed()) return
      if (!isControlled) internal.set(resolved)
      options.onPressedChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const toggle = (): void => {
    if (isDisabled()) return
    pressed.set(!readPressed())
  }
  const press = (): void => {
    if (isDisabled()) return
    pressed.set(true)
  }
  const unpress = (): void => {
    if (isDisabled()) return
    pressed.set(false)
  }

  const notify = (): void => {
    const v = readPressed()
    for (const fn of subscribers) fn(v)
  }

  const handleClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    toggle()
  }

  const getRootProps = (): ToggleRootProps => {
    const isOn = readPressed()
    const disabled = isDisabled()
    const props: ToggleRootProps = {
      type: "button",
      id: rootId,
      "aria-pressed": isOn ? "true" : "false",
      "data-state": isOn ? "on" : "off",
      onClick: handleClick,
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    return props
  }

  const mount = (root: HTMLElement): Unsubscribe => {
    const apply = (): void => {
      const isOn = readPressed()
      const disabled = isDisabled()
      root.setAttribute("type", "button")
      root.id = rootId
      root.setAttribute("aria-pressed", isOn ? "true" : "false")
      root.setAttribute("data-state", isOn ? "on" : "off")
      if (disabled) {
        root.setAttribute("aria-disabled", "true")
        root.setAttribute("data-disabled", "")
      } else {
        root.removeAttribute("aria-disabled")
        root.removeAttribute("data-disabled")
      }
    }

    apply()
    root.addEventListener("click", handleClick as EventListener)
    const unsub = pressed.subscribe(apply)

    return () => {
      root.removeEventListener("click", handleClick as EventListener)
      unsub()
    }
  }

  return {
    pressed,
    rootId,
    isDisabled,
    toggle,
    press,
    unpress,
    getRootProps,
    mount,
    notify,
  }
}
