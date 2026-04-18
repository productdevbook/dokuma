import { on } from "../_dom.ts"
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift as shiftMiddleware,
} from "../_floating/index.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer } from "../_layers.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface SelectOptions {
  defaultValue?: string | null
  value?: () => string | null
  onValueChange?: (value: string | null) => void

  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void

  /** Form field name — when set, a hidden input is emitted. */
  name?: string
  disabled?: () => boolean
  /** Default `true`. Close popup after selection. */
  closeOnSelect?: boolean
  /** Default `true`. Arrow nav wraps. */
  loop?: boolean
  /** Default `"bottom-start"`. */
  placement?: Placement
  /** Gap between trigger and popup. Default `4`. */
  sideOffset?: number
  /** Default `8`. Padding for flip/shift collision detection. */
  collisionPadding?: number
}

export interface SelectRegisterItemOptions {
  disabled?: () => boolean
  /** Display label. Used for type-ahead + current selection text. Defaults to value. */
  label?: string
  /** Sort key override — by default items are kept in registration order. */
  index?: number
}

export interface SelectItemHandle {
  value: string
  itemId: string
  unregister: () => void
}

export interface SelectTriggerProps {
  type: "button"
  role: "combobox"
  id: string
  "aria-haspopup": "listbox"
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "aria-activedescendant"?: string
  disabled?: boolean
  "data-state": "open" | "closed"
  "data-placeholder"?: ""
}

export interface SelectPopupProps {
  role: "listbox"
  id: string
  tabIndex: -1
  "aria-activedescendant"?: string
  "data-state": "open" | "closed"
}

export interface SelectItemProps {
  role: "option"
  id: string
  "aria-selected": "true" | "false"
  "aria-disabled"?: boolean
  "data-highlighted"?: ""
  "data-disabled"?: ""
  "data-state": "checked" | "unchecked"
}

export interface SelectHiddenInputProps {
  type: "hidden"
  name: string
  value: string
}

export interface Select {
  open: Signal<boolean>
  value: Signal<string | null>
  highlighted: Signal<string | null>
  triggerId: string
  popupId: string

  isDisabled: () => boolean
  show: () => void
  hide: () => void
  toggle: () => void
  registerItem: (value: string, opts?: SelectRegisterItemOptions) => SelectItemHandle
  labelFor: (value: string) => string
  /** The displayed text for the current value, or empty string (placeholder). */
  displayValue: () => string

  select: (value: string) => void
  setHighlighted: (value: string | null) => void
  highlightNext: () => void
  highlightPrevious: () => void
  highlightFirst: () => void
  highlightLast: () => void
  /** Type-ahead: advance highlight to the next item whose label starts with `char`. */
  typeAhead: (char: string) => void

  getTriggerProps: () => SelectTriggerProps
  getPopupProps: () => SelectPopupProps
  getItemProps: (value: string) => SelectItemProps
  getHiddenInputProps: () => SelectHiddenInputProps | null

  /** Imperative DOM wiring (trigger, popup). Handles positioning + keyboard + dismiss. */
  mount: (els: { trigger: HTMLElement; popup: HTMLElement }) => Unsubscribe
}

interface InternalItem {
  value: string
  label: string
  id: string
  index: number
  disabled?: () => boolean
  el?: HTMLElement
}

