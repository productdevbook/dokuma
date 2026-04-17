// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { createBreadcrumb } from "../src/primitives/breadcrumb.ts"

describe("createBreadcrumb", () => {
  it('root is role="navigation" with default aria-label', () => {
    const b = createBreadcrumb()
    expect(b.getRootProps()).toEqual({ role: "navigation", "aria-label": "Breadcrumb" })
  })

  it("custom label is preserved (i18n)", () => {
    const b = createBreadcrumb({ label: "Konum yolu" })
    expect(b.getRootProps()["aria-label"]).toBe("Konum yolu")
  })

  it("default item props are empty (no aria-current)", () => {
    expect(createBreadcrumb().getItemProps()).toEqual({})
  })

  it('current item gets aria-current="page" + data-current', () => {
    expect(createBreadcrumb().getItemProps({ current: true })).toEqual({
      "aria-current": "page",
      "data-current": "",
    })
  })

  it("separator is hidden from SR and marked presentation", () => {
    expect(createBreadcrumb().getSeparatorProps()).toEqual({
      "aria-hidden": true,
      role: "presentation",
    })
  })

  it("list props are an empty marker for parity", () => {
    expect(createBreadcrumb().getListProps()).toEqual({})
  })
})
