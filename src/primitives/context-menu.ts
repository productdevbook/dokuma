import { isBrowser, on } from "../_dom.ts"
import { pushDismissibleLayer } from "../_layers.ts"
import {
  autoPosition,
  type Align,
  type PositionOptions,
  type Side,
  type VirtualElement,
} from "../_position.ts"
import { type Signal, type Unsubscribe } from "../_signal.ts"
import {
  createMenu,
  type Menu,
  type MenuContentProps,
  type MenuItemHandle,
  type MenuItemProps,
  type MenuOptions,
  type RegisterMenuItemOptions,
} from "./menu.ts"

export interface ContextMenuOptions extends Omit<MenuOptions, keyof PositionOptions> {
  /** Override the default `bottom` / `start` placement relative to the cursor. */
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  flip?: boolean
  collisionPadding?: number
  /** Default 500ms. Long-press threshold for opening on touch. */
  longPressThreshold?: number
  /** Default `true`. Hide the menu on the first scroll event after opening. */
  closeOnScroll?: boolean
}

export interface ContextMenuAnchorProps {
  "data-state": "open" | "closed"
  onContextMenu: (event: { clientX: number; clientY: number; preventDefault: () => void }) => void
}

export interface ContextMenu {
  open: Signal<boolean>
  contentId: string
  highlighted: Signal<string>
  show: () => void
  hide: () => void
  toggle: () => void
  registerItem: (value: string, opts?: RegisterMenuItemOptions) => MenuItemHandle
  hasItem: (value: string) => boolean
  isItemDisabled: (value: string) => boolean
  setHighlighted: (value: string) => void
  select: (value: string) => void
  getAnchorProps: () => ContextMenuAnchorProps
  getContentProps: () => MenuContentProps
  getItemProps: (value: string) => MenuItemProps
  /**
   * Imperatively wire anchor + content. Right-click and long-press on `anchor`
   * open the menu at the cursor; the existing menu wiring handles keyboard,
   * dismiss, and focus restore. Returns cleanup.
   */
  mount: (els: { anchor: HTMLElement; content: HTMLElement }) => Unsubscribe
}

const DRIFT_THRESHOLD_PX = 4

