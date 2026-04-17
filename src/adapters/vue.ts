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
