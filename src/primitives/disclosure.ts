import { applyAttrs, type AriaProps } from "../_aria.ts"
import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface DisclosureOptions {
  /** Initial open state for uncontrolled mode. Default: false. */
  defaultOpen?: boolean
  /** Controlled open state. When provided, `open` is read from here on every read. */
  open?: () => boolean
  /** Called whenever open changes (controlled or uncontrolled). */
  onOpenChange?: (open: boolean) => void
  /** When true, trigger and panel are inert and don't toggle. */
  disabled?: () => boolean
  /** Override generated panel id. */
  panelId?: string
}

export interface DisclosureTriggerProps {
  type: "button"
  id: string
  "aria-expanded": boolean
  "aria-controls": string
  "aria-disabled"?: boolean
  "data-state": "open" | "closed"
  "data-disabled"?: boolean
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface DisclosurePanelProps {
  id: string
  hidden: boolean
  "data-state": "open" | "closed"
}

export interface Disclosure {
  /** Reactive open state. */
  open: Signal<boolean>
  /** Whether the disclosure is disabled (computed each call). */
  isDisabled: () => boolean
  /** Trigger element id (assigned to the button). */
  triggerId: string
  /** Panel element id. */
  panelId: string
  /** Toggle open. No-op when disabled. */
  toggle: () => void
  /** Set open to true. No-op when disabled. */
  show: () => void
  /** Set open to false. No-op when disabled. */
  hide: () => void
  /** Computed props to spread on the trigger element/component. */
  getTriggerProps: () => DisclosureTriggerProps
  /** Computed props to spread on the panel element/component. */
  getPanelProps: () => DisclosurePanelProps
  /** Imperatively wire DOM elements. Returns cleanup. Browser-only. */
  mount: (els: { trigger: HTMLElement; panel: HTMLElement }) => Unsubscribe
}

export function createDisclosure(options: DisclosureOptions = {}): Disclosure {
  const triggerId = createId("dokuma-disclosure-trigger")
  const panelId = options.panelId ?? createId("dokuma-disclosure-panel")

  const internal = createSignal(options.defaultOpen ?? false)
  const isControlled = typeof options.open === "function"

  const readOpen = (): boolean =>
    isControlled ? (options.open as () => boolean)() : internal.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const open: Signal<boolean> = {
    get: readOpen,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: boolean) => boolean)(readOpen()) : next
      if (resolved === readOpen()) return
      if (!isControlled) internal.set(resolved)
      options.onOpenChange?.(resolved)
    },
    subscribe: internal.subscribe,
  }

  const toggle = (): void => {
    if (isDisabled()) return
    open.set(!readOpen())
  }

  const show = (): void => {
    if (isDisabled()) return
    open.set(true)
  }

  const hide = (): void => {
    if (isDisabled()) return
    open.set(false)
  }

  const handleClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    toggle()
  }

  const getTriggerProps = (): DisclosureTriggerProps => {
    const isOpen = readOpen()
    const disabled = isDisabled()
    const props: DisclosureTriggerProps = {
      type: "button",
      id: triggerId,
      "aria-expanded": isOpen,
      "aria-controls": panelId,
      "data-state": isOpen ? "open" : "closed",
      onClick: handleClick,
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    return props
  }

  const getPanelProps = (): DisclosurePanelProps => {
    const isOpen = readOpen()
    return {
      id: panelId,
      hidden: !isOpen,
      "data-state": isOpen ? "open" : "closed",
    }
  }

  const mount = (els: { trigger: HTMLElement; panel: HTMLElement }): Unsubscribe => {
    const apply = (): void => {
      const { onClick: _omit, ...triggerAttrs } = getTriggerProps()
      applyAttrs(els.trigger, triggerAttrs as unknown as AriaProps)
      applyAttrs(els.panel, getPanelProps() as unknown as AriaProps)
    }
    apply()
    els.trigger.addEventListener("click", handleClick)
    const unsub = open.subscribe(apply)
    return () => {
      els.trigger.removeEventListener("click", handleClick)
      unsub()
    }
  }

  return {
    open,
    isDisabled,
    triggerId,
    panelId,
    toggle,
    show,
    hide,
    getTriggerProps,
    getPanelProps,
    mount,
  }
}
