// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createCombobox } from "../src/primitives/combobox.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

const seed = (cb: ReturnType<typeof createCombobox>): void => {
  cb.registerItem("apple", { label: "Apple" })
  cb.registerItem("banana", { label: "Banana" })
  cb.registerItem("cherry", { label: "Cherry" })
  cb.registerItem("date", { label: "Date", disabled: () => true })
}

describe("createCombobox (basic)", () => {
  it("starts closed with empty value", () => {
    const cb = createCombobox()
    expect(cb.open.get()).toBe(false)
    expect(cb.value.get()).toBe("")
    expect(cb.query.get()).toBe("")
  })

  it("respects defaultOpen + defaultValue", () => {
    const cb = createCombobox({ defaultOpen: true, defaultValue: "apple" })
    cb.registerItem("apple", { label: "Apple" })
    expect(cb.open.get()).toBe(true)
    expect(cb.value.get()).toBe("apple")
  })

  it("show / hide / toggle", () => {
    const cb = createCombobox()
    cb.show()
    expect(cb.open.get()).toBe(true)
    cb.hide()
    expect(cb.open.get()).toBe(false)
    cb.toggle()
    expect(cb.open.get()).toBe(true)
  })

  it("disabled blocks show", () => {
    const cb = createCombobox({ disabled: () => true })
    cb.show()
    expect(cb.open.get()).toBe(false)
  })
})

describe("createCombobox (registration)", () => {
  it("registerItem returns a stable id; re-register updates in place", () => {
    const cb = createCombobox()
    const a = cb.registerItem("x", { label: "X1" })
    const b = cb.registerItem("x", { label: "X2" })
    expect(a.itemId).toBe(b.itemId)
    expect(cb.labelFor("x")).toBe("X2")
  })

  it("hasItem / unregister", () => {
    const cb = createCombobox()
    const h = cb.registerItem("x")
    expect(cb.hasItem("x")).toBe(true)
    h.unregister()
    expect(cb.hasItem("x")).toBe(false)
  })
})

describe("createCombobox (filter)", () => {
  it("default substring filter is case-insensitive", () => {
    const cb = createCombobox()
    seed(cb)
    expect(cb.filteredItems.get()).toEqual(["apple", "banana", "cherry", "date"])
    cb.query.set("an")
    expect(cb.filteredItems.get()).toEqual(["banana"])
  })

  it("isEmpty reflects filter result", () => {
    const cb = createCombobox()
    seed(cb)
    cb.query.set("zzz")
    expect(cb.isEmpty.get()).toBe(true)
    cb.query.set("")
    expect(cb.isEmpty.get()).toBe(false)
  })

  it("custom filter override", () => {
    const cb = createCombobox({
      filter: (label, q) => label.startsWith(q),
    })
    seed(cb)
    cb.query.set("Ch")
    expect(cb.filteredItems.get()).toEqual(["cherry"])
  })

  it("autoHighlightFirst sets highlighted on type", () => {
    const cb = createCombobox({ autoHighlightFirst: true })
    seed(cb)
    cb.query.set("b")
    expect(cb.highlighted.get()).toBe("banana")
  })
})

