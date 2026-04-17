import {
  createAccordion,
  type Accordion,
  type AccordionItemProps,
  type AccordionOptions,
  type AccordionPanelProps,
  type AccordionTriggerProps,
  type RegisterItemOptions,
} from "../primitives/accordion.ts"
import {
  createDialog,
  type Dialog,
  type DialogContentProps,
  type DialogOptions,
  type DialogOverlayProps,
  type DialogTriggerProps,
} from "../primitives/dialog.ts"
import {
  createMenu,
  type Menu,
  type MenuContentProps,
  type MenuItemProps,
  type MenuOptions,
  type MenuTriggerProps,
  type RegisterMenuItemOptions,
} from "../primitives/menu.ts"
import {
  createPopover,
  type Popover,
  type PopoverContentProps,
  type PopoverOptions,
  type PopoverTriggerProps,
} from "../primitives/popover.ts"
import {
  createAvatar,
  type Avatar,
  type AvatarFallbackProps,
  type AvatarImageProps,
  type AvatarOptions,
} from "../primitives/avatar.ts"
import {
  createProgress,
  type Progress,
  type ProgressIndicatorProps,
  type ProgressOptions,
  type ProgressRootProps,
} from "../primitives/progress.ts"
import {
  createTooltip,
  type Tooltip,
  type TooltipContentProps,
  type TooltipOptions,
  type TooltipTriggerProps,
} from "../primitives/tooltip.ts"
import {
  createDisclosure,
  type Disclosure,
  type DisclosureOptions,
  type DisclosurePanelProps,
  type DisclosureTriggerProps,
} from "../primitives/disclosure.ts"
import {
  createSwitch,
  type Switch,
  type SwitchHiddenInputProps,
  type SwitchOptions,
  type SwitchRootProps,
  type SwitchThumbProps,
} from "../primitives/switch.ts"
import {
  createToggleGroup,
  type RegisterItemOptions as ToggleGroupRegisterItemOptions,
  type ToggleGroup,
  type ToggleGroupItemProps,
  type ToggleGroupOptions,
  type ToggleGroupRootProps,
} from "../primitives/toggle-group.ts"
import {
  createToggle,
  type Toggle,
  type ToggleOptions,
  type ToggleRootProps,
} from "../primitives/toggle.ts"
import {
  createTabs,
  type RegisterTabOptions,
  type TabPanelProps,
  type TabProps,
  type Tabs,
  type TabsOptions,
} from "../primitives/tabs.ts"

interface Ref<T> {
  value: T
}

interface VueLike {
  ref: <T>(value: T) => Ref<T>
  computed: <T>(getter: () => T) => Ref<T>
  onScopeDispose: (fn: () => void) => void
}

export interface VueDisclosure extends Disclosure {
  triggerProps: Ref<DisclosureTriggerProps>
  panelProps: Ref<DisclosurePanelProps>
  isOpen: Ref<boolean>
}

export function createUseDisclosure(Vue: VueLike) {
  return function useDisclosure(opts: DisclosureOptions = {}): VueDisclosure {
    const tick = Vue.ref(0)
    const disclosure = createDisclosure(opts)

    const unsub = disclosure.open.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const triggerProps = Vue.computed(() => {
      void tick.value
      return disclosure.getTriggerProps()
    })
    const panelProps = Vue.computed(() => {
      void tick.value
      return disclosure.getPanelProps()
    })
    const isOpen = Vue.computed(() => {
      void tick.value
      return disclosure.open.get()
    })

    return {
      ...disclosure,
      triggerProps,
      panelProps,
      isOpen,
    }
  }
}

export interface VueAccordion extends Accordion {
  /** Bumps every time the open set changes; used internally by useAccordionItem. */
  tick: Ref<number>
}

export type VueAccordionTriggerProps = Omit<AccordionTriggerProps, "onKeyDown"> & {
  onKeydown: AccordionTriggerProps["onKeyDown"]
}

export interface VueAccordionItem {
  itemProps: Ref<AccordionItemProps>
  triggerProps: Ref<VueAccordionTriggerProps>
  panelProps: Ref<AccordionPanelProps>
  isOpen: Ref<boolean>
  isDisabled: Ref<boolean>
}

export function createUseAccordion(Vue: VueLike) {
  return function useAccordion(opts: AccordionOptions = {}): VueAccordion {
    const tick = Vue.ref(0)
    const accordion = createAccordion(opts)
    const unsub = accordion.values.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)
    return { ...accordion, tick }
  }
}

