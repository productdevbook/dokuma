import { resolvePortalTarget, type PortalTarget } from "../_portal.ts"
import { createAccordion, type Accordion, type AccordionOptions } from "../primitives/accordion.ts"
import { createCombobox, type Combobox, type ComboboxOptions } from "../primitives/combobox.ts"
import { createToaster, type Toaster, type ToasterOptions } from "../primitives/toaster.ts"
import { createAvatar, type Avatar, type AvatarOptions } from "../primitives/avatar.ts"
import { createCheckbox, type Checkbox, type CheckboxOptions } from "../primitives/checkbox.ts"
import { createDialog, type Dialog, type DialogOptions } from "../primitives/dialog.ts"
import { createMenu, type Menu, type MenuOptions } from "../primitives/menu.ts"
import {
  createContextMenu,
  type ContextMenu,
  type ContextMenuOptions,
} from "../primitives/context-menu.ts"
import { createSeparator, type Separator, type SeparatorOptions } from "../primitives/separator.ts"
import { createVisuallyHidden, type VisuallyHidden } from "../primitives/visually-hidden.ts"
import {
  createCollapsible,
  type Collapsible,
  type CollapsibleOptions,
} from "../primitives/collapsible.ts"
import {
  createAlertDialog,
  type AlertDialog,
  type AlertDialogOptions,
} from "../primitives/alert-dialog.ts"
import { createHoverCard, type HoverCard, type HoverCardOptions } from "../primitives/hover-card.ts"
import { createLabel, type Label, type LabelOptions } from "../primitives/label.ts"
import {
  createAspectRatio,
  type AspectRatio,
  type AspectRatioOptions,
} from "../primitives/aspect-ratio.ts"
import {
  createBreadcrumb,
  type Breadcrumb,
  type BreadcrumbOptions,
} from "../primitives/breadcrumb.ts"
import {
  createPagination,
  type Pagination,
  type PaginationOptions,
} from "../primitives/pagination.ts"
import {
  createNumberInput,
  type NumberInput,
  type NumberInputOptions,
} from "../primitives/number-input.ts"
import { createOtpInput, type OtpInput, type OtpInputOptions } from "../primitives/otp-input.ts"
import {
  createRadioGroup,
  type RadioGroup,
  type RadioGroupOptions,
} from "../primitives/radio-group.ts"
import { createSlider, type Slider, type SliderOptions } from "../primitives/slider.ts"
import { createPopover, type Popover, type PopoverOptions } from "../primitives/popover.ts"
import { createProgress, type Progress, type ProgressOptions } from "../primitives/progress.ts"
import { createTooltip, type Tooltip, type TooltipOptions } from "../primitives/tooltip.ts"
import {
  createDisclosure,
  type Disclosure,
  type DisclosureOptions,
} from "../primitives/disclosure.ts"
import { createSwitch, type Switch, type SwitchOptions } from "../primitives/switch.ts"
import { createTabs, type Tabs, type TabsOptions } from "../primitives/tabs.ts"
import {
  createToggleGroup,
  type ToggleGroup,
  type ToggleGroupOptions,
} from "../primitives/toggle-group.ts"
import { createToggle, type Toggle, type ToggleOptions } from "../primitives/toggle.ts"

export interface MountDisclosureOptions extends DisclosureOptions {
  trigger: HTMLElement | string
  panel: HTMLElement | string
  root?: ParentNode
}

export interface MountedDisclosure {
  disclosure: Disclosure
  destroy: () => void
}

function resolve(el: HTMLElement | string, root: ParentNode): HTMLElement {
  if (typeof el !== "string") return el
  const found = root.querySelector(el)
  if (!found) throw new Error(`dokuma: element not found for selector "${el}"`)
  return found as HTMLElement
}

export function mountDisclosure(opts: MountDisclosureOptions): MountedDisclosure {
  const root = opts.root ?? document
  const trigger = resolve(opts.trigger, root)
  const panel = resolve(opts.panel, root)
  const disclosure = createDisclosure(opts)
  const destroy = disclosure.mount({ trigger, panel })
  return { disclosure, destroy }
}

