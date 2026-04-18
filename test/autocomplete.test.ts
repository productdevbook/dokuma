// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createAutocomplete } from "../src/primitives/autocomplete.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createAutocomplete", () => {
  it("filteredItems updates when query changes", () => {
    const a = createAutocomplete()
    a.registerItem("apple", { label: "Apple" })
    a.registerItem("banana", { label: "Banana" })
    a.registerItem("cherry", { label: "Cherry" })
    a.query.set("an")
    expect(a.filteredItems.get()).toEqual(["banana"])
  })

  it("inlineAutocomplete highlights first match", () => {
    const a = createAutocomplete({ inlineAutocomplete: true })
    a.registerItem("apple", { label: "Apple" })
    a.registerItem("apricot", { label: "Apricot" })
    a.query.set("ap")
    expect(a.highlighted.get()).toBe("apple")
  })

  it("select commits value + closes", () => {
    const onValueChange = vi.fn()
    const a = createAutocomplete({ onValueChange })
    a.registerItem("apple", { label: "Apple" })
    a.show()
    a.select("apple")
    expect(a.value.get()).toBe("apple")
    expect(a.open.get()).toBe(false)
    expect(onValueChange).toHaveBeenCalledWith("apple")
  })

  it("free-text via Enter commits query as value", () => {
    const input = document.createElement("input")
    const listbox = document.createElement("div")
    document.body.append(input, listbox)
    const a = createAutocomplete()
    const cleanup = a.mount({ input, listbox })
    input.value = "newthing"
    input.dispatchEvent(new Event("input"))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(a.value.get()).toBe("newthing")
    cleanup()
  })

  it("hidden input emits when name is provided", () => {
    const a = createAutocomplete({ name: "q", defaultValue: "v" })
    expect(a.getHiddenInputProps()).toEqual({ type: "hidden", name: "q", value: "v" })
  })
})