export function createUseAccordionItem(Vue: VueLike) {
  return function useAccordionItem(
    accordion: VueAccordion,
    value: string,
    opts: RegisterItemOptions = {},
  ): VueAccordionItem {
    if (!accordion.hasItem(value)) {
      accordion.registerItem(value, opts)
    } else {
      // re-apply opts (e.g. disabled getter) on re-setup
      accordion.registerItem(value, opts)
    }
    Vue.onScopeDispose(() => {
      // best-effort cleanup; safe even if the user keeps the value alive elsewhere
    })

    const itemProps = Vue.computed(() => {
      void accordion.tick.value
      return accordion.getItemProps(value)
    })
    const triggerProps = Vue.computed(() => {
      void accordion.tick.value
      const { onClick, onKeyDown, ...rest } = accordion.getTriggerProps(value)
      return { ...rest, onClick, onKeydown: onKeyDown }
    })
    const panelProps = Vue.computed(() => {
      void accordion.tick.value
      return accordion.getPanelProps(value)
    })
    const isOpen = Vue.computed(() => {
      void accordion.tick.value
      return accordion.isOpen(value)
    })
    const isDisabled = Vue.computed(() => {
      void accordion.tick.value
      return accordion.isItemDisabled(value)
    })

    return { itemProps, triggerProps, panelProps, isOpen, isDisabled }
  }
}

export interface VueTabs extends Tabs {
  tick: Ref<number>
}

export type VueTabProps = Omit<TabProps, "onKeyDown"> & {
  onKeydown: TabProps["onKeyDown"]
}

export interface VueTab {
  tabProps: Ref<VueTabProps>
  panelProps: Ref<TabPanelProps>
  isSelected: Ref<boolean>
  isDisabled: Ref<boolean>
}

export function createUseTabs(Vue: VueLike) {
  return function useTabs(opts: TabsOptions = {}): VueTabs {
    const tick = Vue.ref(0)
    const tabs = createTabs(opts)
    const unsub = tabs.value.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)
    return { ...tabs, tick }
  }
}

export function createUseTab(Vue: VueLike) {
  return function useTab(tabs: VueTabs, value: string, opts: RegisterTabOptions = {}): VueTab {
    tabs.registerTab(value, opts)

    const tabProps = Vue.computed(() => {
      void tabs.tick.value
      const { onClick, onKeyDown, ...rest } = tabs.getTabProps(value)
      return { ...rest, onClick, onKeydown: onKeyDown }
    })
    const panelProps = Vue.computed(() => {
      void tabs.tick.value
      return tabs.getPanelProps(value)
    })
    const isSelected = Vue.computed(() => {
      void tabs.tick.value
      return tabs.isSelected(value)
    })
    const isDisabled = Vue.computed(() => {
      void tabs.tick.value
      return tabs.isTabDisabled(value)
    })

    return { tabProps, panelProps, isSelected, isDisabled }
  }
}

export interface VueSwitch extends Switch {
  rootProps: Ref<SwitchRootProps>
  thumbProps: Ref<SwitchThumbProps>
  hiddenInputProps: Ref<SwitchHiddenInputProps | null>
  isChecked: Ref<boolean>
}

export function createUseSwitch(Vue: VueLike) {
  return function useSwitch(opts: SwitchOptions = {}): VueSwitch {
    const tick = Vue.ref(0)
    const sw = createSwitch(opts)
    const unsub = sw.checked.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const rootProps = Vue.computed(() => {
      void tick.value
      return sw.getRootProps()
    })
    const thumbProps = Vue.computed(() => {
      void tick.value
      return sw.getThumbProps()
    })
    const hiddenInputProps = Vue.computed(() => {
      void tick.value
      return sw.getHiddenInputProps()
    })
    const isChecked = Vue.computed(() => {
      void tick.value
      return sw.checked.get()
    })

    return { ...sw, rootProps, thumbProps, hiddenInputProps, isChecked }
  }
}

export interface VueToggle extends Toggle {
  rootProps: Ref<ToggleRootProps>
  isPressed: Ref<boolean>
}

