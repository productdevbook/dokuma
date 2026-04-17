import { createPresence, type PresenceStatus } from "../_presence.ts"
import type { Signal } from "../_signal.ts"
import {
  createCombobox,
  type Combobox,
  type ComboboxOptionProps,
  type ComboboxOptions,
  type RegisterComboboxItemOptions,
} from "../primitives/combobox.ts"
import { createToaster, type Toaster, type ToasterOptions } from "../primitives/toaster.ts"
import {
  createAccordion,
  type Accordion,
  type AccordionItemProps,
  type AccordionOptions,
  type AccordionPanelProps,
  type AccordionTriggerProps,
  type RegisterItemOptions,
} from "../primitives/accordion.ts"
import { createAvatar, type Avatar, type AvatarOptions } from "../primitives/avatar.ts"
import { createCheckbox, type Checkbox, type CheckboxOptions } from "../primitives/checkbox.ts"
import { createDialog, type Dialog, type DialogOptions } from "../primitives/dialog.ts"
import {
  createRadioGroup,
  type RadioGroup,
  type RadioGroupOptions,
  type RegisterRadioOptions,
} from "../primitives/radio-group.ts"
import {
  createSlider,
  type Slider,
  type SliderOptions,
  type SliderValue,
} from "../primitives/slider.ts"
import {
  createMenu,
  type Menu,
  type MenuOptions,
  type RegisterMenuItemOptions,
} from "../primitives/menu.ts"
import {
  createContextMenu,
  type ContextMenu,
  type ContextMenuOptions,
} from "../primitives/context-menu.ts"
import { createSeparator, type Separator, type SeparatorOptions } from "../primitives/separator.ts"
import { createVisuallyHidden, type VisuallyHidden } from "../primitives/visually-hidden.ts"
import { createPopover, type Popover, type PopoverOptions } from "../primitives/popover.ts"
import { createProgress, type Progress, type ProgressOptions } from "../primitives/progress.ts"
import { createTooltip, type Tooltip, type TooltipOptions } from "../primitives/tooltip.ts"
import {
  createDisclosure,
  type Disclosure,
  type DisclosureOptions,
} from "../primitives/disclosure.ts"
import { createSwitch, type Switch, type SwitchOptions } from "../primitives/switch.ts"
import {
  createToggleGroup,
  type RegisterItemOptions as ToggleGroupRegisterItemOptions,
  type ToggleGroup,
  type ToggleGroupItemProps,
  type ToggleGroupOptions,
} from "../primitives/toggle-group.ts"
import { createToggle, type Toggle, type ToggleOptions } from "../primitives/toggle.ts"
import {
  createTabs,
  type RegisterTabOptions,
  type TabPanelProps,
  type TabProps,
  type Tabs,
  type TabsOptions,
} from "../primitives/tabs.ts"

type SetState<T> = (next: T | ((prev: T) => T)) => void

interface ReactRef<T> {
  current: T
}

interface ReactLike {
  useState: <T>(init: T | (() => T)) => [T, SetState<T>]
  useMemo: <T>(factory: () => T, deps: ReadonlyArray<unknown>) => T
  useEffect: (effect: () => void | (() => void), deps?: ReadonlyArray<unknown>) => void
  useRef?: <T>(init: T) => ReactRef<T>
}

export interface UsePresenceResult {
  isMounted: boolean
  status: PresenceStatus
}

/**
 * Wrap an open `Signal<boolean>` (e.g. `dialog.open`) into a React-friendly
 * presence state that defers unmount until any CSS exit animation finishes.
 *
 *     const dialog = useDialog({ open, onOpenChange })
 *     const ref = React.useRef<HTMLDivElement>(null)
 *     const presence = usePresence(dialog.open, ref)
 *     return presence.isMounted
 *       ? <div ref={ref} {...dialog.getContentProps()}>...</div>
 *       : null
 */
export function createUsePresence(React: ReactLike) {
  return function usePresence(
    openSignal: Signal<boolean>,
    elementRef: ReactRef<HTMLElement | null>,
  ): UsePresenceResult {
    const [, setTick] = React.useState(0)
    const presence = React.useMemo(
      () => createPresence(openSignal, () => elementRef.current),
      [openSignal, elementRef],
    )
    React.useEffect(() => {
      const unsub = presence.isMounted.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsub()
        presence.destroy()
      }
    }, [presence])
    return { isMounted: presence.isMounted.get(), status: presence.status.get() }
  }
}

