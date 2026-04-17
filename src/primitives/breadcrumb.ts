export interface BreadcrumbOptions {
  /** Default `"Breadcrumb"`. Set when localizing. */
  label?: string
}

export interface BreadcrumbRootProps {
  "aria-label": string
}

export interface BreadcrumbListProps {
  /** No required attributes — `<ol>` carries the list semantics. Marker for spread parity. */
}

export interface BreadcrumbItemProps {
  /** When `true`, item is the current page; emits `aria-current="page"`. */
  "aria-current"?: "page"
  "data-current"?: ""
}

export interface BreadcrumbSeparatorProps {
  "aria-hidden": true
  /** Visible-but-not-focusable; the role keeps SR from announcing it as a navigable thing. */
  role: "presentation"
}

export interface BreadcrumbItemOptions {
  current?: boolean
}

export interface Breadcrumb {
  getRootProps: () => BreadcrumbRootProps & { role: "navigation" }
  getListProps: () => BreadcrumbListProps
  getItemProps: (opts?: BreadcrumbItemOptions) => BreadcrumbItemProps
  getSeparatorProps: () => BreadcrumbSeparatorProps
}

/**
 * Pure ARIA wrapper for a breadcrumb trail. The primitive does not own the
 * items list — the caller renders `<li>` elements directly. Separators (`/`,
 * `›`, etc.) are marked decorative so screen readers don't announce them
 * between every step.
 *
 * Use `<nav>` for the root and `<ol>` for the list; the WAI-ARIA pattern
 * recommends an ordered list for breadcrumbs because order matters.
 */
export function createBreadcrumb(options: BreadcrumbOptions = {}): Breadcrumb {
  const label = options.label ?? "Breadcrumb"
  return {
    getRootProps: () => ({ role: "navigation", "aria-label": label }),
    getListProps: () => ({}),
    getItemProps: (opts: BreadcrumbItemOptions = {}) => {
      if (opts.current) return { "aria-current": "page", "data-current": "" }
      return {}
    },
    getSeparatorProps: () => ({ "aria-hidden": true, role: "presentation" }),
  }
}
