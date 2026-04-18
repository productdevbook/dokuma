// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createField } from "../src/primitives/field.ts"

let input: HTMLInputElement

beforeEach(() => {
  document.body.innerHTML = ""
  input = document.createElement("input")
  document.body.append(input)
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createField", () => {
  it("label/control ids are paired", () => {
    const f = createField()
    expect(f.getLabelProps().for).toBe(f.controlId)
    expect(f.getControlProps().id).toBe(f.controlId)
  })

  it("validate() with passing sync returns true + clears error", async () => {
    const f = createField({ validate: () => null })
    const ok = await f.validate()
    expect(ok).toBe(true)
    expect(f.invalid.get()).toBe(false)
    expect(f.errorMessage.get()).toBe("")
  })

  it("validate() with failing returns false + sets invalid + message", async () => {
    const f = createField({ validate: () => "required" })
    const ok = await f.validate()
    expect(ok).toBe(false)
    expect(f.invalid.get()).toBe(true)
    expect(f.errorMessage.get()).toBe("required")
  })

  it("registerControl writes id + tracks focus/blur/input", () => {
    const f = createField()
    const cleanup = f.registerControl(input)
    expect(input.id).toBe(f.controlId)

    input.dispatchEvent(new FocusEvent("focus"))
    expect(f.focused.get()).toBe(true)
    input.dispatchEvent(new FocusEvent("blur"))
    expect(f.focused.get()).toBe(false)
    expect(f.touched.get()).toBe(true)

    input.value = "hello"
    input.dispatchEvent(new Event("input"))
    expect(f.dirty.get()).toBe(true)
    expect(f.filled.get()).toBe(true)

    cleanup()
  })

  it("registerError wires role=alert + toggles visibility on invalid", async () => {
    const f = createField({ validate: () => "bad" })
    const err = document.createElement("div")
    document.body.append(err)
    const un = f.registerError(err)
    expect(err.getAttribute("role")).toBe("alert")
    expect(err.style.display).toBe("none")

    await f.validate()
    expect(err.textContent).toBe("bad")
    expect(err.style.display).not.toBe("none")
    un()
  })

  it("reset clears dirty/touched/invalid", async () => {
    const f = createField({ validate: () => "err" })
    await f.validate()
    expect(f.invalid.get()).toBe(true)
    f.reset()
    expect(f.invalid.get()).toBe(false)
    expect(f.touched.get()).toBe(false)
    expect(f.dirty.get()).toBe(false)
  })
})
