// 1:1 port of @floating-ui/dom/src/platform/getClippingRect.

import {
  getComputedStyle,
  getNodeName,
  getOverflowAncestors,
  getParentNode,
  isContainingBlock,
  isHTMLElement,
  isLastTraversableNode,
  isOverflowElement,
  isTopLayer,
} from "../dom.ts"
import type { Boundary, Platform, RootBoundary } from "../types.ts"
import type { ClientRectObject, Rect, Strategy } from "../utils.ts"
import { createCoords, max, min, rectToClientRect } from "../utils.ts"
import { getBoundingClientRect } from "./get-bounding-client-rect.ts"
import { getDocumentElement } from "./get-document-element.ts"
import { getDocumentRect } from "./get-document-rect.ts"
import { getScale } from "./get-scale.ts"
import { getViewportRect } from "./get-viewport-rect.ts"
import { getVisualOffsets } from "./get-visual-offsets.ts"
import { isElement } from "./is-element.ts"

type PlatformWithCache = Platform & {
  _c: Map<Element, Element[]>
}

function getInnerBoundingClientRect(element: Element, strategy: Strategy): Rect {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed")
  const top = clientRect.top + element.clientTop
  const left = clientRect.left + element.clientLeft
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1)
  const width = element.clientWidth * scale.x
  const height = element.clientHeight * scale.y
  const x = left * scale.x
  const y = top * scale.y

  return { width, height, x, y }
}

function getClientRectFromClippingAncestor(
  element: Element,
  clippingAncestor: Element | RootBoundary,
  strategy: Strategy,
): ClientRectObject {
  let rect: Rect

  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy)
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element))
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy)
  } else {
    const visualOffsets = getVisualOffsets(element)
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height,
    }
  }

  return rectToClientRect(rect)
}

function hasFixedPositionAncestor(element: Element, stopNode: Node): boolean {
  const parentNode = getParentNode(element)
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false
  }

  return (
    getComputedStyle(parentNode).position === "fixed" ||
    hasFixedPositionAncestor(parentNode, stopNode)
  )
}

function getClippingElementAncestors(
  element: Element,
  cache: PlatformWithCache["_c"],
): Array<Element> {
  const cachedResult = cache.get(element)
  if (cachedResult) return cachedResult

  let result = getOverflowAncestors(element, [], false).filter(
    (el) => isElement(el) && getNodeName(el) !== "body",
  ) as Array<Element>
  let currentContainingBlockComputedStyle: CSSStyleDeclaration | null = null
  const elementIsFixed = getComputedStyle(element).position === "fixed"
  let currentNode: Node | null = elementIsFixed ? getParentNode(element) : element

  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle(currentNode)
    const currentNodeIsContaining = isContainingBlock(currentNode)

    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null
    }

    const shouldDropCurrentNode = elementIsFixed
      ? !currentNodeIsContaining && !currentContainingBlockComputedStyle
      : (!currentNodeIsContaining &&
          computedStyle.position === "static" &&
          !!currentContainingBlockComputedStyle &&
          (currentContainingBlockComputedStyle.position === "absolute" ||
            currentContainingBlockComputedStyle.position === "fixed")) ||
        (isOverflowElement(currentNode) &&
          !currentNodeIsContaining &&
          hasFixedPositionAncestor(element, currentNode))

    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode)
    } else {
      currentContainingBlockComputedStyle = computedStyle
    }

    currentNode = getParentNode(currentNode)
  }

  cache.set(element, result)

  return result
}

export function getClippingRect(
  this: PlatformWithCache,
  {
    element,
    boundary,
    rootBoundary,
    strategy,
  }: {
    element: Element
    boundary: Boundary
    rootBoundary: RootBoundary
    strategy: Strategy
  },
): Rect {
  const elementClippingAncestors =
    boundary === "clippingAncestors"
      ? isTopLayer(element)
        ? []
        : getClippingElementAncestors(element, this._c)
      : ([] as Element[]).concat(boundary)
  const clippingAncestors = [...elementClippingAncestors, rootBoundary]

  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy)
  let top = firstRect.top
  let right = firstRect.right
  let bottom = firstRect.bottom
  let left = firstRect.left

  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy)
    top = max(rect.top, top)
    right = min(rect.right, right)
    bottom = min(rect.bottom, bottom)
    left = max(rect.left, left)
  }

  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
  }
}
