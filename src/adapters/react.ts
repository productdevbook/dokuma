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
import { createCollapsible, type CollapsibleOptions } from "../primitives/collapsible.ts"
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
import {
  createAutocomplete,
  type Autocomplete,
  type AutocompleteOptions,
  type AutocompleteRegisterItemOptions,
} from "../primitives/autocomplete.ts"
import { createButton, type Button, type ButtonOptions } from "../primitives/button.ts"
import {
  createCheckboxGroup,
  type CheckboxGroup,
  type CheckboxGroupOptions,
} from "../primitives/checkbox-group.ts"
import {
  createDirectionProvider,
  type DirectionProvider,
  type DirectionProviderOptions,
} from "../primitives/direction-provider.ts"
import { createDrawer, type Drawer, type DrawerOptions } from "../primitives/drawer.ts"
import { createField, type Field, type FieldOptions } from "../primitives/field.ts"
import { createFieldset, type Fieldset, type FieldsetOptions } from "../primitives/fieldset.ts"
import { createForm, type Form, type FormOptions } from "../primitives/form.ts"
import { createInput, type Input, type InputOptions } from "../primitives/input.ts"
import {
  createMenubar,
  type Menubar,
  type MenubarOptions,
  type MenubarRegisterMenuOptions,
} from "../primitives/menubar.ts"
import { createMeter, type Meter, type MeterOptions } from "../primitives/meter.ts"
import {
  createNavigationMenu,
  type NavigationMenu,
  type NavigationMenuItemOptions,
  type NavigationMenuOptions,
} from "../primitives/navigation-menu.ts"
import {
  createPreviewCard,
  type PreviewCard,
  type PreviewCardOptions,
} from "../primitives/preview-card.ts"
import { createRadio, type Radio, type RadioOptions } from "../primitives/radio.ts"
import {
  createScrollArea,
  type ScrollArea,
  type ScrollAreaOptions,
} from "../primitives/scroll-area.ts"
import {
  createSelect,
  type Select,
  type SelectOptions,
  type SelectRegisterItemOptions,
} from "../primitives/select.ts"
import {
  createToolbar,
  type Toolbar,
  type ToolbarItemRegisterOptions,
  type ToolbarOptions,
} from "../primitives/toolbar.ts"

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

export interface UseCollapsibleOptions extends Omit<CollapsibleOptions, "open"> {
  open?: boolean
}

export function createUseCollapsible(React: ReactLike) {
  return function useCollapsible(opts: UseCollapsibleOptions = {}): Disclosure {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const c = React.useMemo(
      () =>
        createCollapsible({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => optsRef.current.onOpenChange?.(next),
        }),
      [isControlled],
    )
    React.useEffect(() => c.open.subscribe(() => setTick((n) => n + 1)), [c])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])
    return c
  }
}

export interface UseAlertDialogOptions extends Omit<AlertDialogOptions, "open"> {
  open?: boolean
}

export function createUseAlertDialog(React: ReactLike) {
  return function useAlertDialog(opts: UseAlertDialogOptions = {}): AlertDialog {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const ad = React.useMemo(
      () =>
        createAlertDialog({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => optsRef.current.onOpenChange?.(next),
        }),
      [isControlled],
    )
    React.useEffect(() => ad.open.subscribe(() => setTick((n) => n + 1)), [ad])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])
    return ad
  }
}

export interface UseHoverCardOptions extends Omit<HoverCardOptions, "open"> {
  open?: boolean
}

export function createUseHoverCard(React: ReactLike) {
  return function useHoverCard(opts: UseHoverCardOptions = {}): HoverCard {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const hc = React.useMemo(
      () =>
        createHoverCard({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (next) => optsRef.current.onOpenChange?.(next),
        }),
      [isControlled],
    )
    React.useEffect(() => hc.open.subscribe(() => setTick((n) => n + 1)), [hc])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])
    return hc
  }
}

export function createUseLabel(_React: ReactLike) {
  return function useLabel(opts: LabelOptions = {}): Label {
    return createLabel(opts)
  }
}

export function createUseAspectRatio(_React: ReactLike) {
  return function useAspectRatio(opts: AspectRatioOptions = {}): AspectRatio {
    return createAspectRatio(opts)
  }
}

export function createUseBreadcrumb(_React: ReactLike) {
  return function useBreadcrumb(opts: BreadcrumbOptions = {}): Breadcrumb {
    return createBreadcrumb(opts)
  }
}

export interface UsePaginationOptions extends Omit<PaginationOptions, "page"> {
  page?: number
}

