// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createButton } from "../src/primitives/button.ts"

let el: HTMLButtonElement

beforeEach(() => {
  document.body.innerHTML = ""
  el = document.createElement("button")
  document.body.append(el)
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createButton", () => {
  it("native button emits type=button + no role", () => {
    const b = createButton()
    const props = b.getRootProps()
    expect(props.type).toBe("button")
    expect(props.role).toBeUndefined()
  })

  it("non-native emits role=button + tabIndex", () => {
    const b = createButton({ nativeButton: false })
    const props = b.getRootProps()
    expect(props.role).toBe("button")
    expect(props.tabIndex).toBe(0)
  })

  it("disabled blocks click handler", () => {
    const onClick = vi.fn()
    const b = createButton({ disabled: true, onClick })
    const cleanup = b.mount(el)
    el.click()
    expect(onClick).not.toHaveBeenCalled()
    cleanup()
  })

  it("focusableWhenDisabled keeps element in tab order + aria-disabled", () => {
    const div = document.createElement("div")
    document.body.append(div)
    const b = createButton({ nativeButton: false, disabled: true, focusableWhenDisabled: true })
    const cleanup = b.mount(div)
    expect(div.getAttribute("aria-disabled")).toBe("true")
    expect(div.tabIndex).toBe(0)
    cleanup()
  })

  it("non-native: Enter key triggers click", () => {
    const div = document.createElement("div")
    document.body.append(div)
    const onClick = vi.fn()
    const b = createButton({ nativeButton: false, onClick })
    const cleanup = b.mount(div)
    div.addEventListener("click", onClick)
    div.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(onClick).toHaveBeenCalled()
    cleanup()
  })
})