export interface UseAccordionOptions extends Omit<AccordionOptions, "value"> {
  value?: string | string[]
}

export interface UseAccordionItemResult {
  itemProps: AccordionItemProps
  triggerProps: AccordionTriggerProps
  panelProps: AccordionPanelProps
  isOpen: boolean
  isDisabled: boolean
}

export interface UseDisclosureOptions extends Omit<DisclosureOptions, "open"> {
  open?: boolean
}

export function createUseDisclosure(React: ReactLike) {
  return function useDisclosure(opts: UseDisclosureOptions = {}): Disclosure {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const disclosure = React.useMemo(
      () =>
        createDisclosure({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          disabled: opts.disabled,
          onOpenChange: (next) => {
            optsRef.current.onOpenChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = disclosure.open.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [disclosure])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])

    return disclosure
  }
}

export function createUseAccordion(React: ReactLike) {
  return function useAccordion(opts: UseAccordionOptions = {}): Accordion {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const accordion = React.useMemo(
      () =>
        createAccordion({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string | string[] : undefined,
          onValueChange: (next) => {
            optsRef.current.onValueChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = accordion.values.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [accordion])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])

    return accordion
  }
}

export function createUseAccordionItem(React: ReactLike) {
  return function useAccordionItem(
    accordion: Accordion,
    value: string,
    opts: RegisterItemOptions = {},
  ): UseAccordionItemResult {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    React.useEffect(() => {
      const handle = accordion.registerItem(value, {
        disabled: optsRef.current.disabled
          ? () => optsRef.current.disabled?.() ?? false
          : undefined,
      })
      const unsub = accordion.values.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsub()
        handle.unregister()
      }
    }, [accordion, value])

    // useEffect runs after first render; ensure the item is registered for the
    // initial render too so the prop getters don't throw.
    if (!accordion.hasItem(value)) {
      accordion.registerItem(value, optsRef.current)
    }

    return {
      itemProps: accordion.getItemProps(value),
      triggerProps: accordion.getTriggerProps(value),
      panelProps: accordion.getPanelProps(value),
      isOpen: accordion.isOpen(value),
      isDisabled: accordion.isItemDisabled(value),
    }
  }
}

export interface UseTabsOptions extends Omit<TabsOptions, "value"> {
  value?: string
}

export interface UseTabResult {
  tabProps: TabProps
  panelProps: TabPanelProps
  isSelected: boolean
  isDisabled: boolean
}

export function createUseTabs(React: ReactLike) {
  return function useTabs(opts: UseTabsOptions = {}): Tabs {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const tabs = React.useMemo(
      () =>
        createTabs({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string : undefined,
          onValueChange: (next) => {
            optsRef.current.onValueChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = tabs.value.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [tabs])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])

    return tabs
  }
}

export function createUseTab(React: ReactLike) {
  return function useTab(tabs: Tabs, value: string, opts: RegisterTabOptions = {}): UseTabResult {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    React.useEffect(() => {
      const handle = tabs.registerTab(value, {
        disabled: optsRef.current.disabled
          ? () => optsRef.current.disabled?.() ?? false
          : undefined,
      })
      const unsub = tabs.value.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsub()
        handle.unregister()
      }
    }, [tabs, value])

    if (!tabs.hasTab(value)) {
      tabs.registerTab(value, optsRef.current)
    }

    return {
      tabProps: tabs.getTabProps(value),
      panelProps: tabs.getPanelProps(value),
      isSelected: tabs.isSelected(value),
      isDisabled: tabs.isTabDisabled(value),
    }
  }
}

export interface UseSwitchOptions extends Omit<SwitchOptions, "checked"> {
  checked?: boolean
}

export function createUseSwitch(React: ReactLike) {
  return function useSwitch(opts: UseSwitchOptions = {}): Switch {
    const isControlled = opts.checked !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const sw = React.useMemo(
      () =>
        createSwitch({
          ...opts,
          checked: isControlled ? () => optsRef.current.checked as boolean : undefined,
          onCheckedChange: (next) => {
            optsRef.current.onCheckedChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = sw.checked.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [sw])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.checked])

    return sw
  }
}

export interface UseToggleOptions extends Omit<ToggleOptions, "pressed"> {
  pressed?: boolean
}

export function createUseToggle(React: ReactLike) {
  return function useToggle(opts: UseToggleOptions = {}): Toggle {
    const isControlled = opts.pressed !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const toggle = React.useMemo(
      () =>
        createToggle({
          ...opts,
          pressed: isControlled ? () => optsRef.current.pressed as boolean : undefined,
          onPressedChange: (next) => {
            optsRef.current.onPressedChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = toggle.pressed.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [toggle])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.pressed])

    return toggle
  }
}

export interface UseToggleGroupOptions extends Omit<ToggleGroupOptions, "value"> {
  value?: string | string[]
}

export interface UseToggleGroupItemResult {
  itemProps: ToggleGroupItemProps
  isPressed: boolean
  isDisabled: boolean
}

export function createUseToggleGroup(React: ReactLike) {
  return function useToggleGroup(opts: UseToggleGroupOptions = {}): ToggleGroup {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const group = React.useMemo(
      () =>
        createToggleGroup({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string | string[] : undefined,
          onValueChange: (next) => {
            optsRef.current.onValueChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = group.values.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [group])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])

    return group
  }
}

export function createUseToggleGroupItem(React: ReactLike) {
  return function useToggleGroupItem(
    group: ToggleGroup,
    value: string,
    opts: ToggleGroupRegisterItemOptions = {},
  ): UseToggleGroupItemResult {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    React.useEffect(() => {
      const handle = group.registerItem(value, {
        disabled: optsRef.current.disabled
          ? () => optsRef.current.disabled?.() ?? false
          : undefined,
      })
      const unsub = group.values.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsub()
        handle.unregister()
      }
    }, [group, value])

    if (!group.hasItem(value)) {
      group.registerItem(value, optsRef.current)
    }

    return {
      itemProps: group.getItemProps(value),
      isPressed: group.isPressed(value),
      isDisabled: group.isItemDisabled(value),
    }
  }
}

export interface UseDialogOptions extends Omit<DialogOptions, "open"> {
  open?: boolean
}

export function createUseDialog(React: ReactLike) {
  return function useDialog(opts: UseDialogOptions = {}): Dialog {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const dialog = React.useMemo(
      () =>
        createDialog({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => {
            optsRef.current.onOpenChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = dialog.open.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [dialog])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])

    return dialog
  }
}

export interface UseTooltipOptions extends Omit<TooltipOptions, "open"> {
  open?: boolean
}

export function createUseTooltip(React: ReactLike) {
  return function useTooltip(opts: UseTooltipOptions = {}): Tooltip {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const tooltip = React.useMemo(
      () =>
        createTooltip({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => {
            optsRef.current.onOpenChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = tooltip.open.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [tooltip])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])

    return tooltip
  }
}

export interface UsePopoverOptions extends Omit<PopoverOptions, "open"> {
  open?: boolean
}

export function createUsePopover(React: ReactLike) {
  return function usePopover(opts: UsePopoverOptions = {}): Popover {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const popover = React.useMemo(
      () =>
        createPopover({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => {
            optsRef.current.onOpenChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = popover.open.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [popover])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])

    return popover
  }
}

export function createUseAvatar(React: ReactLike) {
  return function useAvatar(opts: AvatarOptions = {}): Avatar {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    // Avatar's status is internal; recreate when src changes.
    const avatar = React.useMemo(() => createAvatar(opts), [opts.src])

    React.useEffect(() => {
      const unsub = avatar.status.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [avatar])

    return avatar
  }
}

export interface UseProgressOptions extends Omit<ProgressOptions, "value"> {
  value?: number | null
}

export function createUseProgress(React: ReactLike) {
  return function useProgress(opts: UseProgressOptions = {}): Progress {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const progress = React.useMemo(
      () =>
        createProgress({
          ...opts,
          value: isControlled ? () => optsRef.current.value as number | null : undefined,
          onValueChange: (next) => {
            optsRef.current.onValueChange?.(next)
          },
        }),
      [isControlled, opts.max],
    )

    React.useEffect(() => {
      const unsub = progress.value.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [progress])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])

    return progress
  }
}

export interface UseMenuOptions extends Omit<MenuOptions, "open"> {
  open?: boolean
}

export function createUseMenu(React: ReactLike) {
  return function useMenu(opts: UseMenuOptions = {}): Menu {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const menu = React.useMemo(
      () =>
        createMenu({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => {
            optsRef.current.onOpenChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsubOpen = menu.open.subscribe(() => setTick((n) => n + 1))
      const unsubHi = menu.highlighted.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsubOpen()
        unsubHi()
      }
    }, [menu])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])

    return menu
  }
}

export function createUseMenuItem(React: ReactLike) {
  return function useMenuItem(
    menu: Menu | ContextMenu,
    value: string,
    opts: RegisterMenuItemOptions = {},
  ): {
    itemProps: ReturnType<Menu["getItemProps"]>
    isHighlighted: boolean
    isDisabled: boolean
  } {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    React.useEffect(() => {
      const handle = menu.registerItem(value, {
        disabled: optsRef.current.disabled
          ? () => optsRef.current.disabled?.() ?? false
          : undefined,
        onSelect: () => optsRef.current.onSelect?.(),
        label: optsRef.current.label,
      })
      const unsub = menu.highlighted.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsub()
        handle.unregister()
      }
    }, [menu, value])

    if (!menu.hasItem(value)) {
      menu.registerItem(value, optsRef.current)
    }

    return {
      itemProps: menu.getItemProps(value),
      isHighlighted: menu.highlighted.get() === value,
      isDisabled: menu.isItemDisabled(value),
    }
  }
}

export interface UseContextMenuOptions extends Omit<ContextMenuOptions, "open"> {
  open?: boolean
}

export function createUseContextMenu(React: ReactLike) {
  return function useContextMenu(opts: UseContextMenuOptions = {}): ContextMenu {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const cm = React.useMemo(
      () =>
        createContextMenu({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => {
            optsRef.current.onOpenChange?.(next)
          },
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsubOpen = cm.open.subscribe(() => setTick((n) => n + 1))
      const unsubHi = cm.highlighted.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsubOpen()
        unsubHi()
      }
    }, [cm])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])

    return cm
  }
}

export interface UseSliderOptions extends Omit<SliderOptions, "value"> {
  value?: SliderValue
}

export function createUseSlider(React: ReactLike) {
  return function useSlider(opts: UseSliderOptions = {}): Slider {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const slider = React.useMemo(
      () =>
        createSlider({
          ...opts,
          value: isControlled ? () => optsRef.current.value as SliderValue : undefined,
          onValueChange: (next) => optsRef.current.onValueChange?.(next),
          onValueCommit: (next) => optsRef.current.onValueCommit?.(next),
        }),
      [isControlled, opts.min, opts.max, opts.step, opts.range],
    )

    React.useEffect(() => {
      const unsub = slider.value.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [slider])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])

    return slider
  }
}

export interface UseRadioGroupOptions extends Omit<RadioGroupOptions, "value"> {
  value?: string
}

export function createUseRadioGroup(React: ReactLike) {
  return function useRadioGroup(opts: UseRadioGroupOptions = {}): RadioGroup {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const group = React.useMemo(
      () =>
        createRadioGroup({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string : undefined,
          onValueChange: (next) => optsRef.current.onValueChange?.(next),
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = group.value.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [group])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])

    return group
  }
}

export function createUseRadioItem(React: ReactLike) {
  return function useRadioItem(
    group: RadioGroup,
    value: string,
    opts: RegisterRadioOptions = {},
  ): {
    itemProps: ReturnType<RadioGroup["getItemProps"]>
    isChecked: boolean
    isDisabled: boolean
  } {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    React.useEffect(() => {
      const handle = group.registerItem(value, {
        disabled: optsRef.current.disabled
          ? () => optsRef.current.disabled?.() ?? false
          : undefined,
      })
      const unsub = group.value.subscribe(() => setTick((n) => n + 1))
      return () => {
        unsub()
        handle.unregister()
      }
    }, [group, value])

    if (!group.hasItem(value)) {
      group.registerItem(value, optsRef.current)
    }

    return {
      itemProps: group.getItemProps(value),
      isChecked: group.isChecked(value),
      isDisabled: group.isItemDisabled(value),
    }
  }
}

export interface UseCheckboxOptions extends Omit<CheckboxOptions, "checked"> {
  checked?: CheckboxOptions extends { checked?: () => infer T } ? T : never
}

export function createUseCheckbox(React: ReactLike) {
  return function useCheckbox(
    opts: Omit<CheckboxOptions, "checked"> & {
      checked?: ReturnType<NonNullable<CheckboxOptions["checked"]>>
    } = {},
  ): Checkbox {
    const isControlled = opts.checked !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const checkbox = React.useMemo(
      () =>
        createCheckbox({
          ...opts,
          checked: isControlled
            ? () => optsRef.current.checked as ReturnType<NonNullable<CheckboxOptions["checked"]>>
            : undefined,
          onCheckedChange: (next) => optsRef.current.onCheckedChange?.(next),
        }),
      [isControlled],
    )

    React.useEffect(() => {
      const unsub = checkbox.checked.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [checkbox])

    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.checked])

    return checkbox
  }
}

