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
