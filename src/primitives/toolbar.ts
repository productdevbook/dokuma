import { on } from "../_dom.ts"
import { rovingKeyDown, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface ToolbarOptions {
  /** Default `"horizontal"`. */
  orientation?: Orientation
  /** Default `false`. Disables the whole toolbar. */
  disabled?: boolean
  /** Default `true`. Arrow navigation wraps at each end. */
  loopFocus?: boolean
  /** Optional aria-label. */
  "aria-label"?: string
  /** Optional aria-labelledby. */
  "aria-labelledby"?: string
}

export interface ToolbarItemRegisterOptions {
  /** Item is disabled. Skipped by arrow navigation unless `focusableWhenDisabled`. */
  disabled?: () => boolean
  /** Stays tabbable even while disabled. */
  focusableWhenDisabled?: boolean
}

export interface ToolbarItemHandle {
  itemId: string
  unregister: () => void
}

export interface ToolbarRootProps {
  role: "toolbar"
  "aria-orientation": Orientation
  "data-orientation": Orientation
  "aria-label"?: string
  "aria-labelledby"?: string
  "data-disabled"?: ""
}

export interface Toolbar {
  orientation: Orientation
  disabled: Signal<boolean>
  /** Active (focused) item index, or -1 before any interaction. */
  activeIndex: Signal<number>
  getRootProps: () => ToolbarRootProps
  /**
   * Register a child item (button, link, input, separator target). The returned
   * handle exposes `itemId` for `id` attribute wiring and an `unregister`.
   */
  registerItem: (el: HTMLElement, options?: ToolbarItemRegisterOptions) => ToolbarItemHandle
  /** Attach the toolbar root. Returns cleanup. */
  mount: (root: HTMLElement) => Unsubscribe
}

interface InternalItem {
  id: string
  el: HTMLElement
  disabled?: () => boolean
  focusableWhenDisabled: boolean
}

export function createToolbar(options: ToolbarOptions = {}): Toolbar {
  const orientation: Orientation = options.orientation ?? "horizontal"
  const loopFocus = options.loopFocus ?? true
  const disabled = createSignal(options.disabled ?? false)
  const activeIndex = createSignal(-1)

  const items: InternalItem[] = []
  let nextId = 0

  const isItemDisabled = (item: InternalItem): boolean =>
    disabled.get() || (item.disabled?.() ?? false)

  const getEnabledItems = (): InternalItem[] =>
    items.filter((it) => !isItemDisabled(it) || it.focusableWhenDisabled)

  const applyTabIndexes = (): void => {
    const enabled = getEnabledItems()
    const activeEl =
      activeIndex.get() >= 0 ? items[activeIndex.get()]?.el : (enabled[0]?.el ?? null)
    for (const it of items) {
      const isActive = it.el === activeEl
      const isDisabledHard = isItemDisabled(it) && !it.focusableWhenDisabled
      if (isDisabledHard) {
        it.el.tabIndex = -1
      } else {
        it.el.tabIndex = isActive ? 0 : -1
      }
    }
  }

  const getRootProps = (): ToolbarRootProps => {
    const props: ToolbarRootProps = {
      role: "toolbar",
      "aria-orientation": orientation,
      "data-orientation": orientation,
    }
    if (options["aria-label"]) props["aria-label"] = options["aria-label"]
    if (options["aria-labelledby"]) props["aria-labelledby"] = options["aria-labelledby"]
    if (disabled.get()) props["data-disabled"] = ""
    return props
  }

  const registerItem = (
    el: HTMLElement,
    itemOptions: ToolbarItemRegisterOptions = {},
  ): ToolbarItemHandle => {
    const id = `dokuma-toolbar-item-${nextId++}`
    el.id ||= id
    const item: InternalItem = {
      id: el.id,
      el,
      disabled: itemOptions.disabled,
      focusableWhenDisabled: itemOptions.focusableWhenDisabled ?? false,
    }
    items.push(item)

    const offFocus = on(el, "focus", () => {
      const idx = items.indexOf(item)
      if (idx >= 0) activeIndex.set(idx)
      applyTabIndexes()
    })

    applyTabIndexes()

    return {
      itemId: item.id,
      unregister: () => {
        offFocus()
        const idx = items.indexOf(item)
        if (idx >= 0) items.splice(idx, 1)
        applyTabIndexes()
      },
    }
  }

  const mount = (root: HTMLElement): Unsubscribe => {
    const apply = (): void => {
      root.setAttribute("role", "toolbar")
      root.setAttribute("aria-orientation", orientation)
      root.setAttribute("data-orientation", orientation)
      if (options["aria-label"]) root.setAttribute("aria-label", options["aria-label"])
      if (options["aria-labelledby"]) {
        root.setAttribute("aria-labelledby", options["aria-labelledby"])
      }
      if (disabled.get()) root.setAttribute("data-disabled", "")
      else root.removeAttribute("data-disabled")
      applyTabIndexes()
    }

    const offKeyDown = on(root, "keydown", (event) => {
      const ke = event as KeyboardEvent
      const enabled = getEnabledItems().map((it) => it.el)
      if (!enabled.length) return

      const current = enabled.find((el) => el === document.activeElement) ?? null
      const target = rovingKeyDown(enabled, current, orientation, {
        key: ke.key,
        preventDefault: () => ke.preventDefault(),
      })
      if (!target) return

      if (!loopFocus) {
        const idx = enabled.indexOf(current ?? enabled[0])
        const targetIdx = enabled.indexOf(target)
        // Block wrap: if current is last and target is first, or first -> last.
        if (idx === enabled.length - 1 && targetIdx === 0) return
        if (idx === 0 && targetIdx === enabled.length - 1) return
      }

      ke.preventDefault()
      target.focus()
    })

    apply()
    const unsubscribeDisabled = disabled.subscribe(apply)

    return () => {
      offKeyDown()
      unsubscribeDisabled()
    }
  }

  return {
    orientation,
    disabled,
    activeIndex,
    getRootProps,
    registerItem,
    mount,
  }
}