describe("createCombobox (selection)", () => {
  it("select fires onValueChange and updates value", () => {
    const onValueChange = vi.fn()
    const cb = createCombobox({ onValueChange })
    seed(cb)
    cb.select("banana")
    expect(cb.value.get()).toBe("banana")
    expect(onValueChange).toHaveBeenCalledWith("banana")
  })

  it("select hides listbox when closeOnSelect is true (default)", () => {
    const cb = createCombobox({ defaultOpen: true })
    seed(cb)
    cb.select("apple")
    expect(cb.open.get()).toBe(false)
  })

  it("closeOnSelect=false keeps listbox open", () => {
    const cb = createCombobox({ defaultOpen: true, closeOnSelect: false })
    seed(cb)
    cb.select("apple")
    expect(cb.open.get()).toBe(true)
  })

  it("disabled item is a no-op", () => {
    const onValueChange = vi.fn()
    const cb = createCombobox({ onValueChange })
    seed(cb)
    cb.select("date")
    expect(cb.value.get()).toBe("")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("selecting unregistered value throws", () => {
    const cb = createCombobox()
    expect(() => cb.select("nope")).toThrow(/was not registered/)
  })
})

describe("createCombobox (highlight)", () => {
  it("show resets highlight to current value if filtered in", () => {
    const cb = createCombobox()
    seed(cb)
    cb.select("banana")
    cb.show()
    expect(cb.highlighted.get()).toBe("banana")
  })

  it("setHighlighted updates the signal", () => {
    const cb = createCombobox()
    seed(cb)
    cb.setHighlighted("apple")
    expect(cb.highlighted.get()).toBe("apple")
  })

  it("hide clears highlight", () => {
    const cb = createCombobox({ defaultOpen: true })
    seed(cb)
    cb.setHighlighted("banana")
    cb.hide()
    expect(cb.highlighted.get()).toBe("")
  })
})

describe("createCombobox (input prop getters)", () => {
  it("getInputProps emits modern combobox ARIA", () => {
    const cb = createCombobox()
    seed(cb)
    cb.show()
    cb.setHighlighted("apple")
    const p = cb.getInputProps()
    expect(p.role).toBe("combobox")
    expect(p["aria-expanded"]).toBe("true")
    expect(p["aria-controls"]).toBe(cb.listboxId)
    expect(p["aria-autocomplete"]).toBe("list")
    expect(p.autocomplete).toBe("off")
    expect(p["aria-activedescendant"]).toBeDefined()
  })

  it("aria-activedescendant is omitted when no highlight", () => {
    const cb = createCombobox()
    seed(cb)
    cb.show()
    expect(cb.getInputProps()["aria-activedescendant"]).toBeUndefined()
  })

  it("getOptionProps marks selected + highlighted", () => {
    const cb = createCombobox()
    seed(cb)
    cb.select("apple")
    cb.setHighlighted("banana")
    expect(cb.getOptionProps("apple")["aria-selected"]).toBe("true")
    expect(cb.getOptionProps("banana")["data-highlighted"]).toBe(true)
    expect(cb.getOptionProps("date")["aria-disabled"]).toBe(true)
  })

  it("getListboxProps reflects open + side + align", () => {
    const cb = createCombobox()
    seed(cb)
    expect(cb.getListboxProps()["data-state"]).toBe("closed")
    cb.show()
    expect(cb.getListboxProps()["data-state"]).toBe("open")
  })

  it("getHiddenInputProps null without name; populated with name", () => {
    const cb1 = createCombobox()
    expect(cb1.getHiddenInputProps()).toBeNull()
    const cb2 = createCombobox({ name: "fruit" })
    seed(cb2)
    cb2.select("apple")
    expect(cb2.getHiddenInputProps()).toEqual({ type: "hidden", name: "fruit", value: "apple" })
  })
})

describe("createCombobox (keyboard)", () => {
  const press = (cb: ReturnType<typeof createCombobox>, key: string): boolean => {
    let prevented = false
    cb.getInputProps().onKeyDown({
      key,
      preventDefault: () => {
        prevented = true
      },
    })
    return prevented
  }

  it("ArrowDown opens and focuses first when closed", () => {
    const cb = createCombobox()
    seed(cb)
    press(cb, "ArrowDown")
    expect(cb.open.get()).toBe(true)
    expect(cb.highlighted.get()).toBe("apple")
  })

  it("ArrowDown moves through enabled items, skipping disabled at end via loop", () => {
    const cb = createCombobox({ defaultOpen: true })
    seed(cb)
    cb.setHighlighted("apple")
    press(cb, "ArrowDown")
    expect(cb.highlighted.get()).toBe("banana")
    press(cb, "ArrowDown")
    expect(cb.highlighted.get()).toBe("cherry")
    // 'date' is disabled — enabledFiltered skips it; loop wraps to apple
    press(cb, "ArrowDown")
    expect(cb.highlighted.get()).toBe("apple")
  })

  it("Home / End jump to first / last enabled", () => {
    const cb = createCombobox({ defaultOpen: true })
    seed(cb)
    press(cb, "End")
    expect(cb.highlighted.get()).toBe("cherry")
    press(cb, "Home")
    expect(cb.highlighted.get()).toBe("apple")
  })

  it("Enter on highlighted commits selection", () => {
    const onValueChange = vi.fn()
    const cb = createCombobox({ onValueChange, defaultOpen: true })
    seed(cb)
    cb.setHighlighted("banana")
    press(cb, "Enter")
    expect(cb.value.get()).toBe("banana")
    expect(onValueChange).toHaveBeenCalledWith("banana")
  })

  it("Escape closes and reverts the input text", () => {
    const cb = createCombobox()
    seed(cb)
    cb.select("apple")
    cb.show()
    cb.query.set("xyz")
    expect(cb.getInputProps().value).toBe("xyz")
    press(cb, "Escape")
    expect(cb.open.get()).toBe(false)
    expect(cb.getInputProps().value).toBe("Apple")
  })

  it("typing a printable character opens the listbox", () => {
    const cb = createCombobox()
    seed(cb)
    press(cb, "a")
    expect(cb.open.get()).toBe(true)
  })
})

describe("createCombobox (input handler)", () => {
  it("onInput updates query and shows listbox", () => {
    const cb = createCombobox()
    seed(cb)
    cb.getInputProps().onInput({ currentTarget: { value: "ban" } })
    expect(cb.query.get()).toBe("ban")
    expect(cb.open.get()).toBe(true)
    expect(cb.filteredItems.get()).toEqual(["banana"])
  })

  it("input value tracks query while typing", () => {
    const cb = createCombobox()
    seed(cb)
    cb.getInputProps().onInput({ currentTarget: { value: "ch" } })
    expect(cb.getInputProps().value).toBe("ch")
  })
})

describe("createCombobox (mount + outside click)", () => {
  const buildDOM = (): { input: HTMLInputElement; listbox: HTMLElement } => {
    const input = document.createElement("input")
    const listbox = document.createElement("ul")
    document.body.append(input, listbox)
    return { input, listbox }
  }

  it("mount applies ARIA + listbox role", () => {
    const cb = createCombobox()
    seed(cb)
    const { input, listbox } = buildDOM()
    const destroy = cb.mount({ input, listbox })
    expect(input.getAttribute("role")).toBe("combobox")
    expect(listbox.getAttribute("role")).toBe("listbox")
    expect(input.getAttribute("aria-controls")).toBe(cb.listboxId)
    destroy()
  })

  it("outside click closes and reverts when not allowCustomValue", () => {
    const cb = createCombobox()
    seed(cb)
    cb.select("apple")
    const { input, listbox } = buildDOM()
    const destroy = cb.mount({ input, listbox })
    cb.show()
    cb.query.set("xx")
    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    expect(cb.open.get()).toBe(false)
    expect(cb.getInputProps().value).toBe("Apple")
    destroy()
  })

  it("outside click commits when allowCustomValue", () => {
    const onValueChange = vi.fn()
    const cb = createCombobox({ allowCustomValue: true, onValueChange })
    seed(cb)
    const { input, listbox } = buildDOM()
    const destroy = cb.mount({ input, listbox })
    cb.show()
    cb.query.set("custom-text")
    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    expect(cb.value.get()).toBe("custom-text")
    expect(onValueChange).toHaveBeenCalledWith("custom-text")
    destroy()
  })
})