export interface MountAccordionOptions extends AccordionOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedAccordion {
  accordion: Accordion
  destroy: () => void
}

export function mountAccordion(opts: MountAccordionOptions): MountedAccordion {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const accordion = createAccordion(opts)
  const destroy = accordion.mount(root)
  return { accordion, destroy }
}

export interface MountTabsOptions extends TabsOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedTabs {
  tabs: Tabs
  destroy: () => void
}

export function mountTabs(opts: MountTabsOptions): MountedTabs {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const tabs = createTabs(opts)
  const destroy = tabs.mount(root)
  return { tabs, destroy }
}

export interface MountSwitchOptions extends SwitchOptions {
  root: HTMLElement | string
  hiddenInput?: HTMLInputElement | string
  parent?: ParentNode
}

export interface MountedSwitch {
  switch: Switch
  destroy: () => void
}

export function mountSwitch(opts: MountSwitchOptions): MountedSwitch {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const hiddenInput = opts.hiddenInput
    ? (resolve(opts.hiddenInput as HTMLElement | string, parent) as HTMLInputElement)
    : undefined
  const sw = createSwitch(opts)
  const destroy = sw.mount({ root, hiddenInput })
  return { switch: sw, destroy }
}

export interface MountToggleOptions extends ToggleOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedToggle {
  toggle: Toggle
  destroy: () => void
}

export function mountToggle(opts: MountToggleOptions): MountedToggle {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const tg = createToggle(opts)
  const destroy = tg.mount(root)
  return { toggle: tg, destroy }
}

export interface MountToggleGroupOptions extends ToggleGroupOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedToggleGroup {
  toggleGroup: ToggleGroup
  destroy: () => void
}

export function mountToggleGroup(opts: MountToggleGroupOptions): MountedToggleGroup {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const tg = createToggleGroup(opts)
  const destroy = tg.mount(root)
  return { toggleGroup: tg, destroy }
}

export interface MountDialogOptions extends DialogOptions {
  trigger?: HTMLElement | string
  content: HTMLElement | string
  overlay?: HTMLElement | string
  parent?: ParentNode
}

export interface MountedDialog {
  dialog: Dialog
  destroy: () => void
}

export function mountDialog(opts: MountDialogOptions): MountedDialog {
  const parent = opts.parent ?? document
  const trigger = opts.trigger ? resolve(opts.trigger, parent) : undefined
  const content = resolve(opts.content, parent)
  const overlay = opts.overlay ? resolve(opts.overlay, parent) : undefined
  const dialog = createDialog(opts)
  const destroy = dialog.mount({ trigger, content, overlay })
  return { dialog, destroy }
}

export interface MountTooltipOptions extends TooltipOptions {
  trigger: HTMLElement | string
  content: HTMLElement | string
  parent?: ParentNode
}

export interface MountedTooltip {
  tooltip: Tooltip
  destroy: () => void
}

export function mountTooltip(opts: MountTooltipOptions): MountedTooltip {
  const parent = opts.parent ?? document
  const trigger = resolve(opts.trigger, parent)
  const content = resolve(opts.content, parent)
  const tooltip = createTooltip(opts)
  const destroy = tooltip.mount({ trigger, content })
  return { tooltip, destroy }
}

export interface MountPopoverOptions extends PopoverOptions {
  trigger: HTMLElement | string
  content: HTMLElement | string
  parent?: ParentNode
}

export interface MountedPopover {
  popover: Popover
  destroy: () => void
}

export function mountPopover(opts: MountPopoverOptions): MountedPopover {
  const parent = opts.parent ?? document
  const trigger = resolve(opts.trigger, parent)
  const content = resolve(opts.content, parent)
  const popover = createPopover(opts)
  const destroy = popover.mount({ trigger, content })
  return { popover, destroy }
}

export interface MountAvatarOptions extends AvatarOptions {
  image: HTMLImageElement | string
  fallback?: HTMLElement | string
  parent?: ParentNode
}

export interface MountedAvatar {
  avatar: Avatar
  destroy: () => void
}

