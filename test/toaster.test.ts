// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createToaster } from "../src/primitives/toaster.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

afterEach(() => {
  vi.useRealTimers()
})

describe("createToaster (basic)", () => {
  it("starts with empty list", () => {
    const t = createToaster()
    expect(t.toasts.get()).toEqual([])
  })

  it("add returns an id", () => {
    const t = createToaster()
    const id = t.add("hello")
    expect(typeof id).toBe("string")
    expect(t.toasts.get()).toHaveLength(1)
    expect(t.toasts.get()[0]?.message).toBe("hello")
  })

  it("custom id is honored", () => {
    const t = createToaster()
    const id = t.add("hi", { id: "my-id" })
    expect(id).toBe("my-id")
  })

  it("toasts signal fires on add", () => {
    const t = createToaster()
    const sub = vi.fn()
    t.toasts.subscribe(sub)
    t.add("hi")
    expect(sub).toHaveBeenCalled()
  })
})

describe("createToaster (dismiss)", () => {
  it("dismiss fires onDismiss", () => {
    const onDismiss = vi.fn()
    const t = createToaster()
    const id = t.add("hi", { onDismiss, duration: Infinity })
    t.dismiss(id)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it("dismissAll fires onDismiss for every toast", () => {
    const a = vi.fn()
    const b = vi.fn()
    const c = vi.fn()
    const t = createToaster()
    t.add("a", { duration: Infinity, onDismiss: a })
    t.add("b", { duration: Infinity, onDismiss: b })
    t.add("c", { duration: Infinity, onDismiss: c })
    expect(t.toasts.get()).toHaveLength(3)
    t.dismissAll()
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
    expect(c).toHaveBeenCalledOnce()
  })
})

describe("createToaster (auto-dismiss)", () => {
  it("fires onAutoClose after the duration elapses", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const onDismiss = vi.fn()
    const t = createToaster()
    t.add("hi", { duration: 1000, onAutoClose, onDismiss })
    expect(t.toasts.get()).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    expect(onAutoClose).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it("duration: Infinity never fires the timer", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const t = createToaster()
    t.add("sticky", { duration: Infinity, onAutoClose })
    vi.advanceTimersByTime(60_000)
    expect(onAutoClose).not.toHaveBeenCalled()
    expect(t.toasts.get()).toHaveLength(1)
  })

  it("global default duration applies when per-toast omitted", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const t = createToaster({ duration: 2000 })
    t.add("hi", { onAutoClose })
    vi.advanceTimersByTime(1500)
    expect(onAutoClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(onAutoClose).toHaveBeenCalledOnce()
  })
})

describe("createToaster (pause/resume on hover)", () => {
  it("hover pauses the timer; mouseleave resumes for remaining ms", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const t = createToaster()
    const id = t.add("hi", { duration: 1000, onAutoClose })
    const props = t.getToastProps(id)

    vi.advanceTimersByTime(400)
    props.onMouseEnter()
    vi.advanceTimersByTime(5000)
    expect(onAutoClose).not.toHaveBeenCalled()

    props.onMouseLeave()
    vi.advanceTimersByTime(500)
    expect(onAutoClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onAutoClose).toHaveBeenCalledOnce()
  })

  it("focus also pauses; blur resumes", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const t = createToaster()
    const id = t.add("hi", { duration: 1000, onAutoClose })
    const props = t.getToastProps(id)

    vi.advanceTimersByTime(300)
    props.onFocus()
    vi.advanceTimersByTime(10_000)
    expect(onAutoClose).not.toHaveBeenCalled()

    props.onBlur()
    vi.advanceTimersByTime(800)
    expect(onAutoClose).toHaveBeenCalledOnce()
  })
})

describe("createToaster (update + upsert)", () => {
  it("update mutates message in place", () => {
    const t = createToaster()
    const id = t.add("uploading...", { duration: Infinity })
    t.update(id, { message: "done!" })
    expect(t.toasts.get()[0]?.message).toBe("done!")
  })

  it("re-adding the same id upserts (no duplicate)", () => {
    const t = createToaster()
    t.add("first", { id: "x", duration: Infinity })
    t.add("second", { id: "x", duration: Infinity })
    expect(t.toasts.get()).toHaveLength(1)
    expect(t.toasts.get()[0]?.message).toBe("second")
  })

  it("update with new duration restarts the timer", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const t = createToaster()
    const id = t.add("hi", { duration: 1000, onAutoClose })
    vi.advanceTimersByTime(800)
    t.update(id, { duration: 3000 })
    vi.advanceTimersByTime(2000)
    expect(onAutoClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1100)
    expect(onAutoClose).toHaveBeenCalledOnce()
  })
})

