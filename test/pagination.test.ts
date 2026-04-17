// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { createPagination } from "../src/primitives/pagination.ts"

describe("createPagination — basic state", () => {
  it("default page is 1, clamped to pageCount", () => {
    expect(createPagination({ pageCount: 5 }).page.get()).toBe(1)
  })

  it("respects defaultPage and clamps it", () => {
    expect(createPagination({ pageCount: 5, defaultPage: 3 }).page.get()).toBe(3)
    expect(createPagination({ pageCount: 5, defaultPage: 99 }).page.get()).toBe(5)
    expect(createPagination({ pageCount: 5, defaultPage: -1 }).page.get()).toBe(1)
  })

  it("setPage clamps and notifies", () => {
    const onPageChange = vi.fn()
    const p = createPagination({ pageCount: 10, onPageChange })
    p.setPage(5)
    expect(p.page.get()).toBe(5)
    expect(onPageChange).toHaveBeenLastCalledWith(5)
    p.setPage(99)
    expect(p.page.get()).toBe(10)
  })

  it("next/prev/first/last", () => {
    const p = createPagination({ pageCount: 10, defaultPage: 5 })
    p.next()
    expect(p.page.get()).toBe(6)
    p.prev()
    expect(p.page.get()).toBe(5)
    p.first()
    expect(p.page.get()).toBe(1)
    p.last()
    expect(p.page.get()).toBe(10)
  })

  it("canGoPrev / canGoNext reflect bounds", () => {
    const p = createPagination({ pageCount: 3, defaultPage: 1 })
    expect(p.canGoPrev.get()).toBe(false)
    expect(p.canGoNext.get()).toBe(true)
    p.last()
    expect(p.canGoPrev.get()).toBe(true)
    expect(p.canGoNext.get()).toBe(false)
  })
})

describe("createPagination — page list algorithm", () => {
  it("short list: no ellipsis", () => {
    const p = createPagination({ pageCount: 5, defaultPage: 3 })
    expect(p.pages.get()).toEqual([1, 2, 3, 4, 5])
  })

  it("current at start: ellipsis on right only", () => {
    const p = createPagination({ pageCount: 20, defaultPage: 1 })
    expect(p.pages.get()).toEqual([1, 2, 3, 4, 5, "ellipsis", 20])
  })

  it("current in middle: ellipsis on both sides", () => {
    const p = createPagination({ pageCount: 20, defaultPage: 10 })
    expect(p.pages.get()).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20])
  })

  it("current at end: ellipsis on left only", () => {
    const p = createPagination({ pageCount: 20, defaultPage: 20 })
    expect(p.pages.get()).toEqual([1, "ellipsis", 16, 17, 18, 19, 20])
  })
})

describe("createPagination — props", () => {
  it("root exposes role + aria-label", () => {
    const p = createPagination({ pageCount: 3 })
    expect(p.getRootProps()).toEqual({ role: "navigation", "aria-label": "Pagination" })
  })

  it("current item gets aria-current", () => {
    const p = createPagination({ pageCount: 5, defaultPage: 3 })
    expect(p.getItemProps(3)["aria-current"]).toBe("page")
    expect(p.getItemProps(2)["aria-current"]).toBeUndefined()
  })

  it("prev/next disabled at boundaries", () => {
    const p = createPagination({ pageCount: 3, defaultPage: 1 })
    expect(p.getPrevProps().disabled).toBe(true)
    expect(p.getNextProps().disabled).toBe(false)
    p.last()
    expect(p.getPrevProps().disabled).toBe(false)
    expect(p.getNextProps().disabled).toBe(true)
  })
})
