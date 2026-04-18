import { on } from "../_dom.ts"
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift,
} from "../_floating/index.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer } from "../_layers.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface AutocompleteOptions {
  /** Committed text value (accepts free text — the user can type anything). */
  defaultValue?: string
  value?: () => string
  onValueChange?: (value: string) => void

  /** Input query (what the user is typing) — defaults to the committed value. */
  defaultQuery?: string
  query?: () => string
  onQueryChange?: (query: string) => void

  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void

  /** Filter predicate. Default: case-insensitive substring. */
  filter?: (label: string, query: string) => boolean

  /** Default `false`. Inline-autocomplete: auto-select & highlight the first match. */
  inlineAutocomplete?: boolean

  /** Default `true`. Close after committing a selection. */
  closeOnSelect?: boolean
  /** Default `true`. Arrow nav wraps. */
  loop?: boolean

  /** Form field name for the hidden submit input. */
  name?: string
  disabled?: () => boolean

  /** Floating placement. Default `"bottom-start"`. */
  placement?: Placement
  sideOffset?: number
  collisionPadding?: number
}

export interface AutocompleteRegisterItemOptions {
  disabled?: () => boolean
  label?: string
}

export interface AutocompleteItemHandle {
  value: string
  itemId: string
  unregister: () => void
}

export interface AutocompleteInputProps {
  role: "combobox"
  id: string
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "aria-activedescendant"?: string
  "aria-autocomplete": "list" | "both"
  autocomplete: "off"
  value: string
}

export interface AutocompleteListboxProps {
  role: "listbox"
  id: string
  "data-state": "open" | "closed"
}

export interface AutocompleteOptionProps {
  role: "option"
  id: string
  "aria-selected": "true" | "false"
  "aria-disabled"?: boolean
  "data-highlighted"?: ""
  "data-disabled"?: ""
  "data-state": "checked" | "unchecked"
}

export interface AutocompleteHiddenInputProps {
  type: "hidden"
  name: string
  value: string
}

export interface Autocomplete {
  open: Signal<boolean>
  /** Committed text value (free text allowed). */
  value: Signal<string>
  /** Current input query (what the user is typing). */
  query: Signal<string>
  /** Currently highlighted item value, or null. */
  highlighted: Signal<string | null>
  /** List of visible items after filtering (in order). */
  filteredItems: Signal<string[]>
  inputId: string
  listboxId: string

  show: () => void
  hide: () => void
  toggle: () => void
  registerItem: (value: string, opts?: AutocompleteRegisterItemOptions) => AutocompleteItemHandle
  select: (value: string) => void
  setHighlighted: (value: string | null) => void
  labelFor: (value: string) => string

  getInputProps: () => AutocompleteInputProps
  getListboxProps: () => AutocompleteListboxProps
  getOptionProps: (value: string) => AutocompleteOptionProps
  getHiddenInputProps: () => AutocompleteHiddenInputProps | null

  /** Imperative DOM wiring. Returns cleanup. */
  mount: (els: { input: HTMLInputElement; listbox: HTMLElement }) => Unsubscribe
}

interface InternalItem {
  value: string
  label: string
  id: string
  disabled?: () => boolean
  el?: HTMLElement
}

const defaultFilter = (label: string, q: string): boolean =>
  q === "" || label.toLowerCase().includes(q.toLowerCase())

