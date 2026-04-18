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
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface PreviewCardOptions {
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void
  /** Delay before opening on hover/focus. Default `300`ms. */
  openDelay?: number
  /** Delay before closing when pointer leaves. Default `150`ms. */
  closeDelay?: number
  /** Default `"bottom"`. */
  placement?: Placement
  /** Gap between trigger and card. Default `4`. */
  sideOffset?: number
  /** Default `8`. */
  collisionPadding?: number
}

export interface PreviewCardTriggerProps {
  id: string
  "aria-describedby"?: string
  "data-state": "open" | "closed"
}

export interface PreviewCardContentProps {
  id: string
  role: "dialog"
  "aria-labelledby"?: string
  "data-state": "open" | "closed"
}

export interface PreviewCard {
  open: Signal<boolean>
  triggerId: string
  contentId: string
  show: () => void
  hide: () => void
  getTriggerProps: () => PreviewCardTriggerProps
  getContentProps: () => PreviewCardContentProps
  /** Imperative DOM wiring. Returns cleanup. */
  mount: (els: { trigger: HTMLElement; content: HTMLElement }) => Unsubscribe
}

/**
 * A hover/focus-activated floating card (GitHub-style user preview).
 * Grace period on close so the pointer can travel trigger → content
 * without the card disappearing. Focus-visible also opens.
 */
export function createPreviewCard(options: PreviewCardOptions = {}): PreviewCard {
  const triggerId = createId("preview-card-trigger")
  const contentId = createId("preview-card-content")
  const placement = options.placement ?? "bottom"
  const sideOffset = options.sideOffset ?? 4
  const collisionPadding = options.collisionPadding ?? 8
  const openDelay = options.openDelay ?? 300
  const closeDelay = options.closeDelay ?? 150

  const isControlled = typeof options.open === "function"
  const internal = createSignal(options.defaultOpen ?? false)
  const read = (): boolean => (isControlled ? (options.open as () => boolean)() : internal.get())

  const subs = new Set<(v: boolean) => void>()
  const open: Signal<boolean> = {
    get: read,
    set: (next) => {
      const resolved = typeof next === "function" ? (next as (p: boolean) => boolean)(read()) : next
      if (resolved === read()) return
      if (!isControlled) internal.set(resolved)
      options.onOpenChange?.(resolved)
      for (const fn of subs) fn(resolved)
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }

  const show = (): void => open.set(true)
  const hide = (): void => open.set(false)

  const getTriggerProps = (): PreviewCardTriggerProps => {
    const props: PreviewCardTriggerProps = {
      id: triggerId,
      "data-state": read() ? "open" : "closed",
    }
    if (read()) props["aria-describedby"] = contentId
    return props
  }

  const getContentProps = (): PreviewCardContentProps => ({
    id: contentId,
    role: "dialog",
    "aria-labelledby": triggerId,
    "data-state": read() ? "open" : "closed",
  })

  const mount: PreviewCard["mount"] = (els) => {
    const { trigger, content } = els
    trigger.id ||= triggerId
    content.id ||= contentId

    let openTimer: ReturnType<typeof setTimeout> | null = null
    let closeTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleOpen = (): void => {
      if (closeTimer) {
        clearTimeout(closeTimer)
        closeTimer = null
      }
      if (read()) return
      openTimer = setTimeout(() => {
        openTimer = null
        show()
      }, openDelay)
    }

    const scheduleClose = (): void => {
      if (openTimer) {
        clearTimeout(openTimer)
        openTimer = null
      }
      if (!read()) return
      closeTimer = setTimeout(() => {
        closeTimer = null
        hide()
      }, closeDelay)
    }

    // --- position + listeners ---
    let cleanupAuto: (() => void) | null = null

    const updatePosition = async (): Promise<void> => {
      if (!read()) return
      const result = await computePosition(trigger, content, {
        placement,
        middleware: [
          offset(sideOffset),
          flip({ padding: collisionPadding }),
          shift({ padding: collisionPadding }),
        ],
      })
      content.style.position = "absolute"
      content.style.left = `${result.x}px`
      content.style.top = `${result.y}px`
      content.setAttribute("data-placement", result.placement)
    }

    const applyAttrs = (): void => {
      const o = read()
      trigger.setAttribute("data-state", o ? "open" : "closed")
      content.setAttribute("data-state", o ? "open" : "closed")
      if (o) trigger.setAttribute("aria-describedby", content.id)
      else trigger.removeAttribute("aria-describedby")
    }

    const handleOpenChange = (o: boolean): void => {
      applyAttrs()
      if (o) {
        content.style.display = ""
        cleanupAuto = autoUpdate(trigger, content, () => {
          void updatePosition()
        })
      } else {
        content.style.display = "none"
        cleanupAuto?.()
        cleanupAuto = null
      }
    }

    // --- listeners ---
    const offTriggerEnter = on(trigger, "pointerenter", scheduleOpen)
    const offTriggerLeave = on(trigger, "pointerleave", scheduleClose)
    const offTriggerFocus = on(trigger, "focus", scheduleOpen)
    const offTriggerBlur = on(trigger, "blur", scheduleClose)
    const offContentEnter = on(content, "pointerenter", () => {
      if (closeTimer) {
        clearTimeout(closeTimer)
        closeTimer = null
      }
    })
    const offContentLeave = on(content, "pointerleave", scheduleClose)

    applyAttrs()
    if (read()) handleOpenChange(true)
    else content.style.display = "none"

    const unOpen = open.subscribe(handleOpenChange)

    return () => {
      if (openTimer) clearTimeout(openTimer)
      if (closeTimer) clearTimeout(closeTimer)
      offTriggerEnter()
      offTriggerLeave()
      offTriggerFocus()
      offTriggerBlur()
      offContentEnter()
      offContentLeave()
      cleanupAuto?.()
      unOpen()
    }
  }

  return {
    open,
    triggerId,
    contentId,
    show,
    hide,
    getTriggerProps,
    getContentProps,
    mount,
  }
}
