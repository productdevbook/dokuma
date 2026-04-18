// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createPreviewCard } from "../src/primitives/preview-card.ts"

let trigger: HTMLElement
let content: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ""
  trigger = document.createElement("button")
  content = document.createElement("div")
  document.body.append(trigger, content)
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createPreviewCard", () => {
  it("default state is closed + content display:none", () => {
    const pc = createPreviewCard()
    const cleanup = pc.mount({ trigger, content })
    expect(pc.open.get()).toBe(false)
    expect(content.style.display).toBe("none")
    cleanup()
  })

  it("opens on pointerenter after delay", async () => {
    const pc = createPreviewCard({ openDelay: 10 })
    const cleanup = pc.mount({ trigger, content })
    trigger.dispatchEvent(new PointerEvent("pointerenter"))
    await new Promise((r) => setTimeout(r, 30))
    expect(pc.open.get()).toBe(true)
    cleanup()
  })

  it("trigger gets aria-describedby when open", () => {
    const pc = createPreviewCard({ defaultOpen: true })
    const cleanup = pc.mount({ trigger, content })
    expect(trigger.getAttribute("aria-describedby")).toBe(pc.contentId)
    cleanup()
  })
})