export function createUseToggle(Vue: VueLike) {
  return function useToggle(opts: ToggleOptions = {}): VueToggle {
    const tick = Vue.ref(0)
    const tg = createToggle(opts)
    const unsub = tg.pressed.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const rootProps = Vue.computed(() => {
      void tick.value
      return tg.getRootProps()
    })
    const isPressed = Vue.computed(() => {
      void tick.value
      return tg.pressed.get()
    })

    return { ...tg, rootProps, isPressed }
  }
}

export interface VueToggleGroup extends ToggleGroup {
  rootProps: Ref<ToggleGroupRootProps>
  tick: Ref<number>
}

export type VueToggleGroupItemProps = Omit<ToggleGroupItemProps, "onKeyDown"> & {
  onKeydown: ToggleGroupItemProps["onKeyDown"]
}

export interface VueToggleGroupItem {
  itemProps: Ref<VueToggleGroupItemProps>
  isPressed: Ref<boolean>
  isDisabled: Ref<boolean>
}

export function createUseToggleGroup(Vue: VueLike) {
  return function useToggleGroup(opts: ToggleGroupOptions = {}): VueToggleGroup {
    const tick = Vue.ref(0)
    const group = createToggleGroup(opts)
    const unsub = group.values.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const rootProps = Vue.computed(() => {
      void tick.value
      return group.getRootProps()
    })

    return { ...group, rootProps, tick }
  }
}

export function createUseToggleGroupItem(Vue: VueLike) {
  return function useToggleGroupItem(
    group: VueToggleGroup,
    value: string,
    opts: ToggleGroupRegisterItemOptions = {},
  ): VueToggleGroupItem {
    group.registerItem(value, opts)

    const itemProps = Vue.computed(() => {
      void group.tick.value
      const { onClick, onKeyDown, ...rest } = group.getItemProps(value)
      return { ...rest, onClick, onKeydown: onKeyDown }
    })
    const isPressed = Vue.computed(() => {
      void group.tick.value
      return group.isPressed(value)
    })
    const isDisabled = Vue.computed(() => {
      void group.tick.value
      return group.isItemDisabled(value)
    })

    return { itemProps, isPressed, isDisabled }
  }
}

export interface VueDialog extends Dialog {
  triggerProps: Ref<DialogTriggerProps>
  overlayProps: Ref<DialogOverlayProps>
  contentProps: Ref<DialogContentProps>
  isOpen: Ref<boolean>
}

export function createUseDialog(Vue: VueLike) {
  return function useDialog(opts: DialogOptions = {}): VueDialog {
    const tick = Vue.ref(0)
    const dialog = createDialog(opts)
    const unsub = dialog.open.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const triggerProps = Vue.computed(() => {
      void tick.value
      return dialog.getTriggerProps()
    })
    const overlayProps = Vue.computed(() => {
      void tick.value
      return dialog.getOverlayProps()
    })
    const contentProps = Vue.computed(() => {
      void tick.value
      return dialog.getContentProps()
    })
    const isOpen = Vue.computed(() => {
      void tick.value
      return dialog.open.get()
    })

    return { ...dialog, triggerProps, overlayProps, contentProps, isOpen }
  }
}

export interface VueTooltip extends Tooltip {
  triggerProps: Ref<TooltipTriggerProps>
  contentProps: Ref<TooltipContentProps>
  isOpen: Ref<boolean>
}

export function createUseTooltip(Vue: VueLike) {
  return function useTooltip(opts: TooltipOptions = {}): VueTooltip {
    const tick = Vue.ref(0)
    const tooltip = createTooltip(opts)
    const unsub = tooltip.open.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const triggerProps = Vue.computed(() => {
      void tick.value
      return tooltip.getTriggerProps()
    })
    const contentProps = Vue.computed(() => {
      void tick.value
      return tooltip.getContentProps()
    })
    const isOpen = Vue.computed(() => {
      void tick.value
      return tooltip.open.get()
    })

    return { ...tooltip, triggerProps, contentProps, isOpen }
  }
}

export interface VuePopover extends Popover {
  triggerProps: Ref<PopoverTriggerProps>
  contentProps: Ref<PopoverContentProps>
  isOpen: Ref<boolean>
}

