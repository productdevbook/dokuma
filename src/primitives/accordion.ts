import { applyAttrs, type AriaProps } from "../_aria.ts"
import { createId } from "../_id.ts"
import { rovingKeyDown, type KeyboardLikeEvent, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type AccordionType = "single" | "multiple"

export interface AccordionOptions {
  /** Selection mode. Locked at construction. Default `"single"`. */
  type?: AccordionType
  /** Initial open value(s) for uncontrolled mode. */
  defaultValue?: string | string[]
  /** Controlled value getter. When set, internal state is bypassed. */
  value?: () => string | string[]
  /** Fired on open-set change. */
  onValueChange?: (value: string | string[]) => void
  /** Single mode only — allow closing the open item. Default `false`. */
  collapsible?: boolean
  /** Root-level disable. */
  disabled?: () => boolean
  /** Default `"vertical"`. */
  orientation?: Orientation
}

export interface RegisterItemOptions {
  /** Per-item disable. Combined with root-level `disabled` via OR. */
  disabled?: () => boolean
}

export interface ItemHandle {
  value: string
  triggerId: string
  panelId: string
  unregister: () => void
}

export interface AccordionRootProps {
  role: "presentation"
  "data-orientation": Orientation
}

export interface AccordionItemProps {
  "data-state": "open" | "closed"
  "data-disabled"?: boolean
  "data-orientation": Orientation
}

export interface AccordionTriggerProps {
  type: "button"
  id: string
  "aria-expanded": boolean
  "aria-controls": string
  "aria-disabled"?: boolean
  "data-state": "open" | "closed"
  "data-disabled"?: boolean
  "data-orientation": Orientation
  onClick: (event?: { preventDefault?: () => void }) => void
  onKeyDown: (event: KeyboardLikeEvent) => void
}

export interface AccordionPanelProps {
  id: string
  role: "region"
  "aria-labelledby": string
  hidden: boolean
  "data-state": "open" | "closed"
  "data-orientation": Orientation
}

export interface Accordion {
  values: Signal<string[]>
  type: AccordionType
  orientation: Orientation
  isDisabled: () => boolean
  registerItem: (value: string, opts?: RegisterItemOptions) => ItemHandle
  isItemDisabled: (value: string) => boolean
  hasItem: (value: string) => boolean
  isOpen: (value: string) => boolean
  /** Notify subscribers without changing state. Used by adapters when controlled `value` prop changes externally. */
  notify: () => void
  open: (value: string) => void
  close: (value: string) => void
  toggle: (value: string) => void
  getRootProps: () => AccordionRootProps
  getItemProps: (value: string) => AccordionItemProps
  getTriggerProps: (value: string) => AccordionTriggerProps
  getPanelProps: (value: string) => AccordionPanelProps
  /**
   * Imperative DOM wiring. Auto-discovers `[data-dokuma-accordion-item="<value>"]`
   * children with `[data-dokuma-accordion-trigger]` and `[data-dokuma-accordion-panel]`
   * descendants. Returns cleanup.
   */
  mount: (root: HTMLElement) => Unsubscribe
}

interface InternalItem {
  value: string
  triggerId: string
  panelId: string
  disabled?: () => boolean
}

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? [...v] : [v]
}

function fromArray(type: AccordionType, arr: string[]): string | string[] {
  if (type === "single") return arr[0] ?? ""
  return [...arr]
}