export function mountAvatar(opts: MountAvatarOptions): MountedAvatar {
  const parent = opts.parent ?? document
  const image = resolve(opts.image as HTMLElement | string, parent) as HTMLImageElement
  const fallback = opts.fallback ? resolve(opts.fallback, parent) : undefined
  const avatar = createAvatar(opts)
  const destroy = avatar.mount({ image, fallback })
  return { avatar, destroy }
}

export interface MountProgressOptions extends ProgressOptions {
  root: HTMLElement | string
  indicator?: HTMLElement | string
  parent?: ParentNode
}

export interface MountedProgress {
  progress: Progress
  destroy: () => void
}

export function mountProgress(opts: MountProgressOptions): MountedProgress {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const indicator = opts.indicator ? resolve(opts.indicator, parent) : undefined
  const progress = createProgress(opts)
  const destroy = progress.mount({ root, indicator })
  return { progress, destroy }
}

export interface MountMenuOptions extends MenuOptions {
  trigger: HTMLElement | string
  content: HTMLElement | string
  parent?: ParentNode
}

export interface MountedMenu {
  menu: Menu
  destroy: () => void
}

export function mountMenu(opts: MountMenuOptions): MountedMenu {
  const parent = opts.parent ?? document
  const trigger = resolve(opts.trigger, parent)
  const content = resolve(opts.content, parent)
  const menu = createMenu(opts)
  const destroy = menu.mount({ trigger, content })
  return { menu, destroy }
}

export interface MountContextMenuOptions extends ContextMenuOptions {
  anchor: HTMLElement | string
  content: HTMLElement | string
  parent?: ParentNode
}

export interface MountedContextMenu {
  contextMenu: ContextMenu
  destroy: () => void
}

export function mountContextMenu(opts: MountContextMenuOptions): MountedContextMenu {
  const parent = opts.parent ?? document
  const anchor = resolve(opts.anchor, parent)
  const content = resolve(opts.content, parent)
  const contextMenu = createContextMenu(opts)
  const destroy = contextMenu.mount({ anchor, content })
  return { contextMenu, destroy }
}

export interface MountSliderOptions extends SliderOptions {
  root: HTMLElement | string
  track: HTMLElement | string
  /** Optional DOM element that visually fills the selected range. */
  rangeEl?: HTMLElement | string
  thumbs: Array<HTMLElement | string>
  parent?: ParentNode
}

export interface MountedSlider {
  slider: Slider
  destroy: () => void
}

export function mountSlider(opts: MountSliderOptions): MountedSlider {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const track = resolve(opts.track, parent)
  const rangeEl = opts.rangeEl ? resolve(opts.rangeEl, parent) : undefined
  const thumbs = opts.thumbs.map((t) => resolve(t, parent))
  const slider = createSlider(opts)
  const destroy = slider.mount({ root, track, range: rangeEl, thumbs })
  return { slider, destroy }
}

export interface MountRadioGroupOptions extends RadioGroupOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedRadioGroup {
  radioGroup: RadioGroup
  destroy: () => void
}

export function mountRadioGroup(opts: MountRadioGroupOptions): MountedRadioGroup {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const radioGroup = createRadioGroup(opts)
  const destroy = radioGroup.mount(root)
  return { radioGroup, destroy }
}

export interface MountCheckboxOptions extends CheckboxOptions {
  root: HTMLElement | string
  hiddenInput?: HTMLInputElement | string
  parent?: ParentNode
}

export interface MountedCheckbox {
  checkbox: Checkbox
  destroy: () => void
}

export function mountCheckbox(opts: MountCheckboxOptions): MountedCheckbox {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const hiddenInput = opts.hiddenInput
    ? (resolve(opts.hiddenInput as HTMLElement | string, parent) as HTMLInputElement)
    : undefined
  const checkbox = createCheckbox(opts)
  const destroy = checkbox.mount({ root, hiddenInput })
  return { checkbox, destroy }
}

/**
 * Move `content` into the portal `target` (defaults to document.body) for
 * the lifetime of the returned cleanup. The original parent and next-
 * sibling are restored on cleanup. Useful when a Dialog/Popover content
 * lives inside an `overflow: hidden` parent that would otherwise clip it.
 *
 * Pure DOM — no framework involved. Returns null in SSR or when the
 * target selector doesn't match.
 */