export function createUsePopover(Vue: VueLike) {
  return function usePopover(opts: PopoverOptions = {}): VuePopover {
    const tick = Vue.ref(0)
    const popover = createPopover(opts)
    const unsub = popover.open.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const triggerProps = Vue.computed(() => {
      void tick.value
      return popover.getTriggerProps()
    })
    const contentProps = Vue.computed(() => {
      void tick.value
      return popover.getContentProps()
    })
    const isOpen = Vue.computed(() => {
      void tick.value
      return popover.open.get()
    })

    return { ...popover, triggerProps, contentProps, isOpen }
  }
}

export interface VueAvatar extends Avatar {
  imageProps: Ref<AvatarImageProps>
  fallbackProps: Ref<AvatarFallbackProps>
}

export function createUseAvatar(Vue: VueLike) {
  return function useAvatar(opts: AvatarOptions & { alt?: string } = {}): VueAvatar {
    const tick = Vue.ref(0)
    const avatar = createAvatar(opts)
    const unsub = avatar.status.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const imageProps = Vue.computed(() => {
      void tick.value
      return avatar.getImageProps(opts.alt ?? "")
    })
    const fallbackProps = Vue.computed(() => {
      void tick.value
      return avatar.getFallbackProps()
    })

    return { ...avatar, imageProps, fallbackProps }
  }
}

export interface VueProgress extends Progress {
  rootProps: Ref<ProgressRootProps>
  indicatorProps: Ref<ProgressIndicatorProps>
}

export function createUseProgress(Vue: VueLike) {
  return function useProgress(opts: ProgressOptions = {}): VueProgress {
    const tick = Vue.ref(0)
    const progress = createProgress(opts)
    const unsub = progress.value.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)

    const rootProps = Vue.computed(() => {
      void tick.value
      return progress.getRootProps()
    })
    const indicatorProps = Vue.computed(() => {
      void tick.value
      return progress.getIndicatorProps()
    })

    return { ...progress, rootProps, indicatorProps }
  }
}

export type VueMenuTriggerProps = Omit<MenuTriggerProps, "onKeyDown"> & {
  onKeydown: MenuTriggerProps["onKeyDown"]
}

export type VueMenuContentProps = Omit<MenuContentProps, "onKeyDown"> & {
  onKeydown: MenuContentProps["onKeyDown"]
}

export type VueMenuItemProps = Omit<MenuItemProps, "onMouseEnter"> & {
  onMouseenter: MenuItemProps["onMouseEnter"]
}

export interface VueMenu extends Menu {
  triggerProps: Ref<VueMenuTriggerProps>
  contentProps: Ref<VueMenuContentProps>
  isOpen: Ref<boolean>
  tick: Ref<number>
}

export function createUseMenu(Vue: VueLike) {
  return function useMenu(opts: MenuOptions = {}): VueMenu {
    const tick = Vue.ref(0)
    const menu = createMenu(opts)
    const offOpen = menu.open.subscribe(() => {
      tick.value++
    })
    const offHi = menu.highlighted.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(() => {
      offOpen()
      offHi()
    })

    const triggerProps = Vue.computed(() => {
      void tick.value
      const { onClick, onKeyDown, ...rest } = menu.getTriggerProps()
      return { ...rest, onClick, onKeydown: onKeyDown }
    })
    const contentProps = Vue.computed(() => {
      void tick.value
      const { onKeyDown, ...rest } = menu.getContentProps()
      return { ...rest, onKeydown: onKeyDown }
    })
    const isOpen = Vue.computed(() => {
      void tick.value
      return menu.open.get()
    })

    return { ...menu, triggerProps, contentProps, isOpen, tick }
  }
}

export interface VueMenuItem {
  itemProps: Ref<VueMenuItemProps>
  isHighlighted: Ref<boolean>
  isDisabled: Ref<boolean>
}

export function createUseMenuItem(Vue: VueLike) {
  return function useMenuItem(
    menu: VueMenu,
    value: string,
    opts: RegisterMenuItemOptions = {},
  ): VueMenuItem {
    menu.registerItem(value, opts)

    const itemProps = Vue.computed(() => {
      void menu.tick.value
      const { onClick, onMouseEnter, ...rest } = menu.getItemProps(value)
      return { ...rest, onClick, onMouseenter: onMouseEnter }
    })
    const isHighlighted = Vue.computed(() => {
      void menu.tick.value
      return menu.highlighted.get() === value
    })
    const isDisabled = Vue.computed(() => {
      void menu.tick.value
      return menu.isItemDisabled(value)
    })

    return { itemProps, isHighlighted, isDisabled }
  }
}