export function createUseToaster(React: ReactLike) {
  return function useToaster(opts: ToasterOptions = {}): Toaster {
    const [, setTick] = React.useState(0)
    const toaster = React.useMemo(() => createToaster(opts), [])
    React.useEffect(() => {
      const unsub = toaster.toasts.subscribe(() => setTick((n) => n + 1))
      return unsub
    }, [toaster])
    return toaster
  }
}

export interface UseComboboxOptions extends Omit<ComboboxOptions, "open" | "value"> {
  open?: boolean
  value?: string
}

export function createUseCombobox(React: ReactLike) {
  return function useCombobox(opts: UseComboboxOptions = {}): Combobox {
    const isControlledOpen = opts.open !== undefined
    const isControlledValue = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    const cb = React.useMemo(
      () =>
        createCombobox({
          ...opts,
          open: isControlledOpen ? () => optsRef.current.open as boolean : undefined,
          value: isControlledValue ? () => optsRef.current.value as string : undefined,
          onOpenChange: (next) => optsRef.current.onOpenChange?.(next),
          onValueChange: (next) => optsRef.current.onValueChange?.(next),
        }),
      [isControlledOpen, isControlledValue],
    )

    React.useEffect(() => {
      const unsubs = [
        cb.open.subscribe(() => setTick((n) => n + 1)),
        cb.value.subscribe(() => setTick((n) => n + 1)),
        cb.query.subscribe(() => setTick((n) => n + 1)),
        cb.highlighted.subscribe(() => setTick((n) => n + 1)),
        cb.filteredItems.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => {
        for (const u of unsubs) u()
      }
    }, [cb])

    React.useEffect(() => {
      if (isControlledOpen) setTick((n) => n + 1)
    }, [isControlledOpen, opts.open])

    React.useEffect(() => {
      if (isControlledValue) setTick((n) => n + 1)
    }, [isControlledValue, opts.value])

    return cb
  }
}

export interface UseComboboxItemResult {
  optionProps: ComboboxOptionProps
  isSelected: boolean
  isHighlighted: boolean
  isDisabled: boolean
}

export function createUseComboboxItem(React: ReactLike) {
  return function useComboboxItem(
    cb: Combobox,
    value: string,
    opts: RegisterComboboxItemOptions = {},
  ): UseComboboxItemResult {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts

    React.useEffect(() => {
      const handle = cb.registerItem(value, {
        disabled: optsRef.current.disabled
          ? () => optsRef.current.disabled?.() ?? false
          : undefined,
        label: optsRef.current.label,
      })
      const unsubs = [
        cb.highlighted.subscribe(() => setTick((n) => n + 1)),
        cb.value.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => {
        for (const u of unsubs) u()
        handle.unregister()
      }
    }, [cb, value])

    if (!cb.hasItem(value)) {
      cb.registerItem(value, optsRef.current)
    }

    return {
      optionProps: cb.getOptionProps(value),
      isSelected: cb.value.get() === value,
      isHighlighted: cb.highlighted.get() === value,
      isDisabled: cb.isItemDisabled(value),
    }
  }
}

export function createUseSeparator(_React: ReactLike) {
  return function useSeparator(opts: SeparatorOptions = {}): Separator {
    return createSeparator(opts)
  }
}

export function createUseVisuallyHidden(_React: ReactLike) {
  return function useVisuallyHidden(): VisuallyHidden {
    return createVisuallyHidden()
  }
}