export interface MountPortalOptions {
  content: HTMLElement
  target?: PortalTarget
}

export function mountPortal(opts: MountPortalOptions): (() => void) | null {
  const dest = resolvePortalTarget(opts.target)
  if (!dest) return null
  const originalParent = opts.content.parentNode
  const originalNextSibling = opts.content.nextSibling
  dest.append(opts.content)
  let released = false
  return () => {
    if (released) return
    released = true
    if (originalParent) {
      originalParent.insertBefore(opts.content, originalNextSibling)
    } else {
      opts.content.remove()
    }
  }
}

export interface MountToasterOptions extends ToasterOptions {
  viewport: HTMLElement | string
  parent?: ParentNode
}

export interface MountedToaster {
  toaster: Toaster
  destroy: () => void
}

/**
 * Wire a Toaster to a viewport `<ol>` (or any element). Returns the toaster
 * for `add()` / `dismiss()` calls plus a cleanup. Rendering each toast inside
 * the viewport is the consumer's job — subscribe to `toaster.toasts` and
 * mirror the array into the DOM.
 */
export function mountToaster(opts: MountToasterOptions): MountedToaster {
  const parent = opts.parent ?? document
  const viewport = resolve(opts.viewport, parent)
  const toaster = createToaster(opts)
  const destroy = toaster.mount(viewport)
  return { toaster, destroy }
}

export interface MountComboboxOptions extends ComboboxOptions {
  input: HTMLElement | string
  listbox: HTMLElement | string
  trigger?: HTMLElement | string
  parent?: ParentNode
}

export interface MountedCombobox {
  combobox: Combobox
  destroy: () => void
}

export function mountCombobox(opts: MountComboboxOptions): MountedCombobox {
  const parent = opts.parent ?? document
  const input = resolve(opts.input, parent) as HTMLInputElement
  const listbox = resolve(opts.listbox, parent)
  const trigger = opts.trigger ? resolve(opts.trigger, parent) : undefined
  const combobox = createCombobox(opts)
  const destroy = combobox.mount({ input, listbox, trigger })
  return { combobox, destroy }
}

export interface MountSeparatorOptions extends SeparatorOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedSeparator {
  separator: Separator
  destroy: () => void
}

export function mountSeparator(opts: MountSeparatorOptions): MountedSeparator {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const separator = createSeparator(opts)
  const props = separator.getRootProps()
  root.setAttribute("role", props.role)
  if (props["aria-orientation"]) root.setAttribute("aria-orientation", props["aria-orientation"])
  root.setAttribute("data-orientation", props["data-orientation"])
  return {
    separator,
    destroy: () => {
      root.removeAttribute("role")
      root.removeAttribute("aria-orientation")
      root.removeAttribute("data-orientation")
    },
  }
}

export interface MountVisuallyHiddenOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedVisuallyHidden {
  visuallyHidden: VisuallyHidden
  destroy: () => void
}

export interface MountCollapsibleOptions extends CollapsibleOptions {
  trigger: HTMLElement | string
  panel: HTMLElement | string
  root?: ParentNode
}

export interface MountedCollapsible {
  collapsible: Collapsible
  destroy: () => void
}

export function mountCollapsible(opts: MountCollapsibleOptions): MountedCollapsible {
  const root = opts.root ?? document
  const trigger = resolve(opts.trigger, root)
  const panel = resolve(opts.panel, root)
  const collapsible = createCollapsible(opts)
  const destroy = collapsible.mount({ trigger, panel })
  return { collapsible, destroy }
}

export interface MountAlertDialogOptions extends AlertDialogOptions {
  trigger?: HTMLElement | string
  content: HTMLElement | string
  overlay?: HTMLElement | string
  parent?: ParentNode
}

export interface MountedAlertDialog {
  alertDialog: AlertDialog
  destroy: () => void
}

