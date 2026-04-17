import { createSignal, type Signal } from "../_signal.ts"

export type PaginationItem = number | "ellipsis"

export interface PaginationOptions {
  defaultPage?: number
  /** Controlled page getter (1-indexed). */
  page?: () => number
  onPageChange?: (page: number) => void
  pageCount: number
  /** Default `1`. Pages shown on each side of the current page. */
  siblingCount?: number
  /** Default `1`. Pages shown at each boundary (start/end). */
  boundaryCount?: number
}

export interface PaginationRootProps {
  role: "navigation"
  "aria-label": string
}

export interface PaginationItemProps {
  type: "button"
  "aria-label": string
  "aria-current"?: "page"
  "data-current"?: ""
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface PaginationStepProps {
  type: "button"
  "aria-label": string
  disabled: boolean
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface Pagination {
  page: Signal<number>
  pages: Signal<PaginationItem[]>
  pageCount: number
  canGoPrev: Signal<boolean>
  canGoNext: Signal<boolean>
  setPage: (page: number) => void
  next: () => void
  prev: () => void
  first: () => void
  last: () => void
  getRootProps: () => PaginationRootProps
  getItemProps: (page: number) => PaginationItemProps
  getPrevProps: () => PaginationStepProps
  getNextProps: () => PaginationStepProps
}

const range = (start: number, end: number): number[] => {
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

/**
 * Builds the visible page array for a pagination control:
 *   `[1, "ellipsis", 4, 5, 6, "ellipsis", 20]`
 *
 * Collapses gaps of 2+ pages into a single `"ellipsis"`. A gap of exactly one
 * page is shown as the page number (avoids "..." replacing a single number).
 */
function buildPages(
  current: number,
  pageCount: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  if (pageCount <= 1) return pageCount === 1 ? [1] : []

  const startBoundary = range(1, Math.min(boundaryCount, pageCount))
  const endBoundary = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount)

  const siblingsStart = Math.max(
    Math.min(current - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  )
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endBoundary.length > 0 ? endBoundary[0]! - 2 : pageCount - 1,
  )

  const items: PaginationItem[] = [...startBoundary]

  if (siblingsStart > boundaryCount + 2) {
    items.push("ellipsis")
  } else if (boundaryCount + 1 < pageCount - boundaryCount) {
    items.push(boundaryCount + 1)
  }

  items.push(...range(siblingsStart, siblingsEnd))

  if (siblingsEnd < pageCount - boundaryCount - 1) {
    items.push("ellipsis")
  } else if (pageCount - boundaryCount > boundaryCount) {
    items.push(pageCount - boundaryCount)
  }

  items.push(...endBoundary)

  // Dedup any adjacent duplicates the algorithm can produce at the seams.
  const out: PaginationItem[] = []
  for (const it of items) {
    if (out[out.length - 1] !== it) out.push(it)
  }
  return out
}

export function createPagination(options: PaginationOptions): Pagination {
  const pageCount = Math.max(0, options.pageCount)
  const siblingCount = options.siblingCount ?? 1
  const boundaryCount = options.boundaryCount ?? 1
  const isControlled = typeof options.page === "function"

  const internal = createSignal(
    Math.min(Math.max(1, options.defaultPage ?? 1), Math.max(1, pageCount)),
  )
  const subscribers = new Set<(v: number) => void>()
  const pagesSubs = new Set<(v: PaginationItem[]) => void>()

  const readPage = (): number => (isControlled ? (options.page as () => number)() : internal.get())

  const clamp = (n: number): number => Math.min(Math.max(1, n), Math.max(1, pageCount))

  const page: Signal<number> = {
    get: readPage,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: number) => number)(readPage()) : next
      const clamped = clamp(resolved)
      if (clamped === readPage()) return
      if (!isControlled) internal.set(clamped)
      options.onPageChange?.(clamped)
      for (const fn of subscribers) fn(clamped)
      const list = buildPages(clamped, pageCount, siblingCount, boundaryCount)
      for (const fn of pagesSubs) fn(list)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const pages: Signal<PaginationItem[]> = {
    get: () => buildPages(readPage(), pageCount, siblingCount, boundaryCount),
    set: () => {
      throw new Error("dokuma: pagination.pages is read-only.")
    },
    subscribe: (fn) => {
      pagesSubs.add(fn)
      return () => pagesSubs.delete(fn)
    },
  }

  const canGoPrev: Signal<boolean> = {
    get: () => readPage() > 1,
    set: () => {
      throw new Error("dokuma: canGoPrev is read-only.")
    },
    subscribe: (fn) => {
      const wrap = (n: number): void => fn(n > 1)
      subscribers.add(wrap)
      return () => subscribers.delete(wrap)
    },
  }

  const canGoNext: Signal<boolean> = {
    get: () => readPage() < pageCount,
    set: () => {
      throw new Error("dokuma: canGoNext is read-only.")
    },
    subscribe: (fn) => {
      const wrap = (n: number): void => fn(n < pageCount)
      subscribers.add(wrap)
      return () => subscribers.delete(wrap)
    },
  }

  const setPage = (n: number): void => page.set(n)
  const next = (): void => page.set(readPage() + 1)
  const prev = (): void => page.set(readPage() - 1)
  const first = (): void => page.set(1)
  const last = (): void => page.set(pageCount)

  const getRootProps = (): PaginationRootProps => ({
    role: "navigation",
    "aria-label": "Pagination",
  })

  const getItemProps = (target: number): PaginationItemProps => {
    const isCurrent = target === readPage()
    const props: PaginationItemProps = {
      type: "button",
      "aria-label": `Go to page ${target}`,
      onClick: (event) => {
        event?.preventDefault?.()
        setPage(target)
      },
    }
    if (isCurrent) {
      props["aria-current"] = "page"
      props["data-current"] = ""
    }
    return props
  }

  const getPrevProps = (): PaginationStepProps => ({
    type: "button",
    "aria-label": "Previous page",
    disabled: !canGoPrev.get(),
    onClick: (event) => {
      event?.preventDefault?.()
      prev()
    },
  })

  const getNextProps = (): PaginationStepProps => ({
    type: "button",
    "aria-label": "Next page",
    disabled: !canGoNext.get(),
    onClick: (event) => {
      event?.preventDefault?.()
      next()
    },
  })

  return {
    page,
    pages,
    pageCount,
    canGoPrev,
    canGoNext,
    setPage,
    next,
    prev,
    first,
    last,
    getRootProps,
    getItemProps,
    getPrevProps,
    getNextProps,
  }
}