export function createAccordion(options: AccordionOptions = {}): Accordion {
  const type: AccordionType = options.type ?? "single"
  const orientation: Orientation = options.orientation ?? "vertical"
  const collapsible = options.collapsible ?? false
  const isControlled = typeof options.value === "function"

  const internal = createSignal<string[]>(toArray(options.defaultValue))

  const items = new Map<string, InternalItem>()

  const readValues = (): string[] =>
    isControlled ? toArray((options.value as () => string | string[])()) : internal.get()

  const subscribers = new Set<(v: string[]) => void>()

  const values: Signal<string[]> = {
    get: readValues,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string[]) => string[])(readValues()) : next
      const prev = readValues()
      if (resolved.length === prev.length && resolved.every((v, i) => v === prev[i])) {
        return
      }
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(fromArray(type, resolved))
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const isItemDisabled = (value: string): boolean => {
    if (isDisabled()) return true
    const item = items.get(value)
    return item?.disabled?.() ?? false
  }

  const hasItem = (value: string): boolean => items.has(value)
  const isOpen = (value: string): boolean => readValues().includes(value)
  const notify = (): void => {
    const v = readValues()
    for (const fn of subscribers) fn(v)
  }

  const setOpen = (value: string, open: boolean): void => {
    if (isItemDisabled(value)) return
    const current = readValues()
    const has = current.includes(value)

    if (open && !has) {
      const next = type === "single" ? [value] : [...current, value]
      values.set(next)
      return
    }
    if (!open && has) {
      if (type === "single" && !collapsible && current.length === 1) return
      values.set(current.filter((v) => v !== value))
    }
  }

  const open = (value: string): void => setOpen(value, true)
  const close = (value: string): void => setOpen(value, false)
  const toggle = (value: string): void => setOpen(value, !isOpen(value))

  const registerItem = (value: string, opts: RegisterItemOptions = {}): ItemHandle => {
    const existing = items.get(value)
    if (existing) {
      existing.disabled = opts.disabled
      return {
        value,
        triggerId: existing.triggerId,
        panelId: existing.panelId,
        unregister: () => unregisterItem(value),
      }
    }
    const item: InternalItem = {
      value,
      triggerId: createId("dokuma-accordion-trigger"),
      panelId: createId("dokuma-accordion-panel"),
      disabled: opts.disabled,
    }
    items.set(value, item)
    return {
      value,
      triggerId: item.triggerId,
      panelId: item.panelId,
      unregister: () => unregisterItem(value),
    }
  }

  const unregisterItem = (value: string): void => {
    if (!items.has(value)) return
    items.delete(value)
    if (isOpen(value)) {
      values.set(readValues().filter((v) => v !== value))
    }
  }

  const requireItem = (value: string): InternalItem => {
    const item = items.get(value)
    if (!item) {
      throw new Error(
        `dokuma: accordion item "${value}" was not registered. Call registerItem first.`,
      )
    }
    return item
  }

  const orderedTriggers = (): HTMLElement[] => {
    const els: HTMLElement[] = []
    for (const item of items.values()) {
      const el = (
        typeof document !== "undefined" ? document.getElementById(item.triggerId) : null
      ) as HTMLElement | null
      if (el) els.push(el)
    }
    return els
  }

  const handleKeyDown = (event: KeyboardLikeEvent): void => {
    const current =
      typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
    const target = rovingKeyDown(orderedTriggers(), current, orientation, event)
    if (!target) return
    event.preventDefault?.()
    event.stopPropagation?.()
    target.focus()
  }

  const getRootProps = (): AccordionRootProps => ({
    role: "presentation",
    "data-orientation": orientation,
  })

  const getItemProps = (value: string): AccordionItemProps => {
    requireItem(value)
    const open = isOpen(value)
    const props: AccordionItemProps = {
      "data-state": open ? "open" : "closed",
      "data-orientation": orientation,
    }
    if (isItemDisabled(value)) props["data-disabled"] = true
    return props
  }

  const getTriggerProps = (value: string): AccordionTriggerProps => {
    const item = requireItem(value)
    const open = isOpen(value)
    const disabled = isItemDisabled(value)
    const props: AccordionTriggerProps = {
      type: "button",
      id: item.triggerId,
      "aria-expanded": open,
      "aria-controls": item.panelId,
      "data-state": open ? "open" : "closed",
      "data-orientation": orientation,
      onClick: (event) => {
        event?.preventDefault?.()
        toggle(value)
      },
      onKeyDown: handleKeyDown,
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    return props
  }

  const getPanelProps = (value: string): AccordionPanelProps => {
    const item = requireItem(value)
    const open = isOpen(value)
    return {
      id: item.panelId,
      role: "region",
      "aria-labelledby": item.triggerId,
      hidden: !open,
      "data-state": open ? "open" : "closed",
      "data-orientation": orientation,
    }
  }

  const mount = (root: HTMLElement): Unsubscribe => {
    const cleanups: Array<() => void> = []
    const triggerElByValue = new Map<string, HTMLElement>()
    const panelElByValue = new Map<string, HTMLElement>()

    const itemEls = root.querySelectorAll<HTMLElement>("[data-dokuma-accordion-item]")

    for (const itemEl of itemEls) {
      const value = itemEl.dataset.dokumaAccordionItem
      if (!value) continue
      const trigger = itemEl.querySelector<HTMLElement>("[data-dokuma-accordion-trigger]")
      const panel = itemEl.querySelector<HTMLElement>("[data-dokuma-accordion-panel]")
      if (!trigger || !panel) continue

      const handle = registerItem(value)
      trigger.id = handle.triggerId
      panel.id = handle.panelId
      triggerElByValue.set(value, trigger)
      panelElByValue.set(value, panel)

      const onClick = (e: Event): void => {
        e.preventDefault()
        toggle(value)
      }
      const onKeyDown = (e: KeyboardEvent): void => handleKeyDown(e)
      trigger.addEventListener("click", onClick)
      trigger.addEventListener("keydown", onKeyDown)
      cleanups.push(() => {
        trigger.removeEventListener("click", onClick)
        trigger.removeEventListener("keydown", onKeyDown)
      })
      void handle
    }

    const apply = (): void => {
      applyAttrs(root, getRootProps() as unknown as AriaProps)
      for (const itemEl of Array.from(itemEls)) {
        const value = itemEl.dataset.dokumaAccordionItem
        if (!value || !items.has(value)) continue
        applyAttrs(itemEl, getItemProps(value) as unknown as AriaProps)
        const triggerEl = triggerElByValue.get(value)
        const panelEl = panelElByValue.get(value)
        if (triggerEl) {
          const { onClick: _o, onKeyDown: _k, ...rest } = getTriggerProps(value)
          applyAttrs(triggerEl, rest as unknown as AriaProps)
        }
        if (panelEl) {
          applyAttrs(panelEl, getPanelProps(value) as unknown as AriaProps)
        }
      }
    }

    apply()
    const unsub = values.subscribe(apply)
    cleanups.push(unsub)

    return () => {
      for (const fn of cleanups) fn()
    }
  }

  return {
    values,
    type,
    orientation,
    isDisabled,
    registerItem,
    isItemDisabled,
    hasItem,
    isOpen,
    notify,
    open,
    close,
    toggle,
    getRootProps,
    getItemProps,
    getTriggerProps,
    getPanelProps,
    mount,
  }
}