export function mountAlertDialog(opts: MountAlertDialogOptions): MountedAlertDialog {
  const parent = opts.parent ?? document
  const trigger = opts.trigger ? resolve(opts.trigger, parent) : undefined
  const content = resolve(opts.content, parent)
  const overlay = opts.overlay ? resolve(opts.overlay, parent) : undefined
  const alertDialog = createAlertDialog(opts)
  const destroy = alertDialog.mount({ trigger, content, overlay })
  return { alertDialog, destroy }
}

export interface MountHoverCardOptions extends HoverCardOptions {
  trigger: HTMLElement | string
  content: HTMLElement | string
  parent?: ParentNode
}

export interface MountedHoverCard {
  hoverCard: HoverCard
  destroy: () => void
}

export function mountHoverCard(opts: MountHoverCardOptions): MountedHoverCard {
  const parent = opts.parent ?? document
  const trigger = resolve(opts.trigger, parent)
  const content = resolve(opts.content, parent)
  const hoverCard = createHoverCard(opts)
  const destroy = hoverCard.mount({ trigger, content })
  return { hoverCard, destroy }
}

export interface MountLabelOptions extends LabelOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedLabel {
  label: Label
  destroy: () => void
}

export function mountLabel(opts: MountLabelOptions): MountedLabel {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const label = createLabel(opts)
  const props = label.getRootProps()
  if (props.for) root.setAttribute("for", props.for)
  if (props.id) root.id = props.id
  return {
    label,
    destroy: () => {
      root.removeAttribute("for")
    },
  }
}

export interface MountAspectRatioOptions extends AspectRatioOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedAspectRatio {
  aspectRatio: AspectRatio
  destroy: () => void
}

export interface MountBreadcrumbOptions extends BreadcrumbOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedBreadcrumb {
  breadcrumb: Breadcrumb
  destroy: () => void
}

/**
 * Wires the root `<nav>` element with role + aria-label. The `<ol>` and items
 * remain the caller's responsibility — call `breadcrumb.getItemProps({ current })`
 * during render and apply the returned attributes by hand.
 */
export interface MountPaginationOptions extends PaginationOptions {
  root: HTMLElement | string
  parent?: ParentNode
}

export interface MountedPagination {
  pagination: Pagination
  destroy: () => void
}

/**
 * Wires the root `<nav>` with the pagination role + label. Caller renders
 * page buttons themselves and reads `pagination.pages` to discover what to
 * draw. The primitive is signal-driven so re-render is the caller's job
 * (subscribe to `pagination.page` for vanilla).
 */
export function mountPagination(opts: MountPaginationOptions): MountedPagination {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const pagination = createPagination(opts)
  const props = pagination.getRootProps()
  root.setAttribute("role", props.role)
  root.setAttribute("aria-label", props["aria-label"])
  return {
    pagination,
    destroy: () => {
      root.removeAttribute("role")
      root.removeAttribute("aria-label")
    },
  }
}

export function mountBreadcrumb(opts: MountBreadcrumbOptions): MountedBreadcrumb {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const breadcrumb = createBreadcrumb(opts)
  const props = breadcrumb.getRootProps()
  root.setAttribute("role", props.role)
  root.setAttribute("aria-label", props["aria-label"])
  return {
    breadcrumb,
    destroy: () => {
      root.removeAttribute("role")
      root.removeAttribute("aria-label")
    },
  }
}

export function mountAspectRatio(opts: MountAspectRatioOptions): MountedAspectRatio {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const aspectRatio = createAspectRatio(opts)
  const previous = root.getAttribute("style") ?? ""
  Object.assign(root.style, aspectRatio.getRootProps().style)
  return {
    aspectRatio,
    destroy: () => {
      root.setAttribute("style", previous)
    },
  }
}

export function mountVisuallyHidden(opts: MountVisuallyHiddenOptions): MountedVisuallyHidden {
  const parent = opts.parent ?? document
  const root = resolve(opts.root, parent)
  const visuallyHidden = createVisuallyHidden()
  const style = visuallyHidden.getRootProps().style
  const previous = root.getAttribute("style") ?? ""
  Object.assign(root.style, style)
  return {
    visuallyHidden,
    destroy: () => {
      root.setAttribute("style", previous)
    },
  }
}