export function createAutocomplete(options: AutocompleteOptions = {}): Autocomplete {
  const inputId = createId("autocomplete-input")
  const listboxId = createId("autocomplete-listbox")
  const loop = options.loop ?? true
  const closeOnSelect = options.closeOnSelect ?? true
  const inlineAutocomplete = options.inlineAutocomplete ?? false
  const filter = options.filter ?? defaultFilter
  const placement = options.placement ?? "bottom-start"
  const sideOffset = options.sideOffset ?? 4
  const collisionPadding = options.collisionPadding ?? 8

  const mkSignal = <T>(
    isControlled: boolean,
    read: () => T,
    write: (v: T) => void,
    onChange: ((v: T) => void) | undefined,
  ): Signal<T> => {
    const s = new Set<(v: T) => void>()
    return {
      get: read,
      set: (next) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(read()) : next
        if (Object.is(resolved, read())) return
        if (!isControlled) write(resolved)
        onChange?.(resolved)
        for (const fn of s) fn(resolved)
      },
      subscribe: (fn) => {
        s.add(fn)
        return () => s.delete(fn)
      },
    }
  }

  const isOpenControlled = typeof options.open === "function"
  const internalOpen = createSignal(options.defaultOpen ?? false)
  const open = mkSignal<boolean>(
    isOpenControlled,
    () => (isOpenControlled ? (options.open as () => boolean)() : internalOpen.get()),
    (v) => internalOpen.set(v),
    options.onOpenChange,
  )

  const isValueControlled = typeof options.value === "function"
  const internalValue = createSignal(options.defaultValue ?? "")
  const value = mkSignal<string>(
    isValueControlled,
    () => (isValueControlled ? (options.value as () => string)() : internalValue.get()),
    (v) => internalValue.set(v),
    options.onValueChange,
  )

  const isQueryControlled = typeof options.query === "function"
  const internalQuery = createSignal(options.defaultQuery ?? options.defaultValue ?? "")
  const query = mkSignal<string>(
    isQueryControlled,
    () => (isQueryControlled ? (options.query as () => string)() : internalQuery.get()),
    (v) => internalQuery.set(v),
    options.onQueryChange,
  )

  const highlighted = createSignal<string | null>(null)
  const filteredItems = createSignal<string[]>([])

  const items: InternalItem[] = []

  const isDisabled = (): boolean => options.disabled?.() ?? false
  const getItem = (v: string): InternalItem | undefined => items.find((it) => it.value === v)
  const isItemDisabled = (it: InternalItem): boolean => it.disabled?.() ?? false
  const labelFor = (v: string): string => getItem(v)?.label ?? v

  const recomputeFiltered = (): void => {
    const q = query.get()
    const list = items.filter((it) => filter(it.label, q)).map((it) => it.value)
    filteredItems.set(list)
    if (inlineAutocomplete && q.length > 0 && list.length > 0) {
      highlighted.set(list[0])
    } else if (highlighted.get() && !list.includes(highlighted.get()!)) {
      highlighted.set(null)
    }
  }

  // Keep filteredItems in sync with query even before `mount` is called.
  query.subscribe(recomputeFiltered)

  const show = (): void => {
    if (isDisabled()) return
    open.set(true)
    recomputeFiltered()
  }
  const hide = (): void => open.set(false)
  const toggle = (): void => (open.get() ? hide() : show())

  const registerItem: Autocomplete["registerItem"] = (itemValue, opts = {}) => {
    const itemId = createId("autocomplete-item")
    const internal: InternalItem = {
      value: itemValue,
      label: opts.label ?? itemValue,
      id: itemId,
      disabled: opts.disabled,
    }
    items.push(internal)
    recomputeFiltered()
    return {
      value: itemValue,
      itemId,
      unregister: () => {
        const idx = items.indexOf(internal)
        if (idx >= 0) items.splice(idx, 1)
        recomputeFiltered()
      },
    }
  }

  const setHighlighted = (val: string | null): void => {
    if (val === highlighted.get()) return
    if (val !== null && !getItem(val)) return
    highlighted.set(val)
  }

  const shiftHighlight = (dir: 1 | -1): void => {
    const list = filteredItems.get().filter((v) => {
      const it = getItem(v)
      return it && !isItemDisabled(it)
    })
    if (list.length === 0) return
    const current = highlighted.get()
    const idx = current ? list.indexOf(current) : -1
    let next: number
    if (idx < 0) next = dir === 1 ? 0 : list.length - 1
    else {
      next = idx + dir
      if (next < 0) next = loop ? list.length - 1 : 0
      if (next >= list.length) next = loop ? 0 : list.length - 1
    }
    highlighted.set(list[next])
    getItem(list[next])?.el?.scrollIntoView({ block: "nearest" })
  }

  const select = (val: string): void => {
    const it = getItem(val)
    if (!it || isItemDisabled(it)) return
    value.set(val)
    query.set(it.label)
    if (closeOnSelect) hide()
  }

  const getInputProps = (): AutocompleteInputProps => {
    const props: AutocompleteInputProps = {
      role: "combobox",
      id: inputId,
      "aria-expanded": open.get() ? "true" : "false",
      "aria-controls": listboxId,
      "aria-autocomplete": inlineAutocomplete ? "both" : "list",
      autocomplete: "off",
      value: query.get(),
    }
    const h = highlighted.get()
    if (open.get() && h) props["aria-activedescendant"] = getItem(h)?.id
    return props
  }

  const getListboxProps = (): AutocompleteListboxProps => ({
    role: "listbox",
    id: listboxId,
    "data-state": open.get() ? "open" : "closed",
  })

  const getOptionProps = (val: string): AutocompleteOptionProps => {
    const it = getItem(val)
    const selected = value.get() === val
    const isHigh = highlighted.get() === val
    const disabled = it ? isItemDisabled(it) : false
    const props: AutocompleteOptionProps = {
      role: "option",
      id: it?.id ?? `${listboxId}-missing`,
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

  const getHiddenInputProps = (): AutocompleteHiddenInputProps | null => {
    if (!options.name) return null
    return { type: "hidden", name: options.name, value: value.get() }
  }

  const mount: Autocomplete["mount"] = (els) => {
    const { input, listbox } = els
    input.id ||= inputId
    listbox.id ||= listboxId
    input.setAttribute("role", "combobox")
    input.setAttribute("aria-controls", listbox.id)
    input.setAttribute("aria-autocomplete", inlineAutocomplete ? "both" : "list")
    input.setAttribute("autocomplete", "off")
    listbox.setAttribute("role", "listbox")

    const applyInputAttrs = (): void => {
      const o = open.get()
      input.setAttribute("aria-expanded", o ? "true" : "false")
      if (input.value !== query.get()) input.value = query.get()
      const h = highlighted.get()
      if (o && h) {
        const item = getItem(h)
        if (item) input.setAttribute("aria-activedescendant", item.id)
      } else {
        input.removeAttribute("aria-activedescendant")
      }
    }

    const applyListboxAttrs = (): void => {
      listbox.setAttribute("data-state", open.get() ? "open" : "closed")
    }

    const scanItems = (): void => {
      const nodes = listbox.querySelectorAll<HTMLElement>("[data-value]")
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

    const applyItemAttrs = (): void => {
      const v = value.get()
      const h = highlighted.get()
      const visible = new Set(filteredItems.get())
      for (const it of items) {
        if (!it.el) continue
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
        it.el.style.display = visible.has(it.value) ? "" : "none"
      }
    }

    // --- listeners ---
    const offInput = on(input, "input", () => {
      query.set(input.value)
      if (!open.get()) show()
      else recomputeFiltered()
    })
    const offFocus = on(input, "focus", () => {
      if (items.length > 0) show()
    })
    const offKeyDown = on(input, "keydown", (event) => {
      const ke = event as KeyboardEvent
      if (ke.key === "ArrowDown") {
        if (!open.get()) show()
        else shiftHighlight(1)
        ke.preventDefault()
      } else if (ke.key === "ArrowUp") {
        if (open.get()) {
          shiftHighlight(-1)
          ke.preventDefault()
        }
      } else if (ke.key === "Enter") {
        const h = highlighted.get()
        if (h) {
          select(h)
          ke.preventDefault()
        } else {
          // Commit free-text.
          value.set(query.get())
          hide()
        }
      } else if (ke.key === "Escape") {
        if (open.get()) {
          hide()
          ke.preventDefault()
        }
      } else if (ke.key === "Home" && open.get()) {
        const list = filteredItems.get()
        if (list[0]) {
          highlighted.set(list[0])
          ke.preventDefault()
        }
      } else if (ke.key === "End" && open.get()) {
        const list = filteredItems.get()
        if (list.length) {
          highlighted.set(list[list.length - 1])
          ke.preventDefault()
        }
      }
    })

    const offListClick = on(listbox, "click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-value]")
      if (!target) return
      const v = target.dataset.value
      if (v) select(v)
    })
    const offListMove = on(listbox, "pointermove", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-value]")
      if (!target) return
      const v = target.dataset.value
      if (v) setHighlighted(v)
    })

    // --- floating position ---
    let cleanupAuto: (() => void) | null = null
    let cleanupLayer: (() => void) | null = null

    const updatePosition = async (): Promise<void> => {
      if (!open.get()) return
      const result = await computePosition(input, listbox, {
        placement,
        middleware: [
          offset(sideOffset),
          flip({ padding: collisionPadding }),
          shift({ padding: collisionPadding }),
        ],
      })
      listbox.style.position = "absolute"
      listbox.style.left = `${result.x}px`
      listbox.style.top = `${result.y}px`
      listbox.setAttribute("data-placement", result.placement)
    }

    const handleOpenChange = (o: boolean): void => {
      applyInputAttrs()
      applyListboxAttrs()
      if (o) {
        scanItems()
        listbox.style.display = ""
        cleanupAuto = autoUpdate(input, listbox, () => {
          void updatePosition()
        })
        cleanupLayer = pushDismissibleLayer(() => hide())
      } else {
        listbox.style.display = "none"
        cleanupAuto?.()
        cleanupAuto = null
        cleanupLayer?.()
        cleanupLayer = null
      }
    }

    applyInputAttrs()
    applyListboxAttrs()
    scanItems()
    if (open.get()) handleOpenChange(true)
    else listbox.style.display = "none"

    const unOpen = open.subscribe(handleOpenChange)
    const unValue = value.subscribe(applyItemAttrs)
    const unQuery = query.subscribe(() => {
      applyInputAttrs()
      applyItemAttrs()
    })
    const unHigh = highlighted.subscribe(() => {
      applyInputAttrs()
      applyItemAttrs()
    })
    const unFiltered = filteredItems.subscribe(applyItemAttrs)

    return () => {
      offInput()
      offFocus()
      offKeyDown()
      offListClick()
      offListMove()
      cleanupAuto?.()
      cleanupLayer?.()
      unOpen()
      unValue()
      unQuery()
      unHigh()
      unFiltered()
    }
  }

  return {
    open,
    value,
    query,
    highlighted,
    filteredItems,
    inputId,
    listboxId,
    show,
    hide,
    toggle,
    registerItem,
    select,
    setHighlighted,
    labelFor,
    getInputProps,
    getListboxProps,
    getOptionProps,
    getHiddenInputProps,
    mount,
  }
}