export interface UseNumberInputOptions extends Omit<NumberInputOptions, "value"> {
  value?: number | null
}

export function createUseNumberInput(React: ReactLike) {
  return function useNumberInput(opts: UseNumberInputOptions = {}): NumberInput {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const ni = React.useMemo(
      () =>
        createNumberInput({
          ...opts,
          value: isControlled ? () => optsRef.current.value as number | null : undefined,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
          onValueCommit: (v) => optsRef.current.onValueCommit?.(v),
          disabled: opts.disabled,
          readOnly: opts.readOnly,
        }),
      [isControlled, opts.min, opts.max, opts.step, opts.precision],
    )
    React.useEffect(() => {
      const a = ni.value.subscribe(() => setTick((n) => n + 1))
      const b = ni.inputValue.subscribe(() => setTick((n) => n + 1))
      return () => {
        a()
        b()
      }
    }, [ni])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])
    return ni
  }
}

export interface UseOtpInputOptions extends Omit<OtpInputOptions, "value"> {
  value?: string
}

export function createUseOtpInput(React: ReactLike) {
  return function useOtpInput(opts: UseOtpInputOptions = {}): OtpInput {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const otp = React.useMemo(
      () =>
        createOtpInput({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string : undefined,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
          onComplete: (v) => optsRef.current.onComplete?.(v),
          disabled: opts.disabled,
        }),
      [isControlled, opts.length, opts.mask, opts.pattern],
    )
    React.useEffect(() => otp.value.subscribe(() => setTick((n) => n + 1)), [otp])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])
    return otp
  }
}

export function createUsePagination(React: ReactLike) {
  return function usePagination(opts: UsePaginationOptions): Pagination {
    const isControlled = opts.page !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const p = React.useMemo(
      () =>
        createPagination({
          ...opts,
          page: isControlled ? () => optsRef.current.page as number : undefined,
          onPageChange: (n) => optsRef.current.onPageChange?.(n),
        }),
      [isControlled, opts.pageCount, opts.siblingCount, opts.boundaryCount],
    )
    React.useEffect(() => p.page.subscribe(() => setTick((n) => n + 1)), [p])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.page])
    return p
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

// --- v0.3 primitives -------------------------------------------------------

export interface UseMeterOptions extends MeterOptions {}

export function createUseMeter(React: ReactLike) {
  return function useMeter(opts: UseMeterOptions): Meter {
    const [, setTick] = React.useState(0)
    const m = React.useMemo(() => createMeter(opts), [])
    React.useEffect(() => m.value.subscribe(() => setTick((n) => n + 1)), [m])
    React.useEffect(() => {
      if (opts.value !== m.value.get()) m.value.set(opts.value)
    }, [m, opts.value])
    return m
  }
}

export interface UseDirectionProviderOptions extends DirectionProviderOptions {}

export function createUseDirectionProvider(React: ReactLike) {
  return function useDirectionProvider(opts: UseDirectionProviderOptions = {}): DirectionProvider {
    const [, setTick] = React.useState(0)
    const d = React.useMemo(() => createDirectionProvider(opts), [])
    React.useEffect(() => d.direction.subscribe(() => setTick((n) => n + 1)), [d])
    React.useEffect(() => {
      if (opts.direction && opts.direction !== d.direction.get()) d.set(opts.direction)
    }, [d, opts.direction])
    return d
  }
}

export interface UseToolbarOptions extends ToolbarOptions {}

export function createUseToolbar(React: ReactLike) {
  return function useToolbar(opts: UseToolbarOptions = {}): Toolbar {
    const [, setTick] = React.useState(0)
    const t = React.useMemo(() => createToolbar(opts), [])
    React.useEffect(() => t.activeIndex.subscribe(() => setTick((n) => n + 1)), [t])
    return t
  }
}

export interface UseToolbarItemResult {
  register: (el: HTMLElement | null) => void
}

export function createUseToolbarItem(React: ReactLike) {
  return function useToolbarItem(
    toolbar: Toolbar,
    opts: ToolbarItemRegisterOptions = {},
  ): UseToolbarItemResult {
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const handleRef = React.useMemo<{ current: ReturnType<Toolbar["registerItem"]> | null }>(
      () => ({ current: null }),
      [],
    )
    const register = React.useMemo(
      () => (el: HTMLElement | null) => {
        handleRef.current?.unregister()
        handleRef.current = null
        if (el) {
          handleRef.current = toolbar.registerItem(el, {
            disabled: optsRef.current.disabled,
            focusableWhenDisabled: optsRef.current.focusableWhenDisabled,
          })
        }
      },
      [toolbar],
    )
    React.useEffect(
      () => () => {
        handleRef.current?.unregister()
        handleRef.current = null
      },
      [toolbar],
    )
    return { register }
  }
}