export function createSelect(options: SelectOptions = {}): Select {
  const triggerId = createId("select-trigger")
  const popupId = createId("select-popup")
  const placement = options.placement ?? "bottom-start"
  const sideOffset = options.sideOffset ?? 4
  const collisionPadding = options.collisionPadding ?? 8
  const loop = options.loop ?? true
  const closeOnSelect = options.closeOnSelect ?? true

  const isControlledOpen = typeof options.open === "function"
  const internalOpen = createSignal(options.defaultOpen ?? false)
  const readOpen = (): boolean =>
    isControlledOpen ? (options.open as () => boolean)() : internalOpen.get()
  const openSubs = new Set<(v: boolean) => void>()
  const open: Signal<boolean> = {
    get: readOpen,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (p: boolean) => boolean)(readOpen()) : next
      if (resolved === readOpen()) return
      if (!isControlledOpen) internalOpen.set(resolved)
      options.onOpenChange?.(resolved)
      for (const fn of openSubs) fn(resolved)
    },
    subscribe: (fn) => {
      openSubs.add(fn)
      return () => openSubs.delete(fn)
    },
  }

  const isControlledValue = typeof options.value === "function"
  const internalValue = createSignal<string | null>(options.defaultValue ?? null)
  const readValue = (): string | null =>
    isControlledValue ? (options.value as () => string | null)() : internalValue.get()
  const valueSubs = new Set<(v: string | null) => void>()
  const value: Signal<string | null> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (p: string | null) => string | null)(readValue())
          : next
      if (resolved === readValue()) return
      if (!isControlledValue) internalValue.set(resolved)
      options.onValueChange?.(resolved)
      for (const fn of valueSubs) fn(resolved)
    },
    subscribe: (fn) => {
      valueSubs.add(fn)
      return () => valueSubs.delete(fn)
    },
  }

  const highlighted = createSignal<string | null>(null)

  const items: InternalItem[] = []
  let nextItemIndex = 0

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const show = (): void => {
    if (isDisabled()) return
    open.set(true)
    // Ensure something is highlighted when opening.
    if (!highlighted.get()) {
      const current = readValue()
      if (current && items.some((it) => it.value === current)) highlighted.set(current)
      else {
        const first = getEnabledItems()[0]
        if (first) highlighted.set(first.value)
      }
    }
  }
  const hide = (): void => {
    open.set(false)
  }
  const toggle = (): void => {
    if (readOpen()) hide()
    else show()
  }

  const getItem = (val: string): InternalItem | undefined => items.find((it) => it.value === val)

  const labelFor = (val: string): string => getItem(val)?.label ?? val

  const displayValue = (): string => {
    const v = readValue()
    if (v == null) return ""
    return labelFor(v)
  }

  const sortedItems = (): InternalItem[] => items.slice().sort((a, b) => a.index - b.index)

  const isItemDisabled = (it: InternalItem): boolean => it.disabled?.() ?? false
  const getEnabledItems = (): InternalItem[] => sortedItems().filter((it) => !isItemDisabled(it))

  const setHighlighted = (val: string | null): void => {
    if (val === highlighted.get()) return
    if (val !== null && !getItem(val)) return
    highlighted.set(val)
  }

  const shiftHighlight = (dir: 1 | -1): void => {
    const enabled = getEnabledItems()
    if (enabled.length === 0) return
    const current = highlighted.get()
    const idx = enabled.findIndex((it) => it.value === current)
    let next: number
    if (idx < 0) next = dir === 1 ? 0 : enabled.length - 1
    else {
      next = idx + dir
      if (next < 0) next = loop ? enabled.length - 1 : 0
      if (next >= enabled.length) next = loop ? 0 : enabled.length - 1
    }
    highlighted.set(enabled[next].value)
    enabled[next].el?.scrollIntoView({ block: "nearest" })
  }

  const highlightNext = (): void => shiftHighlight(1)
  const highlightPrevious = (): void => shiftHighlight(-1)
  const highlightFirst = (): void => {
    const first = getEnabledItems()[0]
    if (first) {
      highlighted.set(first.value)
      first.el?.scrollIntoView({ block: "nearest" })
    }
  }
  const highlightLast = (): void => {
    const list = getEnabledItems()
    const last = list[list.length - 1]
    if (last) {
      highlighted.set(last.value)
      last.el?.scrollIntoView({ block: "nearest" })
    }
  }

  const typeAhead = (char: string): void => {
    const lower = char.toLowerCase()
    const enabled = getEnabledItems()
    if (enabled.length === 0) return
    const current = highlighted.get()
    const startIdx = current ? enabled.findIndex((it) => it.value === current) : -1
    for (let i = 1; i <= enabled.length; i++) {
      const idx = (startIdx + i + enabled.length) % enabled.length
      if (enabled[idx].label.toLowerCase().startsWith(lower)) {
        highlighted.set(enabled[idx].value)
        enabled[idx].el?.scrollIntoView({ block: "nearest" })
        return
      }
    }
  }

  const select = (val: string): void => {
    const it = getItem(val)
    if (!it || isItemDisabled(it)) return
    value.set(val)
    if (closeOnSelect) hide()
  }

  const registerItem: Select["registerItem"] = (itemValue, opts = {}) => {
    const itemId = createId("select-item")
    const internal: InternalItem = {
      value: itemValue,
      label: opts.label ?? itemValue,
      id: itemId,
      index: opts.index ?? nextItemIndex++,
      disabled: opts.disabled,
    }
    items.push(internal)
    return {
      value: itemValue,
      itemId,
      unregister: () => {
        const idx = items.indexOf(internal)
        if (idx >= 0) items.splice(idx, 1)
        if (highlighted.get() === itemValue) highlighted.set(null)
      },
    }
  }

  const getTriggerProps = (): SelectTriggerProps => {
    const v = readValue()
    const props: SelectTriggerProps = {
      type: "button",
      role: "combobox",
      id: triggerId,
      "aria-haspopup": "listbox",
      "aria-expanded": readOpen() ? "true" : "false",
      "aria-controls": popupId,
      "data-state": readOpen() ? "open" : "closed",
    }
    if (readOpen()) {
      const h = highlighted.get()
      if (h) props["aria-activedescendant"] = getItem(h)?.id
    }
    if (isDisabled()) props.disabled = true
    if (v == null) props["data-placeholder"] = ""
    return props
  }

  const getPopupProps = (): SelectPopupProps => {
    const props: SelectPopupProps = {
      role: "listbox",
      id: popupId,
      tabIndex: -1,
      "data-state": readOpen() ? "open" : "closed",
    }
    const h = highlighted.get()
    if (h) props["aria-activedescendant"] = getItem(h)?.id
    return props
  }

  const getItemProps = (val: string): SelectItemProps => {
    const it = getItem(val)
    const selected = readValue() === val
    const isHigh = highlighted.get() === val
    const disabled = it ? isItemDisabled(it) : false
    const props: SelectItemProps = {
      role: "option",
      id: it?.id ?? `${popupId}-missing`,
      "aria-selected": selected ? "true" : "false",
      "data-state": selected ? "checked" : "unchecked",
    }
    if (isHigh) props["data-highlighted"] = ""
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = ""
    }
    return props
  }

  const getHiddenInputProps = (): SelectHiddenInputProps | null => {
    if (!options.name) return null
    return { type: "hidden", name: options.name, value: readValue() ?? "" }
  }

  const mount: Select["mount"] = (els) => {
    const { trigger, popup } = els
    trigger.id ||= triggerId
    popup.id ||= popupId

    const applyTriggerAttrs = (): void => {
      const o = readOpen()
      trigger.setAttribute("role", "combobox")
      trigger.setAttribute("aria-haspopup", "listbox")
      trigger.setAttribute("aria-expanded", o ? "true" : "false")
      trigger.setAttribute("aria-controls", popup.id)
      trigger.setAttribute("data-state", o ? "open" : "closed")
      const h = highlighted.get()
      if (o && h) {
        const item = getItem(h)
        if (item) trigger.setAttribute("aria-activedescendant", item.id)
        else trigger.removeAttribute("aria-activedescendant")
      } else {
        trigger.removeAttribute("aria-activedescendant")
      }
      if (isDisabled()) (trigger as HTMLButtonElement).disabled = true
      else (trigger as HTMLButtonElement).disabled = false
      if (readValue() == null) trigger.setAttribute("data-placeholder", "")
      else trigger.removeAttribute("data-placeholder")
    }

    const applyPopupAttrs = (): void => {
      popup.setAttribute("role", "listbox")
      popup.setAttribute("tabindex", "-1")
      popup.setAttribute("data-state", readOpen() ? "open" : "closed")
      const h = highlighted.get()
      if (h) {
        const item = getItem(h)
        if (item) popup.setAttribute("aria-activedescendant", item.id)
      } else {
        popup.removeAttribute("aria-activedescendant")
      }
    }

    const applyItemAttrs = (): void => {
      const v = readValue()
      const h = highlighted.get()
      for (const it of items) {
        if (!it.el) continue
        it.el.setAttribute("role", "option")
        it.el.id = it.id
        const selected = v === it.value
        it.el.setAttribute("aria-selected", selected ? "true" : "false")
        it.el.setAttribute("data-state", selected ? "checked" : "unchecked")
        if (h === it.value) it.el.setAttribute("data-highlighted", "")
        else it.el.removeAttribute("data-highlighted")
        if (isItemDisabled(it)) {
          it.el.setAttribute("aria-disabled", "true")
          it.el.setAttribute("data-disabled", "")
        } else {
          it.el.removeAttribute("aria-disabled")
          it.el.removeAttribute("data-disabled")
        }
      }
    }

    // --- popup auto-discover: child elements with data-value="<value>" ---
    const scanItems = (): void => {
      const nodes = popup.querySelectorAll<HTMLElement>("[data-value]")
      for (const node of Array.from(nodes)) {
        const v = node.dataset.value
        if (!v) continue
        const item = getItem(v)
        if (!item) continue
        item.el = node
        node.id = item.id
        node.setAttribute("role", "option")
      }
      applyItemAttrs()
    }

    // --- click delegation on popup ---
    const offPopupClick = on(popup, "click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-value]")
      if (!target) return
      const v = target.dataset.value
      if (v) select(v)
    })
    const offPopupMouseMove = on(popup, "pointermove", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-value]")
      if (!target) return
      const v = target.dataset.value
      if (v) setHighlighted(v)
    })

    // --- trigger interactions ---
    const offTriggerClick = on(trigger, "click", () => {
      toggle()
    })
    const offTriggerKeyDown = on(trigger, "keydown", (event) => {
      if (isDisabled()) return
      const ke = event as KeyboardEvent
      if (ke.key === "ArrowDown" || ke.key === "ArrowUp" || ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault()
        if (!readOpen()) show()
        else if (ke.key === "Enter" || ke.key === " ") {
          const h = highlighted.get()
          if (h) select(h)
        } else if (ke.key === "ArrowDown") highlightNext()
        else if (ke.key === "ArrowUp") highlightPrevious()
      } else if (ke.key.length === 1) {
        if (!readOpen()) show()
        typeAhead(ke.key)
      }
    })

    // --- popup keyboard (when focused) ---
    const offPopupKeyDown = on(popup, "keydown", (event) => {
      const ke = event as KeyboardEvent
      if (ke.key === "ArrowDown") {
        ke.preventDefault()
        highlightNext()
      } else if (ke.key === "ArrowUp") {
        ke.preventDefault()
        highlightPrevious()
      } else if (ke.key === "Home") {
        ke.preventDefault()
        highlightFirst()
      } else if (ke.key === "End") {
        ke.preventDefault()
        highlightLast()
      } else if (ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault()
        const h = highlighted.get()
        if (h) select(h)
      } else if (ke.key === "Escape") {
        ke.preventDefault()
        hide()
        trigger.focus()
      } else if (ke.key.length === 1) {
        typeAhead(ke.key)
      }
    })

    // --- floating position + dismiss ---
    let cleanupAuto: (() => void) | null = null
    let cleanupLayer: (() => void) | null = null

    const updatePosition = async (): Promise<void> => {
      if (!readOpen()) return
      const result = await computePosition(trigger, popup, {
        placement,
        middleware: [
          offset(sideOffset),
          flip({ padding: collisionPadding }),
          shiftMiddleware({ padding: collisionPadding }),
        ],
      })
      popup.style.position = "absolute"
      popup.style.left = `${result.x}px`
      popup.style.top = `${result.y}px`
      popup.setAttribute("data-placement", result.placement)
    }

    const handleOpenChange = (o: boolean): void => {
      applyTriggerAttrs()
      applyPopupAttrs()
      if (o) {
        scanItems()
        popup.style.display = ""
        cleanupAuto = autoUpdate(trigger, popup, () => {
          void updatePosition()
        })
        cleanupLayer = pushDismissibleLayer(() => {
          hide()
          trigger.focus()
        })
        // Focus popup for keyboard.
        popup.focus({ preventScroll: true })
      } else {
        popup.style.display = "none"
        cleanupAuto?.()
        cleanupAuto = null
        cleanupLayer?.()
        cleanupLayer = null
      }
    }

    // Initial state.
    applyTriggerAttrs()
    applyPopupAttrs()
    scanItems()
    if (readOpen()) handleOpenChange(true)
    else popup.style.display = "none"

    const unOpen = open.subscribe(handleOpenChange)
    const unValue = value.subscribe(() => {
      applyTriggerAttrs()
      applyItemAttrs()
    })
    const unHighlight = highlighted.subscribe(() => {
      applyTriggerAttrs()
      applyPopupAttrs()
      applyItemAttrs()
    })

    return () => {
      offPopupClick()
      offPopupMouseMove()
      offTriggerClick()
      offTriggerKeyDown()
      offPopupKeyDown()
      cleanupAuto?.()
      cleanupLayer?.()
      unOpen()
      unValue()
      unHighlight()
    }
  }

  return {
    open,
    value,
    highlighted,
    triggerId,
    popupId,
    isDisabled,
    show,
    hide,
    toggle,
    registerItem,
    labelFor,
    displayValue,
    select,
    setHighlighted,
    highlightNext,
    highlightPrevious,
    highlightFirst,
    highlightLast,
    typeAhead,
    getTriggerProps,
    getPopupProps,
    getItemProps,
    getHiddenInputProps,
    mount,
  }
}
