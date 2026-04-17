import { isBrowser, on } from "../_dom.ts"
import { DokumaError } from "../errors.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer } from "../_layers.ts"
import { autoPosition, type Align, type PositionOptions, type Side } from "../_position.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface ComboboxOptions extends PositionOptions {
  defaultValue?: string
  /** Controlled committed value getter. */
  value?: () => string
  onValueChange?: (value: string) => void
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void
  /** Default: case-insensitive substring on label. Return true to keep the item. */
  filter?: (label: string, query: string) => boolean
  /** Default `true`. After committing a selection, hide the listbox. */
  closeOnSelect?: boolean
  /** Default `false`. On blur, accept whatever is in the input as the value. */
  allowCustomValue?: boolean
  /**
   * Default `false`. After every keystroke, highlight the first filtered
   * item. Off by default — auto-highlight conflicts with screen-reader
   * announcements on every keystroke.
   */
  autoHighlightFirst?: boolean
  /** Default `true`. Wrap on Arrow nav past the ends. */
  loop?: boolean
  /** Form input name for the hidden submit input. */
  name?: string
  disabled?: () => boolean
}

export interface RegisterComboboxItemOptions {
  disabled?: () => boolean
  /** Display label. Falls back to value for filtering and display. */
  label?: string
}

export interface ComboboxItemHandle {
  value: string
  itemId: string
  unregister: () => void
}

export interface ComboboxInputProps {
  role: "combobox"
  id: string
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "aria-activedescendant"?: string
  "aria-autocomplete": "list"
  autocomplete: "off"
  value: string
  onInput: (event: { currentTarget: { value: string } }) => void
  onKeyDown: (event: { key: string; preventDefault?: () => void }) => void
  onBlur: () => void
  onClick: () => void
}

export interface ComboboxListboxProps {
  role: "listbox"
  id: string
  "data-state": "open" | "closed"
  "data-side": Side
  "data-align": Align
}

export interface ComboboxOptionProps {
  role: "option"
  id: string
  "aria-selected": "true" | "false"
  "aria-disabled"?: boolean
  "data-highlighted"?: boolean
  "data-disabled"?: boolean
  onClick: (event?: { preventDefault?: () => void }) => void
  onMouseEnter: () => void
}

export interface ComboboxTriggerProps {
  type: "button"
  tabIndex: -1
  "aria-hidden": true
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface ComboboxHiddenInputProps {
  type: "hidden"
  name: string
  value: string
}

export interface Combobox {
  open: Signal<boolean>
  value: Signal<string>
  query: Signal<string>
  highlighted: Signal<string>
  filteredItems: Signal<string[]>
  isEmpty: Signal<boolean>
  inputId: string
  listboxId: string
  isDisabled: () => boolean
  show: () => void
  hide: () => void
  toggle: () => void
  registerItem: (value: string, opts?: RegisterComboboxItemOptions) => ComboboxItemHandle
  hasItem: (value: string) => boolean
  isItemDisabled: (value: string) => boolean
  select: (value: string) => void
  setHighlighted: (value: string) => void
  /** Get the display label for a value (label || value || ""). */
  labelFor: (value: string) => string
  getInputProps: () => ComboboxInputProps
  getListboxProps: () => ComboboxListboxProps
  getOptionProps: (value: string) => ComboboxOptionProps
  getTriggerProps: () => ComboboxTriggerProps
  getHiddenInputProps: () => ComboboxHiddenInputProps | null
  mount: (els: {
    input: HTMLInputElement
    listbox: HTMLElement
    trigger?: HTMLElement
  }) => Unsubscribe
}

interface InternalItem {
  value: string
  itemId: string
  disabled?: () => boolean
  label?: string
}

const defaultFilter = (label: string, query: string): boolean => {
  if (!query) return true
  return label.toLowerCase().includes(query.toLowerCase())
}

export function createCombobox(options: ComboboxOptions = {}): Combobox {
  const inputId = createId("dokuma-combobox-input")
  const listboxId = createId("dokuma-combobox-listbox")
  const closeOnSelect = options.closeOnSelect ?? true
  const allowCustomValue = options.allowCustomValue ?? false
  const autoHighlightFirst = options.autoHighlightFirst ?? false
  const loop = options.loop ?? true
  const filterFn = options.filter ?? defaultFilter
  const isControlledOpen = typeof options.open === "function"
  const isControlledValue = typeof options.value === "function"

  const internalOpen = createSignal(options.defaultOpen ?? false)
  const internalValue = createSignal<string>(options.defaultValue ?? "")
  const items = new Map<string, InternalItem>()

  const openSubs = new Set<(v: boolean) => void>()
  const valueSubs = new Set<(v: string) => void>()

  const readOpen = (): boolean =>
    isControlledOpen ? (options.open as () => boolean)() : internalOpen.get()
  const readValue = (): string =>
    isControlledValue ? ((options.value as () => string)() ?? "") : internalValue.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false
  const labelFor = (v: string): string => items.get(v)?.label ?? v

  const open: Signal<boolean> = {
    get: readOpen,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: boolean) => boolean)(readOpen()) : next
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