export interface UseButtonOptions extends Omit<ButtonOptions, "disabled"> {
  disabled?: boolean
}

export function createUseButton(React: ReactLike) {
  return function useButton(opts: UseButtonOptions = {}): Button {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const b = React.useMemo(
      () =>
        createButton({
          ...opts,
          disabled: () => optsRef.current.disabled ?? false,
        }),
      [],
    )
    React.useEffect(() => {
      setTick((n) => n + 1)
    }, [opts.disabled])
    return b
  }
}

export interface UseInputOptions extends Omit<InputOptions, "value" | "disabled" | "readOnly"> {
  value?: string
  disabled?: boolean
  readOnly?: boolean
}

export function createUseInput(React: ReactLike) {
  return function useInput(opts: UseInputOptions = {}): Input {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const input = React.useMemo(
      () =>
        createInput({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string : undefined,
          disabled: () => optsRef.current.disabled ?? false,
          readOnly: () => optsRef.current.readOnly ?? false,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
        }),
      [isControlled],
    )
    React.useEffect(() => input.value.subscribe(() => setTick((n) => n + 1)), [input])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value, opts.disabled, opts.readOnly])
    return input
  }
}

export interface UseFieldOptions extends FieldOptions {}

export function createUseField(React: ReactLike) {
  return function useField(opts: UseFieldOptions = {}): Field {
    const [, setTick] = React.useState(0)
    const f = React.useMemo(() => createField(opts), [])
    React.useEffect(() => {
      const unsubs = [
        f.invalid.subscribe(() => setTick((n) => n + 1)),
        f.touched.subscribe(() => setTick((n) => n + 1)),
        f.dirty.subscribe(() => setTick((n) => n + 1)),
        f.focused.subscribe(() => setTick((n) => n + 1)),
        f.errorMessage.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [f])
    return f
  }
}

export interface UseFieldsetOptions extends FieldsetOptions {}

export function createUseFieldset(React: ReactLike) {
  return function useFieldset(opts: UseFieldsetOptions = {}): Fieldset {
    const [, setTick] = React.useState(0)
    const fs = React.useMemo(() => createFieldset(opts), [])
    React.useEffect(() => fs.disabled.subscribe(() => setTick((n) => n + 1)), [fs])
    return fs
  }
}

export interface UseFormOptions extends FormOptions {}

export function createUseForm(React: ReactLike) {
  return function useForm(opts: UseFormOptions = {}): Form {
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const form = React.useMemo(
      () =>
        createForm({
          ...opts,
          errors: () =>
            optsRef.current.errors
              ? typeof optsRef.current.errors === "function"
                ? optsRef.current.errors()
                : optsRef.current.errors
              : {},
          onSubmit: (args) => optsRef.current.onSubmit?.(args),
        }),
      [],
    )
    React.useEffect(() => {
      const unsubs = [
        form.submitting.subscribe(() => setTick((n) => n + 1)),
        form.submitAttempted.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [form])
    return form
  }
}

export interface UseCheckboxGroupOptions extends Omit<CheckboxGroupOptions, "value"> {
  value?: string[]
}

export function createUseCheckboxGroup(React: ReactLike) {
  return function useCheckboxGroup(opts: UseCheckboxGroupOptions = {}): CheckboxGroup {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const g = React.useMemo(
      () =>
        createCheckboxGroup({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string[] : undefined,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
        }),
      [isControlled],
    )
    React.useEffect(() => g.value.subscribe(() => setTick((n) => n + 1)), [g])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])
    return g
  }
}

export interface UseMenubarOptions extends MenubarOptions {}

export function createUseMenubar(React: ReactLike) {
  return function useMenubar(opts: UseMenubarOptions = {}): Menubar {
    const [, setTick] = React.useState(0)
    const m = React.useMemo(() => createMenubar(opts), [])
    React.useEffect(() => {
      const unsubs = [
        m.openMenuId.subscribe(() => setTick((n) => n + 1)),
        m.activeIndex.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [m])
    return m
  }
}

export interface UseSelectOptions extends Omit<SelectOptions, "value" | "open"> {
  value?: string | null
  open?: boolean
}

export function createUseSelect(React: ReactLike) {
  return function useSelect(opts: UseSelectOptions = {}): Select {
    const isValueControlled = opts.value !== undefined
    const isOpenControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const s = React.useMemo(
      () =>
        createSelect({
          ...opts,
          value: isValueControlled ? () => optsRef.current.value as string | null : undefined,
          open: isOpenControlled ? () => optsRef.current.open as boolean : undefined,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
          onOpenChange: (v) => optsRef.current.onOpenChange?.(v),
        }),
      [isValueControlled, isOpenControlled],
    )
    React.useEffect(() => {
      const unsubs = [
        s.open.subscribe(() => setTick((n) => n + 1)),
        s.value.subscribe(() => setTick((n) => n + 1)),
        s.highlighted.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [s])
    React.useEffect(() => {
      if (isValueControlled || isOpenControlled) setTick((n) => n + 1)
    }, [isValueControlled, isOpenControlled, opts.value, opts.open])
    return s
  }
}

export interface UseSelectItemResult {
  handle: ReturnType<Select["registerItem"]>
}

export function createUseSelectItem(React: ReactLike) {
  return function useSelectItem(
    select: Select,
    value: string,
    opts: SelectRegisterItemOptions = {},
  ): UseSelectItemResult {
    const handleRef = React.useMemo<{ current: ReturnType<Select["registerItem"]> | null }>(
      () => ({ current: null }),
      [],
    )
    if (!handleRef.current) handleRef.current = select.registerItem(value, opts)
    React.useEffect(
      () => () => {
        handleRef.current?.unregister()
        handleRef.current = null
      },
      [select, value],
    )
    return { handle: handleRef.current }
  }
}

export interface UsePreviewCardOptions extends Omit<PreviewCardOptions, "open"> {
  open?: boolean
}

export function createUsePreviewCard(React: ReactLike) {
  return function usePreviewCard(opts: UsePreviewCardOptions = {}): PreviewCard {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const pc = React.useMemo(
      () =>
        createPreviewCard({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (v) => optsRef.current.onOpenChange?.(v),
        }),
      [isControlled],
    )
    React.useEffect(() => pc.open.subscribe(() => setTick((n) => n + 1)), [pc])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])
    return pc
  }
}

export interface UseRadioOptions extends Omit<RadioOptions, "checked" | "disabled"> {
  checked?: boolean
  disabled?: boolean
}

export function createUseRadio(React: ReactLike) {
  return function useRadio(opts: UseRadioOptions): Radio {
    const isControlled = opts.checked !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const r = React.useMemo(
      () =>
        createRadio({
          value: opts.value,
          id: opts.id,
          name: opts.name,
          required: opts.required,
          checked: isControlled ? () => optsRef.current.checked as boolean : undefined,
          disabled: () => optsRef.current.disabled ?? false,
          onCheckedChange: (v) => optsRef.current.onCheckedChange?.(v),
        }),
      [isControlled],
    )
    React.useEffect(() => r.checked.subscribe(() => setTick((n) => n + 1)), [r])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.checked, opts.disabled])
    return r
  }
}

export interface UseNavigationMenuOptions extends Omit<NavigationMenuOptions, "value"> {
  value?: string | null
}

export function createUseNavigationMenu(React: ReactLike) {
  return function useNavigationMenu(opts: UseNavigationMenuOptions = {}): NavigationMenu {
    const isControlled = opts.value !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const nm = React.useMemo(
      () =>
        createNavigationMenu({
          ...opts,
          value: isControlled ? () => optsRef.current.value as string | null : undefined,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
        }),
      [isControlled],
    )
    React.useEffect(() => nm.value.subscribe(() => setTick((n) => n + 1)), [nm])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.value])
    return nm
  }
}

