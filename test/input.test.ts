// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createInput } from "../src/primitives/input.ts"

let el: HTMLInputElement

beforeEach(() => {
  document.body.innerHTML = ""
  el = document.createElement("input")
  document.body.append(el)
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createInput", () => {
  it("defaultValue sets value + filled signal", () => {
    const input = createInput({ defaultValue: "hello" })
    expect(input.value.get()).toBe("hello")
    const props = input.getRootProps()
    expect(props.value).toBe("hello")
    expect(props["data-filled"]).toBe("")
  })

  it("mount wires input event + onValueChange", () => {
    const onValueChange = vi.fn()
    const input = createInput({ onValueChange })
    const cleanup = input.mount(el)
    el.value = "hi"
    el.dispatchEvent(new Event("input"))
    expect(input.value.get()).toBe("hi")
    expect(onValueChange).toHaveBeenCalledWith("hi")
    cleanup()
  })

  it("controlled mode respects external value", () => {
    let external = "init"
    const input = createInput({ value: () => external })
    expect(input.value.get()).toBe("init")
    external = "next"
    expect(input.value.get()).toBe("next")
  })

  it("disabled propagates to element", () => {
    const input = createInput({ disabled: true })
    const cleanup = input.mount(el)
    expect(el.disabled).toBe(true)
    expect(el.getAttribute("data-disabled")).toBe("")
    cleanup()
  })
})