  const value: Signal<string> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string) => string)(readValue()) : next
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

  // Display text shown in the input. Source of truth for getInputProps().value.
  let inputDisplayText = labelFor(readValue())
  const queryInternal = createSignal<string>("")
  const filteredInternal = createSignal<string[]>([])
  const isEmptyInternal = createSignal<boolean>(true)
  const highlightedInternal = createSignal<string>("")

  const recomputeFiltered = (): void => {
    const q = queryInternal.get()
    const list: string[] = []
    for (const it of items.values()) {
      const lab = it.label ?? it.value
      if (filterFn(lab, q)) list.push(it.value)
    }
    filteredInternal.set(list)
    isEmptyInternal.set(list.length === 0)
  }

  const setQuery = (q: string): void => {
    if (q === queryInternal.get()) return
    queryInternal.set(q)
    inputDisplayText = q
    recomputeFiltered()
    if (autoHighlightFirst) {
      const list = filteredInternal.get()
      highlightedInternal.set(list[0] ?? "")
    } else {
      highlightedInternal.set("")
    }
  }

  const isItemDisabled = (v: string): boolean => {
    if (isDisabled()) return true
    return items.get(v)?.disabled?.() ?? false
  }

  const hasItem = (v: string): boolean => items.has(v)

  const setHighlighted = (v: string): void => {
    if (v === highlightedInternal.get()) return
    highlightedInternal.set(v)
  }

  const show = (): void => {
    if (isDisabled()) return
    if (readOpen()) return
    open.set(true)
    // Reset highlight to the currently selected item if it exists in filtered.
    const cur = readValue()
    if (cur && filteredInternal.get().includes(cur)) {
      highlightedInternal.set(cur)
    } else {
      highlightedInternal.set("")
    }
  }

  const hide = (): void => {
    if (!readOpen()) return
    open.set(false)
    highlightedInternal.set("")
  }

  const toggle = (): void => (readOpen() ? hide() : show())

  const select = (v: string): void => {
    if (!hasItem(v)) {
      throw new DokumaError(
        `dokuma: combobox option "${v}" was not registered. Call registerItem first.`,
      )
    }
    if (isItemDisabled(v)) return
    value.set(v)
    inputDisplayText = labelFor(v)
    queryInternal.set("")
    recomputeFiltered()
    if (closeOnSelect) hide()
  }

  const registerItem = (v: string, opts: RegisterComboboxItemOptions = {}): ComboboxItemHandle => {
    const existing = items.get(v)
    if (existing) {
      existing.disabled = opts.disabled
      existing.label = opts.label
      recomputeFiltered()
      return {
        value: v,
        itemId: existing.itemId,
        unregister: () => unregisterItem(v),
      }
    }
    const item: InternalItem = {
      value: v,
      itemId: createId("dokuma-combobox-option"),
      disabled: opts.disabled,
      label: opts.label,
    }
    items.set(v, item)
    // Initial display text falls back to label of defaultValue once registered.
    if (v === readValue() && inputDisplayText === v && opts.label) {
      inputDisplayText = opts.label
    }
    recomputeFiltered()
    return {
      value: v,
      itemId: item.itemId,
      unregister: () => unregisterItem(v),
    }
  }

  const unregisterItem = (v: string): void => {
    items.delete(v)
    if (highlightedInternal.get() === v) highlightedInternal.set("")
    recomputeFiltered()
  }

  // ---- keyboard helpers ---------------------------------------------------

  const enabledFiltered = (): string[] => filteredInternal.get().filter((v) => !isItemDisabled(v))

  const focusFirst = (): void => {
    const list = enabledFiltered()
    if (list.length) highlightedInternal.set(list[0]!)
  }
  const focusLast = (): void => {
    const list = enabledFiltered()
    if (list.length) highlightedInternal.set(list[list.length - 1]!)
  }
  const focusNext = (): void => {
    const list = enabledFiltered()
    if (!list.length) return
    const cur = highlightedInternal.get()
    const idx = list.indexOf(cur)
    if (idx < 0) {
      highlightedInternal.set(list[0]!)
      return
    }
    if (idx === list.length - 1) {
      if (loop) highlightedInternal.set(list[0]!)
      return
    }
    highlightedInternal.set(list[idx + 1]!)
  }
  const focusPrev = (): void => {
    const list = enabledFiltered()
    if (!list.length) return
    const cur = highlightedInternal.get()
    const idx = list.indexOf(cur)
    if (idx < 0) {
      highlightedInternal.set(list[list.length - 1]!)
      return
    }
    if (idx === 0) {
      if (loop) highlightedInternal.set(list[list.length - 1]!)
      return
    }
    highlightedInternal.set(list[idx - 1]!)
  }

  const handleInputKeyDown = (event: { key: string; preventDefault?: () => void }): void => {
    if (isDisabled()) return
    const isOpen = readOpen()
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault?.()
        if (!isOpen) {
          show()
          if (!highlightedInternal.get()) focusFirst()
        } else {
          focusNext()
        }
        return
      case "ArrowUp":
        event.preventDefault?.()
        if (!isOpen) {
          show()
          if (!highlightedInternal.get()) focusLast()
        } else {
          focusPrev()
        }
        return
      case "Home":
        if (!isOpen) return
        event.preventDefault?.()
        focusFirst()
        return
      case "End":
        if (!isOpen) return
        event.preventDefault?.()
        focusLast()
        return
      case "Enter": {
        if (!isOpen) return
        const hi = highlightedInternal.get()
        if (hi && hasItem(hi)) {
          event.preventDefault?.()
          select(hi)
        } else if (allowCustomValue) {
          event.preventDefault?.()
          commitCustom()
        }
        return
      }
      case "Escape":
        if (isOpen) {
          event.preventDefault?.()
          revertInput()
          hide()
        }
        return
      case "Tab":
        // Allow default; blur handler will commit/revert.
        return
      default:
        // Printable keys: open if not already open. Actual filter happens in onInput.
        if (!isOpen && event.key.length === 1) show()
    }
  }

  const revertInput = (): void => {
    inputDisplayText = labelFor(readValue())
    queryInternal.set("")
    recomputeFiltered()
  }

  const commitCustom = (): void => {
    if (!allowCustomValue) return
    const text = inputDisplayText
    if (text === readValue()) return
    if (!isControlledValue) internalValue.set(text)
    options.onValueChange?.(text)
    for (const fn of valueSubs) fn(text)
    queryInternal.set("")
    recomputeFiltered()
    if (closeOnSelect) hide()
  }

  const handleInputBlur = (): void => {
    // Defer so click on a listbox option fires before blur-driven hide.
    queueMicrotask(() => {
      if (!readOpen()) return
      if (allowCustomValue && inputDisplayText !== labelFor(readValue())) {
        commitCustom()
      } else {
        revertInput()
      }
      hide()
    })
  }

  const handleInput = (event: { currentTarget: { value: string } }): void => {
    if (isDisabled()) return
    setQuery(event.currentTarget.value)
    if (!readOpen()) show()
  }

  const handleInputClick = (): void => {
    if (isDisabled()) return
    if (!readOpen()) show()
  }

  const handleTriggerClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    if (isDisabled()) return
    toggle()
  }

  // ---- prop getters -------------------------------------------------------

  const getInputProps = (): ComboboxInputProps => {
    const isOpen = readOpen()
    const hi = highlightedInternal.get()
    const props: ComboboxInputProps = {
      role: "combobox",
      id: inputId,
      "aria-expanded": isOpen ? "true" : "false",
      "aria-controls": listboxId,
      "aria-autocomplete": "list",
      autocomplete: "off",
      value: inputDisplayText,
      onInput: handleInput,
      onKeyDown: handleInputKeyDown,
      onBlur: handleInputBlur,
      onClick: handleInputClick,
    }
    if (hi) {
      const item = items.get(hi)
      if (item) props["aria-activedescendant"] = item.itemId
    }
    return props
  }

  let resolvedSide: Side = options.side ?? "bottom"
  let resolvedAlign: Align = options.align ?? "start"

  const getListboxProps = (): ComboboxListboxProps => ({
    role: "listbox",
    id: listboxId,
    "data-state": readOpen() ? "open" : "closed",
    "data-side": resolvedSide,
    "data-align": resolvedAlign,
  })

  const getOptionProps = (v: string): ComboboxOptionProps => {
    const item = items.get(v)
    if (!item) {
      throw new DokumaError(
        `dokuma: combobox option "${v}" was not registered. Call registerItem first.`,
      )
    }
    const isSelected = readValue() === v
    const isHi = highlightedInternal.get() === v
    const disabled = isItemDisabled(v)
    const props: ComboboxOptionProps = {
      role: "option",
      id: item.itemId,
      "aria-selected": isSelected ? "true" : "false",
      onClick: (event) => {
        event?.preventDefault?.()
        if (disabled) return
        select(v)
      },
      onMouseEnter: () => {
        if (disabled) return
        setHighlighted(v)
      },
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    if (isHi) props["data-highlighted"] = true
    return props
  }

  const getTriggerProps = (): ComboboxTriggerProps => ({
    type: "button",
    tabIndex: -1,
    "aria-hidden": true,
    onClick: handleTriggerClick,
  })

  const getHiddenInputProps = (): ComboboxHiddenInputProps | null => {
    if (!options.name) return null
    return {
      type: "hidden",
      name: options.name,
      value: readValue(),
    }
  }

  // ---- mount --------------------------------------------------------------

  const mount = (els: {
    input: HTMLInputElement
    listbox: HTMLElement
    trigger?: HTMLElement
  }): Unsubscribe => {
    const { input, listbox, trigger } = els
    let releasePosition: (() => void) | null = null
    let releaseDismiss: (() => void) | null = null
    let releaseOutside: (() => void) | null = null

    const apply = (): void => {
      const isOpen = readOpen()
      const hi = highlightedInternal.get()
      input.setAttribute("role", "combobox")
      input.id = inputId
      input.setAttribute("aria-expanded", isOpen ? "true" : "false")
      input.setAttribute("aria-controls", listboxId)
      input.setAttribute("aria-autocomplete", "list")
      input.autocomplete = "off"
      if (hi && items.has(hi)) {
        input.setAttribute("aria-activedescendant", items.get(hi)!.itemId)
      } else {
        input.removeAttribute("aria-activedescendant")
      }
      if (input.value !== inputDisplayText) input.value = inputDisplayText

      listbox.setAttribute("role", "listbox")
      listbox.id = listboxId
      listbox.setAttribute("data-state", isOpen ? "open" : "closed")
      listbox.setAttribute("data-side", resolvedSide)
      listbox.setAttribute("data-align", resolvedAlign)
    }

    const teardownOpenSideEffects = (): void => {
      releasePosition?.()
      releaseDismiss?.()
      releaseOutside?.()
      releasePosition = null
      releaseDismiss = null
      releaseOutside = null
    }

    const setupOpenSideEffects = (): void => {
      teardownOpenSideEffects()

      listbox.style.position = "fixed"
      listbox.style.top = "0"
      listbox.style.left = "0"

      releasePosition = autoPosition(
        input,
        listbox,
        (result) => {
          resolvedSide = result.side
          resolvedAlign = result.align
          listbox.style.transform = `translate3d(${result.x}px, ${result.y}px, 0)`
          listbox.setAttribute("data-side", result.side)
          listbox.setAttribute("data-align", result.align)
        },
        options,
      )

      releaseDismiss = pushDismissibleLayer(() => {
        revertInput()
        hide()
      })

      releaseOutside = on(document, "mousedown", (e) => {
        const target = e.target as Node
        if (input.contains(target)) return
        if (listbox.contains(target)) return
        if (trigger?.contains(target)) return
        // Outside click: commit if allowCustomValue, else revert, then hide.
        if (allowCustomValue && inputDisplayText !== labelFor(readValue())) commitCustom()
        else revertInput()
        hide()
      })
    }

    apply()
    if (isBrowser() && readOpen()) setupOpenSideEffects()

    const handleNativeInput = (e: Event): void => {
      handleInput({ currentTarget: { value: (e.currentTarget as HTMLInputElement).value } })
    }
    input.addEventListener("input", handleNativeInput)
    const handleNativeKeyDown = (e: Event): void => {
      const ke = e as KeyboardEvent
      handleInputKeyDown({ key: ke.key, preventDefault: () => ke.preventDefault() })
    }
    input.addEventListener("keydown", handleNativeKeyDown)
    input.addEventListener("blur", handleInputBlur)
    input.addEventListener("click", handleInputClick)
    const handleNativeTriggerClick = (e: Event): void =>
      handleTriggerClick({ preventDefault: () => e.preventDefault() })
    if (trigger) trigger.addEventListener("click", handleNativeTriggerClick)

    // Listbox click delegation: figure out which option was clicked.
    const handleListboxClick = (e: Event): void => {
      const target = e.target as HTMLElement
      for (const it of items.values()) {
        const optEl = document.getElementById(it.itemId)
        if (optEl && optEl.contains(target)) {
          if (!isItemDisabled(it.value)) select(it.value)
          return
        }
      }
    }
    listbox.addEventListener("click", handleListboxClick)

    const onOpenChange = (isOpen: boolean): void => {
      apply()
      if (isOpen) setupOpenSideEffects()
      else teardownOpenSideEffects()
    }
    const unsubOpen = open.subscribe(onOpenChange)
    const unsubVal = value.subscribe(apply)
    const unsubHi = highlightedInternal.subscribe(apply)
    const unsubFiltered = filteredInternal.subscribe(apply)
    const unsubQuery = queryInternal.subscribe(apply)

    let destroyed = false
    return () => {
      if (destroyed) return
      destroyed = true
      input.removeEventListener("input", handleNativeInput)
      input.removeEventListener("keydown", handleNativeKeyDown)
      input.removeEventListener("blur", handleInputBlur)
      input.removeEventListener("click", handleInputClick)
      listbox.removeEventListener("click", handleListboxClick)
      if (trigger) trigger.removeEventListener("click", handleNativeTriggerClick)
      unsubOpen()
      unsubVal()
      unsubHi()
      unsubFiltered()
      unsubQuery()
      teardownOpenSideEffects()
    }
  }

  // ---- exposed signals (read-only public) ---------------------------------

  const querySignal: Signal<string> = {
    get: queryInternal.get,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string) => string)(queryInternal.get()) : next
      setQuery(resolved)
    },
    subscribe: queryInternal.subscribe,
  }

  const highlightedSignal: Signal<string> = {
    get: highlightedInternal.get,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: string) => string)(highlightedInternal.get())
          : next
      setHighlighted(resolved)
    },
    subscribe: highlightedInternal.subscribe,
  }

  return {
    open,
    value,
    query: querySignal,
    highlighted: highlightedSignal,
    filteredItems: filteredInternal,
    isEmpty: isEmptyInternal,
    inputId,
    listboxId,
    isDisabled,
    show,
    hide,
    toggle,
    registerItem,
    hasItem,
    isItemDisabled,
    select,
    setHighlighted,
    labelFor,
    getInputProps,
    getListboxProps,
    getOptionProps,
    getTriggerProps,
    getHiddenInputProps,
    mount,
  }
}