export interface UseAutocompleteOptions extends Omit<
  AutocompleteOptions,
  "value" | "query" | "open"
> {
  value?: string
  query?: string
  open?: boolean
}

export function createUseAutocomplete(React: ReactLike) {
  return function useAutocomplete(opts: UseAutocompleteOptions = {}): Autocomplete {
    const isValueControlled = opts.value !== undefined
    const isQueryControlled = opts.query !== undefined
    const isOpenControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const a = React.useMemo(
      () =>
        createAutocomplete({
          ...opts,
          value: isValueControlled ? () => optsRef.current.value as string : undefined,
          query: isQueryControlled ? () => optsRef.current.query as string : undefined,
          open: isOpenControlled ? () => optsRef.current.open as boolean : undefined,
          onValueChange: (v) => optsRef.current.onValueChange?.(v),
          onQueryChange: (v) => optsRef.current.onQueryChange?.(v),
          onOpenChange: (v) => optsRef.current.onOpenChange?.(v),
        }),
      [isValueControlled, isQueryControlled, isOpenControlled],
    )
    React.useEffect(() => {
      const unsubs = [
        a.open.subscribe(() => setTick((n) => n + 1)),
        a.value.subscribe(() => setTick((n) => n + 1)),
        a.query.subscribe(() => setTick((n) => n + 1)),
        a.highlighted.subscribe(() => setTick((n) => n + 1)),
        a.filteredItems.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [a])
    React.useEffect(() => {
      if (isValueControlled || isQueryControlled || isOpenControlled) setTick((n) => n + 1)
    }, [isValueControlled, isQueryControlled, isOpenControlled, opts.value, opts.query, opts.open])
    return a
  }
}

export interface UseAutocompleteItemResult {
  handle: ReturnType<Autocomplete["registerItem"]>
}

export function createUseAutocompleteItem(React: ReactLike) {
  return function useAutocompleteItem(
    autocomplete: Autocomplete,
    value: string,
    opts: AutocompleteRegisterItemOptions = {},
  ): UseAutocompleteItemResult {
    const handleRef = React.useMemo<{ current: ReturnType<Autocomplete["registerItem"]> | null }>(
      () => ({ current: null }),
      [],
    )
    if (!handleRef.current) handleRef.current = autocomplete.registerItem(value, opts)
    React.useEffect(
      () => () => {
        handleRef.current?.unregister()
        handleRef.current = null
      },
      [autocomplete, value],
    )
    return { handle: handleRef.current }
  }
}

export interface UseScrollAreaOptions extends ScrollAreaOptions {}

export function createUseScrollArea(React: ReactLike) {
  return function useScrollArea(opts: UseScrollAreaOptions = {}): ScrollArea {
    const [, setTick] = React.useState(0)
    const sa = React.useMemo(() => createScrollArea(opts), [])
    React.useEffect(() => {
      const unsubs = [
        sa.x.subscribe(() => setTick((n) => n + 1)),
        sa.y.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [sa])
    return sa
  }
}

export interface UseDrawerOptions extends Omit<DrawerOptions, "open"> {
  open?: boolean
}

export function createUseDrawer(React: ReactLike) {
  return function useDrawer(opts: UseDrawerOptions = {}): Drawer {
    const isControlled = opts.open !== undefined
    const [, setTick] = React.useState(0)
    const optsRef = React.useMemo(() => ({ current: opts }), [])
    optsRef.current = opts
    const d = React.useMemo(
      () =>
        createDrawer({
          ...opts,
          open: isControlled ? () => optsRef.current.open as boolean : undefined,
          onOpenChange: (v) => optsRef.current.onOpenChange?.(v),
        }),
      [isControlled],
    )
    React.useEffect(() => {
      const unsubs = [
        d.open.subscribe(() => setTick((n) => n + 1)),
        d.snap.subscribe(() => setTick((n) => n + 1)),
      ]
      return () => unsubs.forEach((u) => u())
    }, [d])
    React.useEffect(() => {
      if (isControlled) setTick((n) => n + 1)
    }, [isControlled, opts.open])
    return d
  }
}

export function createUseMenubarMenu(React: ReactLike) {
  return function useMenubarMenu(
    menubar: Menubar,
    opts: MenubarRegisterMenuOptions = {},
  ): { handle: ReturnType<Menubar["registerMenu"]> } {
    const handleRef = React.useMemo<{ current: ReturnType<Menubar["registerMenu"]> | null }>(
      () => ({ current: null }),
      [],
    )
    if (!handleRef.current) handleRef.current = menubar.registerMenu(opts)
    React.useEffect(
      () => () => {
        handleRef.current?.unregister()
        handleRef.current = null
      },
      [menubar],
    )
    return { handle: handleRef.current }
  }
}

export function createUseNavigationMenuItem(React: ReactLike) {
  return function useNavigationMenuItem(
    nav: NavigationMenu,
    opts: NavigationMenuItemOptions,
  ): { handle: ReturnType<NavigationMenu["registerItem"]> } {
    const handleRef = React.useMemo<{ current: ReturnType<NavigationMenu["registerItem"]> | null }>(
      () => ({ current: null }),
      [],
    )
    if (!handleRef.current) handleRef.current = nav.registerItem(opts)
    React.useEffect(
      () => () => {
        handleRef.current?.unregister()
        handleRef.current = null
      },
      [nav, opts.value],
    )
    return { handle: handleRef.current }
  }
}