export interface MountNumberInputOptions extends NumberInputOptions {
  input: HTMLInputElement | string
  increment?: HTMLElement | string
  decrement?: HTMLElement | string
  hiddenInput?: HTMLInputElement | string
  parent?: ParentNode
}

export interface MountedNumberInput {
  numberInput: NumberInput
  destroy: () => void
}

/**
 * Wires a number input + optional increment/decrement buttons. Call render
 * subscribers yourself via `numberInput.value.subscribe(...)` if you need to
 * react to changes; the props are applied imperatively here, mirroring the
 * other vanilla mount helpers.
 */
export function mountNumberInput(opts: MountNumberInputOptions): MountedNumberInput {
  const parent = opts.parent ?? document
  const input = resolve(opts.input as HTMLElement | string, parent) as HTMLInputElement
  const inc = opts.increment ? resolve(opts.increment, parent) : undefined
  const dec = opts.decrement ? resolve(opts.decrement, parent) : undefined
  const hidden = opts.hiddenInput
    ? (resolve(opts.hiddenInput as HTMLElement | string, parent) as HTMLInputElement)
    : undefined
  const numberInput = createNumberInput(opts)

  const apply = (): void => {
    const p = numberInput.getInputProps()
    input.type = p.type
    input.setAttribute("inputmode", p.inputmode)
    input.setAttribute("autocomplete", p.autocomplete)
    input.setAttribute("role", p.role)
    input.value = p.value
    if (p["aria-valuenow"] != null) input.setAttribute("aria-valuenow", String(p["aria-valuenow"]))
    if (p["aria-valuemin"] != null) input.setAttribute("aria-valuemin", String(p["aria-valuemin"]))
    if (p["aria-valuemax"] != null) input.setAttribute("aria-valuemax", String(p["aria-valuemax"]))
    if (p["aria-valuetext"]) input.setAttribute("aria-valuetext", p["aria-valuetext"])
    input.disabled = !!p["aria-disabled"]
    input.readOnly = !!p.readOnly
    if (inc) {
      const ip = numberInput.getIncrementProps()
      ;(inc as HTMLButtonElement).disabled = ip.disabled
    }
    if (dec) {
      const dp = numberInput.getDecrementProps()
      ;(dec as HTMLButtonElement).disabled = dp.disabled
    }
    if (hidden) {
      const hp = numberInput.getHiddenInputProps()
      if (hp) {
        hidden.type = "hidden"
        hidden.name = hp.name
        hidden.value = hp.value
      }
    }
  }

  const onInput = (): void => {
    numberInput.getInputProps().onInput({ currentTarget: { value: input.value } })
  }
  const onKeyDown = (e: KeyboardEvent): void => {
    numberInput.getInputProps().onKeyDown({
      key: e.key,
      preventDefault: () => e.preventDefault(),
    })
  }
  const onBlur = (): void => numberInput.getInputProps().onBlur()
  const onIncDown = (e: PointerEvent): void => {
    numberInput.getIncrementProps().onPointerDown({ preventDefault: () => e.preventDefault() })
  }
  const onIncUp = (): void => numberInput.getIncrementProps().onPointerUp()
  const onIncLeave = (): void => numberInput.getIncrementProps().onPointerLeave()
  const onDecDown = (e: PointerEvent): void => {
    numberInput.getDecrementProps().onPointerDown({ preventDefault: () => e.preventDefault() })
  }
  const onDecUp = (): void => numberInput.getDecrementProps().onPointerUp()
  const onDecLeave = (): void => numberInput.getDecrementProps().onPointerLeave()

  apply()
  input.addEventListener("input", onInput)
  input.addEventListener("keydown", onKeyDown)
  input.addEventListener("blur", onBlur)
  inc?.addEventListener("pointerdown", onIncDown as EventListener)
  inc?.addEventListener("pointerup", onIncUp)
  inc?.addEventListener("pointerleave", onIncLeave)
  dec?.addEventListener("pointerdown", onDecDown as EventListener)
  dec?.addEventListener("pointerup", onDecUp)
  dec?.addEventListener("pointerleave", onDecLeave)

  const unsub = numberInput.value.subscribe(apply)
  const unsub2 = numberInput.inputValue.subscribe(apply)

  return {
    numberInput,
    destroy: () => {
      unsub()
      unsub2()
      input.removeEventListener("input", onInput)
      input.removeEventListener("keydown", onKeyDown)
      input.removeEventListener("blur", onBlur)
      inc?.removeEventListener("pointerdown", onIncDown as EventListener)
      inc?.removeEventListener("pointerup", onIncUp)
      inc?.removeEventListener("pointerleave", onIncLeave)
      dec?.removeEventListener("pointerdown", onDecDown as EventListener)
      dec?.removeEventListener("pointerup", onDecUp)
      dec?.removeEventListener("pointerleave", onDecLeave)
    },
  }
}

