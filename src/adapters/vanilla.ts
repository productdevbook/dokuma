import { createAccordion, type Accordion, type AccordionOptions } from "../primitives/accordion.ts"
import { createDialog, type Dialog, type DialogOptions } from "../primitives/dialog.ts"
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
