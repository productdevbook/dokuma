import { createPresence, type PresenceStatus } from "../_presence.ts"
import type { Signal } from "../_signal.ts"
import {
  createAccordion,
  type Accordion,
  type AccordionItemProps,
  type AccordionOptions,
  type AccordionPanelProps,
  type RegisterItemOptions,
} from "../primitives/accordion.ts"
import {
  createCheckbox,
  type Checkbox,
  type CheckboxIndicatorProps,
  type CheckboxOptions,
  type CheckboxRootProps,
} from "../primitives/checkbox.ts"
import {
  createDialog,
  type Dialog,
  type DialogContentProps,
  type DialogOptions,
  type DialogOverlayProps,
  type DialogTriggerProps,
} from "../primitives/dialog.ts"
import {
  createRadioGroup,
  type RadioGroup,
  type RadioGroupOptions,
  type RadioGroupRootProps,
  type RegisterRadioOptions,
} from "../primitives/radio-group.ts"
import {
  createSlider,
  type Slider,
  type SliderOptions,
  type SliderRangeProps,
  type SliderRootProps,
  type SliderTrackProps,
} from "../primitives/slider.ts"
import {
  createMenu,
  type Menu,
  type MenuOptions,
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

export interface VuePresence {
  isMounted: Ref<boolean>
  status: Ref<PresenceStatus>
}

/**
 * Wrap an open `Signal<boolean>` (e.g. `dialog.open`) into Vue refs that
 * defer unmount until any CSS exit animation finishes. Pass an `elementRef`
 * (template ref) the primitive's content gets bound to.
 *
 *     const dialog = useDialog({ ... })
 *     const contentRef = ref<HTMLElement | null>(null)
 *     const presence = usePresence(dialog.open, contentRef)
 *     // <div v-if="presence.isMounted" ref="contentRef" v-bind="dialog.contentProps">
 */
export function createUsePresence(Vue: VueLike) {
  return function usePresence(
    openSignal: Signal<boolean>,
    elementRef: Ref<HTMLElement | null>,
  ): VuePresence {
    const tick = Vue.ref(0)
    const presence = createPresence(openSignal, () => elementRef.value)
    const unsub = presence.isMounted.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(() => {
      unsub()
      presence.destroy()
    })
    const isMounted = Vue.computed(() => {
      void tick.value
      return presence.isMounted.get()
    })
    const status = Vue.computed(() => {
      void tick.value
      return presence.status.get()
    })
    return { isMounted, status }
  }
}

/**
 * Vue 3 only recognizes prop keys matching `/^on[A-Z]/` as listeners and
 * derives the event name by lowercasing the first letter only. So `onClick`
 * → `click` works, but `onKeyDown` → `keyDown` (a non-existent event; the
 * real one is `keydown`). Convert `onPascalCase` keys to `onCamelCase`
 * (lowercase everything after the second letter) so all camelCase prop
 * names map to real DOM events. `onClick`, `onFocus` etc. pass through.
 */
function normalizeVueProps<T extends Record<string, unknown>>(props: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in props) {
    if (
      key.length > 3 &&
      key.startsWith("on") &&
      key[2] === key[2]?.toUpperCase() &&
      key.slice(3) !== key.slice(3).toLowerCase()
    ) {
      out[`on${key[2]}${key.slice(3).toLowerCase()}`] = props[key]
    } else {
      out[key] = props[key]
    }
  }
  return out
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

export interface VueAccordionItem {
  itemProps: Ref<AccordionItemProps>
  triggerProps: Ref<Record<string, unknown>>
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
      return normalizeVueProps(
        accordion.getTriggerProps(value) as unknown as Record<string, unknown>,
      )
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

export interface VueTab {
  tabProps: Ref<Record<string, unknown>>
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
      return normalizeVueProps(tabs.getTabProps(value) as unknown as Record<string, unknown>)
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

export interface VueToggleGroupItem {
  itemProps: Ref<Record<string, unknown>>
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
      return normalizeVueProps(group.getItemProps(value) as unknown as Record<string, unknown>)
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

export interface VueMenu extends Menu {
  triggerProps: Ref<Record<string, unknown>>
  contentProps: Ref<Record<string, unknown>>
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
      return normalizeVueProps(menu.getTriggerProps() as unknown as Record<string, unknown>)
    })
    const contentProps = Vue.computed(() => {
      void tick.value
      return normalizeVueProps(menu.getContentProps() as unknown as Record<string, unknown>)
    })
    const isOpen = Vue.computed(() => {
      void tick.value
      return menu.open.get()
    })

    return { ...menu, triggerProps, contentProps, isOpen, tick }
  }
}

export interface VueMenuItem {
  itemProps: Ref<Record<string, unknown>>
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
      return normalizeVueProps(menu.getItemProps(value) as unknown as Record<string, unknown>)
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

export interface VueSlider extends Slider {
  rootProps: Ref<SliderRootProps>
  trackProps: Ref<SliderTrackProps>
  rangeProps: Ref<SliderRangeProps>
  /** Use as `getThumbProps(idx)` factory for range mode; for single thumb the no-arg form works. */
  thumbProps: (idx?: 0 | 1) => Record<string, unknown>
  tick: Ref<number>
}

export function createUseSlider(Vue: VueLike) {
  return function useSlider(opts: SliderOptions = {}): VueSlider {
    const tick = Vue.ref(0)
    const slider = createSlider(opts)
    const unsub = slider.value.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)
    const rootProps = Vue.computed(() => {
      void tick.value
      return slider.getRootProps()
    })
    const trackProps = Vue.computed(() => {
      void tick.value
      return slider.getTrackProps()
    })
    const rangeProps = Vue.computed(() => {
      void tick.value
      return slider.getRangeProps()
    })
    const thumbProps = (idx?: 0 | 1): Record<string, unknown> =>
      normalizeVueProps(slider.getThumbProps(idx) as unknown as Record<string, unknown>)
    return { ...slider, rootProps, trackProps, rangeProps, thumbProps, tick }
  }
}

export interface VueRadioGroup extends RadioGroup {
  rootProps: Ref<RadioGroupRootProps>
  tick: Ref<number>
}

export interface VueRadioItem {
  itemProps: Ref<Record<string, unknown>>
  isChecked: Ref<boolean>
  isDisabled: Ref<boolean>
}

export function createUseRadioGroup(Vue: VueLike) {
  return function useRadioGroup(opts: RadioGroupOptions = {}): VueRadioGroup {
    const tick = Vue.ref(0)
    const group = createRadioGroup(opts)
    const unsub = group.value.subscribe(() => {
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

export function createUseRadioItem(Vue: VueLike) {
  return function useRadioItem(
    group: VueRadioGroup,
    value: string,
    opts: RegisterRadioOptions = {},
  ): VueRadioItem {
    group.registerItem(value, opts)
    const itemProps = Vue.computed(() => {
      void group.tick.value
      return normalizeVueProps(group.getItemProps(value) as unknown as Record<string, unknown>)
    })
    const isChecked = Vue.computed(() => {
      void group.tick.value
      return group.isChecked(value)
    })
    const isDisabled = Vue.computed(() => {
      void group.tick.value
      return group.isItemDisabled(value)
    })
    return { itemProps, isChecked, isDisabled }
  }
}

export interface VueCheckbox extends Checkbox {
  rootProps: Ref<CheckboxRootProps>
  indicatorProps: Ref<CheckboxIndicatorProps>
}

export function createUseCheckbox(Vue: VueLike) {
  return function useCheckbox(opts: CheckboxOptions = {}): VueCheckbox {
    const tick = Vue.ref(0)
    const cb = createCheckbox(opts)
    const unsub = cb.checked.subscribe(() => {
      tick.value++
    })
    Vue.onScopeDispose(unsub)
    const rootProps = Vue.computed(() => {
      void tick.value
      return cb.getRootProps()
    })
    const indicatorProps = Vue.computed(() => {
      void tick.value
      return cb.getIndicatorProps()
    })
    return { ...cb, rootProps, indicatorProps }
  }
}