export function createContextMenu(options: ContextMenuOptions = {}): ContextMenu {
  const longPressThreshold = options.longPressThreshold ?? 500
  const closeOnScroll = options.closeOnScroll ?? true
  const side: Side = options.side ?? "bottom"
  const align: Align = options.align ?? "start"

  // Compose: ContextMenu owns a Menu instance and routes most members through it.
  // The Menu's getTriggerProps / triggerId are intentionally not re-exposed —
  // the anchor here is arbitrary content, not a button.
  const menu: Menu = createMenu({ ...options, side, align })

  // Cursor position captured from contextmenu / long-press touch events.
  // null = no cursor yet (programmatic show falls back to anchor element's rect).
  let cursorPos: { x: number; y: number } | null = null

  const getAnchorProps = (): ContextMenuAnchorProps => ({
    "data-state": menu.open.get() ? "open" : "closed",
    onContextMenu: (event) => {
      event.preventDefault()
      cursorPos = { x: event.clientX, y: event.clientY }
      menu.show()
    },
  })

  const mount = (els: { anchor: HTMLElement; content: HTMLElement }): Unsubscribe => {
    const { anchor, content } = els
    let releasePosition: (() => void) | null = null
    let releaseEscape: (() => void) | null = null
    let releaseOutside: (() => void) | null = null
    let releaseScroll: (() => void) | null = null
    let lastFocused: HTMLElement | null = null

    const virtualAnchor = (): VirtualElement => {
      if (cursorPos) {
        const { x, y } = cursorPos
        return {
          getBoundingClientRect: () =>
            ({
              x,
              y,
              top: y,
              bottom: y,
              left: x,
              right: x,
              width: 0,
              height: 0,
              toJSON: () => ({}),
            }) as DOMRect,
        }
      }
      return anchor
    }

    const apply = (): void => {
      const isOpen = menu.open.get()
      anchor.setAttribute("data-state", isOpen ? "open" : "closed")
      const props = menu.getContentProps()
      content.id = props.id
      content.setAttribute("role", props.role)
      content.setAttribute("aria-labelledby", props["aria-labelledby"])
      content.setAttribute("data-state", props["data-state"])
      content.setAttribute("data-side", props["data-side"])
      content.setAttribute("data-align", props["data-align"])
      content.tabIndex = -1
    }

    const teardownOpenSideEffects = (): void => {
      releasePosition?.()
      releaseEscape?.()
      releaseOutside?.()
      releaseScroll?.()
      releasePosition = null
      releaseEscape = null
      releaseOutside = null
      releaseScroll = null
    }

    const setupOpenSideEffects = (): void => {
      teardownOpenSideEffects()
      content.style.position = "fixed"
      content.style.top = "0"
      content.style.left = "0"
      content.style.visibility = "visible"

      releasePosition = autoPosition(
        virtualAnchor(),
        content,
        (result) => {
          content.style.transform = `translate3d(${result.x}px, ${result.y}px, 0)`
          content.setAttribute("data-side", result.side)
          content.setAttribute("data-align", result.align)
        },
        { ...options, side, align },
      )

      releaseEscape = pushDismissibleLayer(() => {
        menu.hide()
        if (lastFocused) queueMicrotask(() => lastFocused?.focus())
      })

      releaseOutside = on(document, "mousedown", (e) => {
        const target = e.target as Node
        if (content.contains(target)) return
        // Right-click on the anchor itself is handled by the contextmenu listener,
        // but a stray left-click on the anchor while the menu is open should close it.
        menu.hide()
      })

      if (closeOnScroll) {
        releaseScroll = on(
          window,
          "scroll",
          () => {
            menu.hide()
          },
          { capture: true, passive: true } as AddEventListenerOptions,
        )
      }

      // Focus the content so keyboard nav handlers (forwarded by Menu's content
      // listener — but Menu didn't attach them on _our_ content element since
      // we never called menu.mount). Wire keyboard ourselves below.
      queueMicrotask(() => content.focus())
    }

    const handleAnchorContextMenu = (event: MouseEvent): void => {
      event.preventDefault()
      cursorPos = { x: event.clientX, y: event.clientY }
      if (isBrowser()) lastFocused = document.activeElement as HTMLElement | null
      if (menu.open.get()) {
        // Already open — recompute position immediately, no flash.
        teardownOpenSideEffects()
        setupOpenSideEffects()
      } else {
        menu.show()
      }
    }

    // Long-press on touch devices.
    let longPressTimer: ReturnType<typeof setTimeout> | null = null
    let touchStart: { x: number; y: number } | null = null
    const cancelLongPress = (): void => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      touchStart = null
    }
    const handleTouchStart = (event: TouchEvent): void => {
      const t = event.touches[0]
      if (!t) return
      touchStart = { x: t.clientX, y: t.clientY }
      longPressTimer = setTimeout(() => {
        if (!touchStart) return
        cursorPos = { ...touchStart }
        if (isBrowser()) lastFocused = document.activeElement as HTMLElement | null
        menu.show()
        cancelLongPress()
      }, longPressThreshold)
    }
    const handleTouchMove = (event: TouchEvent): void => {
      if (!touchStart || !longPressTimer) return
      const t = event.touches[0]
      if (!t) return
      const dx = t.clientX - touchStart.x
      const dy = t.clientY - touchStart.y
      if (dx * dx + dy * dy > DRIFT_THRESHOLD_PX * DRIFT_THRESHOLD_PX) cancelLongPress()
    }

    // Forward keyboard events on the content to Menu's keydown handler.
    const contentProps = menu.getContentProps()
    const contentKeyDown = (e: KeyboardEvent): void => {
      contentProps.onKeyDown({
        key: e.key,
        preventDefault: () => e.preventDefault(),
      })
    }

    apply()
    anchor.addEventListener("contextmenu", handleAnchorContextMenu)
    anchor.addEventListener("touchstart", handleTouchStart, { passive: true })
    anchor.addEventListener("touchmove", handleTouchMove, { passive: true })
    anchor.addEventListener("touchend", cancelLongPress)
    anchor.addEventListener("touchcancel", cancelLongPress)
    content.addEventListener("keydown", contentKeyDown)

    const onOpenChange = (isOpen: boolean): void => {
      apply()
      if (isOpen) {
        setupOpenSideEffects()
      } else {
        teardownOpenSideEffects()
        if (lastFocused) {
          const el = lastFocused
          lastFocused = null
          queueMicrotask(() => el.focus())
        }
        cursorPos = null
      }
    }

    if (menu.open.get()) setupOpenSideEffects()
    const unsub = menu.open.subscribe(onOpenChange)

    return () => {
      unsub()
      teardownOpenSideEffects()
      anchor.removeEventListener("contextmenu", handleAnchorContextMenu)
      anchor.removeEventListener("touchstart", handleTouchStart)
      anchor.removeEventListener("touchmove", handleTouchMove)
      anchor.removeEventListener("touchend", cancelLongPress)
      anchor.removeEventListener("touchcancel", cancelLongPress)
      content.removeEventListener("keydown", contentKeyDown)
    }
  }

  return {
    open: menu.open,
    contentId: menu.contentId,
    highlighted: menu.highlighted,
    show: menu.show,
    hide: menu.hide,
    toggle: menu.toggle,
    registerItem: menu.registerItem,
    hasItem: menu.hasItem,
    isItemDisabled: menu.isItemDisabled,
    setHighlighted: menu.setHighlighted,
    select: menu.select,
    getAnchorProps,
    getContentProps: menu.getContentProps,
    getItemProps: menu.getItemProps,
    mount,
  }
}