describe("createToaster (maxToasts)", () => {
  it("evicts oldest when count exceeds maxToasts", () => {
    const onDismissA = vi.fn()
    const t = createToaster({ maxToasts: 2 })
    t.add("a", { duration: Infinity, onDismiss: onDismissA })
    t.add("b", { duration: Infinity })
    t.add("c", { duration: Infinity })
    expect(onDismissA).toHaveBeenCalledOnce()
  })
})

describe("createToaster (props shape)", () => {
  it("getViewportProps returns role region with default position", () => {
    const t = createToaster()
    const props = t.getViewportProps()
    expect(props.role).toBe("region")
    expect(props["aria-label"]).toBe("Notifications")
    expect(props["data-position"]).toBe("bottom-right")
    expect(props.tabIndex).toBe(-1)
  })

  it("getViewportProps respects custom position + label", () => {
    const t = createToaster({ position: "top-center", label: "Alerts" })
    const props = t.getViewportProps()
    expect(props["data-position"]).toBe("top-center")
    expect(props["aria-label"]).toBe("Alerts")
  })

  it("default toast gets role=status", () => {
    const t = createToaster()
    const id = t.add("hi", { duration: Infinity })
    expect(t.getToastProps(id).role).toBe("status")
  })

  it("error toast gets role=alert", () => {
    const t = createToaster()
    const id = t.add("oops", { type: "error", duration: Infinity })
    expect(t.getToastProps(id).role).toBe("alert")
  })

  it("getToastProps reflects open data-state", () => {
    const t = createToaster()
    const id = t.add("hi", { duration: Infinity })
    expect(t.getToastProps(id)["data-state"]).toBe("open")
  })
})

describe("createToaster (close + action)", () => {
  it("close button dismisses", () => {
    const onDismiss = vi.fn()
    const t = createToaster()
    const id = t.add("hi", { duration: Infinity, onDismiss })
    t.getCloseProps(id).onClick()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it("getActionProps returns null when no action", () => {
    const t = createToaster()
    const id = t.add("hi", { duration: Infinity })
    expect(t.getActionProps(id)).toBeNull()
  })

  it("action click fires handler and dismisses toast", () => {
    const handler = vi.fn()
    const onDismiss = vi.fn()
    const t = createToaster()
    const id = t.add("hi", {
      duration: Infinity,
      action: { label: "Undo", onClick: handler },
      onDismiss,
    })
    const ap = t.getActionProps(id)
    expect(ap).not.toBeNull()
    ap?.onClick()
    expect(handler).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe("createToaster (mount + visibilitychange)", () => {
  it("mount sets viewport ARIA attributes", () => {
    const t = createToaster({ position: "top-right", label: "Alerts" })
    const v = document.createElement("ol")
    document.body.append(v)
    const cleanup = t.mount(v)
    expect(v.getAttribute("role")).toBe("region")
    expect(v.getAttribute("aria-label")).toBe("Alerts")
    expect(v.getAttribute("data-position")).toBe("top-right")
    cleanup()
  })

  it("pauses all timers when document hidden, resumes when visible", () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const t = createToaster()
    const v = document.createElement("ol")
    document.body.append(v)
    const cleanup = t.mount(v)
    t.add("hi", { duration: 1000, onAutoClose })

    vi.advanceTimersByTime(400)
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true })
    document.dispatchEvent(new Event("visibilitychange"))
    vi.advanceTimersByTime(10_000)
    expect(onAutoClose).not.toHaveBeenCalled()

    Object.defineProperty(document, "hidden", { configurable: true, get: () => false })
    document.dispatchEvent(new Event("visibilitychange"))
    vi.advanceTimersByTime(700)
    expect(onAutoClose).toHaveBeenCalledOnce()
    cleanup()
  })
})