export interface MountOtpInputOptions extends OtpInputOptions {
  cells: Array<HTMLInputElement | string>
  hiddenInput?: HTMLInputElement | string
  parent?: ParentNode
}

export interface MountedOtpInput {
  otpInput: OtpInput
  destroy: () => void
}

/**
 * Wires an array of pre-rendered cell <input>s. Each input gets its props
 * applied + handlers attached; the primitive's getCellId is overwritten to
 * point at the actual element id so its internal focusCell can find it.
 */
export function mountOtpInput(opts: MountOtpInputOptions): MountedOtpInput {
  const parent = opts.parent ?? document
  const cells = opts.cells.map(
    (c) => resolve(c as HTMLElement | string, parent) as HTMLInputElement,
  )
  const hidden = opts.hiddenInput
    ? (resolve(opts.hiddenInput as HTMLElement | string, parent) as HTMLInputElement)
    : undefined
  const otpInput = createOtpInput({ ...opts, length: cells.length })

  // Replace the primitive-generated cell ids with the real DOM ids so that
  // the internal focusCell(index) can locate the right element.
  for (let i = 0; i < cells.length; i++) cells[i]!.id = otpInput.getCellId(i)

  const apply = (): void => {
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]!
      const p = otpInput.getCellProps(i)
      cell.type = p.type
      cell.setAttribute("inputmode", p.inputmode)
      cell.setAttribute("autocomplete", p.autocomplete)
      cell.setAttribute("maxlength", String(p.maxlength))
      cell.setAttribute("pattern", p.pattern)
      cell.value = p.value
      cell.setAttribute("aria-label", p["aria-label"])
      cell.disabled = !!p.disabled
    }
    if (hidden) {
      const hp = otpInput.getHiddenInputProps()
      if (hp) {
        hidden.type = "hidden"
        hidden.name = hp.name
        hidden.value = hp.value
      }
    }
  }

  const handlers = cells.map((cell, i) => {
    const p = otpInput.getCellProps(i)
    const onInput = (): void => p.onInput({ currentTarget: { value: cell.value } })
    const onKeyDown = (e: KeyboardEvent): void =>
      p.onKeyDown({ key: e.key, preventDefault: () => e.preventDefault() })
    const onPaste = (e: ClipboardEvent): void =>
      p.onPaste({
        clipboardData: e.clipboardData ?? undefined,
        preventDefault: () => e.preventDefault(),
      })
    const onFocus = (): void => p.onFocus({ currentTarget: cell })
    cell.addEventListener("input", onInput)
    cell.addEventListener("keydown", onKeyDown)
    cell.addEventListener("paste", onPaste)
    cell.addEventListener("focus", onFocus)
    return { cell, onInput, onKeyDown, onPaste, onFocus }
  })

  apply()
  const unsub = otpInput.value.subscribe(apply)

  return {
    otpInput,
    destroy: () => {
      unsub()
      for (const h of handlers) {
        h.cell.removeEventListener("input", h.onInput)
        h.cell.removeEventListener("keydown", h.onKeyDown)
        h.cell.removeEventListener("paste", h.onPaste)
        h.cell.removeEventListener("focus", h.onFocus)
      }
    },
  }
}
