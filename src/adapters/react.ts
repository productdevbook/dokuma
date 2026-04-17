import {
  createAccordion,
  type Accordion,
  type AccordionItemProps,
  type AccordionOptions,
  type AccordionPanelProps,
  type AccordionTriggerProps,
  type RegisterItemOptions,
} from "../primitives/accordion.ts"
import { createDialog, type Dialog, type DialogOptions } from "../primitives/dialog.ts"
import { createPopover, type Popover, type PopoverOptions } from "../primitives/popover.ts"
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

interface ReactLike {
  useState: <T>(init: T | (() => T)) => [T, SetState<T>]
  useMemo: <T>(factory: () => T, deps: ReadonlyArray<unknown>) => T
  useEffect: (effect: () => void | (() => void), deps?: ReadonlyArray<unknown>) => void
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
      if (isControlled) {
        setTick((n) => n + 1)
        accordion.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        tabs.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        sw.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        toggle.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        group.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        dialog.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        tooltip.notify()
      }
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
      if (isControlled) {
        setTick((n) => n + 1)
        popover.notify()
      }
    }, [isControlled, opts.open])

    return popover
  }
}
