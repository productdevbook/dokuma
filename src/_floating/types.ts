// 1:1 port of @floating-ui/core + @floating-ui/dom shared types.

import type { detectOverflow } from "./detect-overflow.ts"
import type {
  Axis,
  ClientRectObject,
  Coords,
  Dimensions,
  ElementRects,
  Placement,
  Rect,
  SideObject,
  Strategy,
  VirtualElement as CoreVirtualElement,
} from "./utils.ts"

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type Promisable<T> = T | Promise<T>

export type Derivable<T> = (state: MiddlewareState) => T

export interface Platform {
  getElementRects: (args: {
    reference: ReferenceElement
    floating: FloatingElement
    strategy: Strategy
  }) => Promisable<ElementRects>
  getClippingRect: (args: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element: any
    boundary: Boundary
    rootBoundary: RootBoundary
    strategy: Strategy
  }) => Promisable<Rect>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDimensions: (element: any) => Promisable<Dimensions>

  convertOffsetParentRelativeRectToViewportRelativeRect?: (args: {
    elements?: Elements
    rect: Rect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    offsetParent: any
    strategy: Strategy
  }) => Promisable<Rect>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOffsetParent?: (element: any) => Promisable<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isElement?: (value: any) => Promisable<boolean>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDocumentElement?: (element: any) => Promisable<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClientRects?: (element: any) => Promisable<Array<ClientRectObject>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isRTL?: (element: any) => Promisable<boolean>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getScale?: (element: any) => Promisable<{ x: number; y: number }>
  detectOverflow?: typeof detectOverflow
}

export interface MiddlewareData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  arrow?: Partial<Coords> & {
    centerOffset: number
    alignmentOffset?: number
  }
  autoPlacement?: {
    index?: number
    overflows: Array<{
      placement: Placement
      overflows: Array<number>
    }>
  }
  flip?: {
    index?: number
    overflows: Array<{
      placement: Placement
      overflows: Array<number>
    }>
  }
  hide?: {
    referenceHidden?: boolean
    escaped?: boolean
    referenceHiddenOffsets?: SideObject
    escapedOffsets?: SideObject
  }
  offset?: Coords & { placement: Placement }
  shift?: Coords & {
    enabled: { [key in Axis]: boolean }
  }
}

export interface ComputePositionConfig {
  platform: Platform
  placement?: Placement
  strategy?: Strategy
  middleware?: Array<Middleware | null | undefined | false>
}

export interface ComputePositionReturn extends Coords {
  placement: Placement
  strategy: Strategy
  middlewareData: MiddlewareData
}

export type ComputePosition = (
  reference: unknown,
  floating: unknown,
  config: ComputePositionConfig,
) => Promise<ComputePositionReturn>

export interface MiddlewareReturn extends Partial<Coords> {
  data?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  reset?:
    | boolean
    | {
        placement?: Placement
        rects?: boolean | ElementRects
      }
}

export type Middleware = {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
  fn: (state: MiddlewareState) => Promisable<MiddlewareReturn>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReferenceElement = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FloatingElement = any

export interface Elements {
  reference: ReferenceElement
  floating: FloatingElement
}

export interface MiddlewareState extends Coords {
  initialPlacement: Placement
  placement: Placement
  strategy: Strategy
  middlewareData: MiddlewareData
  elements: Elements
  rects: ElementRects
  platform: { detectOverflow: typeof detectOverflow } & Platform
}

/** @deprecated use `MiddlewareState` instead. */
export type MiddlewareArguments = MiddlewareState

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Boundary = any
export type RootBoundary = "viewport" | "document" | Rect
export type ElementContext = "reference" | "floating"

export type { CoreVirtualElement as VirtualElement }

// DOM-level richer types (from @floating-ui/dom).
export type DomBoundary = "clippingAncestors" | Element | Array<Element> | Rect

export interface DomVirtualElement {
  getBoundingClientRect: () => ClientRectObject
  getClientRects?: () => Array<ClientRectObject> | DOMRectList
  contextElement?: Element
}

export interface NodeScroll {
  scrollLeft: number
  scrollTop: number
}

export type DomReferenceElement = Element | DomVirtualElement
export type DomFloatingElement = HTMLElement
export type DomPlatform = Prettify<Platform>
