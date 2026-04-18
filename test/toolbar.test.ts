// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createToolbar } from "../src/primitives/toolbar.ts"

let root: HTMLElement
let buttons: HTMLButtonElement[]

beforeEach(() => {
  document.body.innerHTML = ""
  root = document.createElement("div")
  document.body.append(root)
  buttons = []
  for (let i = 0; i < 3; i++) {
    const b = document.createElement("button")
    b.textContent = String(i)
    root.append(b)
    buttons.push(b)
  }
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createToolbar", () => {
  it("root emits role=toolbar + orientation", () => {
    const t = createToolbar({ orientation: "vertical" })
    const props = t.getRootProps()
    expect(props.role).toBe("toolbar")
    expect(props["aria-orientation"]).toBe("vertical")
  })

  it("first registered item has tabIndex=0; others -1", () => {
    const t = createToolbar()
    t.mount(root)
    buttons.forEach((b) => t.registerItem(b))
    expect(buttons[0].tabIndex).toBe(0)
    expect(buttons[1].tabIndex).toBe(-1)
    expect(buttons[2].tabIndex).toBe(-1)
  })

  it("ArrowRight moves focus to the next item (horizontal)", () => {
    const t = createToolbar({ orientation: "horizontal" })
    const cleanup = t.mount(root)
    buttons.forEach((b) => t.registerItem(b))
    buttons[0].focus()
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    expect(document.activeElement).toBe(buttons[1])
    cleanup()
  })

  it("End jumps to the last enabled item", () => {
    const t = createToolbar()
    const cleanup = t.mount(root)
    buttons.forEach((b) => t.registerItem(b))
    buttons[0].focus()
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))
    expect(document.activeElement).toBe(buttons[2])
    cleanup()
  })

  it("disabled items are skipped by arrow navigation", () => {
    const t = createToolbar()
    const cleanup = t.mount(root)
    t.registerItem(buttons[0])
    t.registerItem(buttons[1], { disabled: () => true })
    t.registerItem(buttons[2])
    buttons[0].focus()
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    expect(document.activeElement).toBe(buttons[2])
    cleanup()
  })
})
