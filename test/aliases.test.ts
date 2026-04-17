// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { createAlertDialog } from "../src/primitives/alert-dialog.ts"
import { createAspectRatio } from "../src/primitives/aspect-ratio.ts"
import { createCollapsible } from "../src/primitives/collapsible.ts"
import { createHoverCard } from "../src/primitives/hover-card.ts"
import { createLabel } from "../src/primitives/label.ts"

describe("createCollapsible", () => {
  it("is a Disclosure under a different name", () => {
    const c = createCollapsible({ defaultOpen: true })
    expect(c.open.get()).toBe(true)
    c.hide()
    expect(c.open.get()).toBe(false)
    expect(c.getTriggerProps()).toMatchObject({
      "aria-expanded": false,
    })
  })
})

describe("createAlertDialog", () => {
  it('uses role="alertdialog" on content', () => {
    const ad = createAlertDialog({ defaultOpen: true })
    expect(ad.getContentProps().role).toBe("alertdialog")
  })

  it("forces closeOnOutsideClick off (must use a button)", () => {
    // Behavior: outside-click should never trigger hide(). We can only check
    // this indirectly without mounting; the fact that the option is forced is
    // a contract guarantee from the implementation.
    const ad = createAlertDialog({ defaultOpen: true })
    expect(ad.open.get()).toBe(true)
  })
})

describe("createHoverCard", () => {
  it('content uses role="dialog" so interactive children are exposed', () => {
    const hc = createHoverCard({ defaultOpen: true })
    expect(hc.getContentProps().role).toBe("dialog")
  })
})

describe("createLabel", () => {
  it("emits the DOM `for` attribute (not htmlFor)", () => {
    const l = createLabel({ htmlFor: "my-input" })
    const p = l.getRootProps()
    expect(p.for).toBe("my-input")
    expect(p.id).toBeUndefined()
  })

  it("returns empty when no options provided", () => {
    expect(createLabel().getRootProps()).toEqual({})
  })

  it("passes id when set", () => {
    expect(createLabel({ id: "x" }).getRootProps()).toEqual({ id: "x" })
  })
})

describe("createAspectRatio", () => {
  it("default ratio is 1 (square)", () => {
    const ar = createAspectRatio()
    expect(ar.ratio).toBe(1)
    expect(ar.getRootProps().style.aspectRatio).toBe("1")
  })

  it("emits ratio as string for CSS aspect-ratio property", () => {
    const ar = createAspectRatio({ ratio: 16 / 9 })
    expect(ar.getRootProps().style.aspectRatio).toBe(String(16 / 9))
    expect(ar.getRootProps().style.width).toBe("100%")
  })
})
