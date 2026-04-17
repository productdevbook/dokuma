/**
 * Pre-bound React hooks. Importing from `dokuma/react-hooks` saves the
 * `const useFoo = createUseFoo(React)` step at the top of every file —
 * use it when you have a normal React app with `react` as a dep.
 *
 * Need to pass a custom React (Preact compat, isolated copy)? Use the
 * factory entry: `import { createUseFoo } from "dokuma/react"`.
 */
import * as React from "react"
import {
  createUseAccordion,
  createUseAccordionItem,
  createUseAlertDialog,
  createUseAspectRatio,
  createUseAvatar,
  createUseBreadcrumb,
  createUseCheckbox,
  createUseCollapsible,
  createUseCombobox,
  createUseComboboxItem,
  createUseContextMenu,
  createUseDialog,
  createUseDisclosure,
  createUseHoverCard,
  createUseLabel,
  createUseMenu,
  createUseMenuItem,
  createUseNumberInput,
  createUseOtpInput,
  createUsePagination,
  createUsePopover,
  createUsePresence,
  createUseProgress,
  createUseRadioGroup,
  createUseRadioItem,
  createUseSeparator,
  createUseSlider,
  createUseSwitch,
  createUseTab,
  createUseTabs,
  createUseToaster,
  createUseToggle,
  createUseToggleGroup,
  createUseToggleGroupItem,
  createUseTooltip,
  createUseVisuallyHidden,
} from "./react.ts"

export const useDisclosure: ReturnType<typeof createUseDisclosure> = createUseDisclosure(React)
export const useAccordion: ReturnType<typeof createUseAccordion> = createUseAccordion(React)
export const useAccordionItem: ReturnType<typeof createUseAccordionItem> =
  createUseAccordionItem(React)
export const useTabs: ReturnType<typeof createUseTabs> = createUseTabs(React)
export const useTab: ReturnType<typeof createUseTab> = createUseTab(React)
export const useSwitch: ReturnType<typeof createUseSwitch> = createUseSwitch(React)
export const useToggle: ReturnType<typeof createUseToggle> = createUseToggle(React)
export const useToggleGroup: ReturnType<typeof createUseToggleGroup> = createUseToggleGroup(React)
export const useToggleGroupItem: ReturnType<typeof createUseToggleGroupItem> =
  createUseToggleGroupItem(React)
export const useDialog: ReturnType<typeof createUseDialog> = createUseDialog(React)
export const useTooltip: ReturnType<typeof createUseTooltip> = createUseTooltip(React)
export const usePopover: ReturnType<typeof createUsePopover> = createUsePopover(React)
export const useAvatar: ReturnType<typeof createUseAvatar> = createUseAvatar(React)
export const useProgress: ReturnType<typeof createUseProgress> = createUseProgress(React)
export const useMenu: ReturnType<typeof createUseMenu> = createUseMenu(React)
export const useMenuItem: ReturnType<typeof createUseMenuItem> = createUseMenuItem(React)
export const useContextMenu: ReturnType<typeof createUseContextMenu> = createUseContextMenu(React)
export const useSeparator: ReturnType<typeof createUseSeparator> = createUseSeparator(React)
export const useVisuallyHidden: ReturnType<typeof createUseVisuallyHidden> =
  createUseVisuallyHidden(React)
export const useCollapsible: ReturnType<typeof createUseCollapsible> = createUseCollapsible(React)
export const useAlertDialog: ReturnType<typeof createUseAlertDialog> = createUseAlertDialog(React)
export const useHoverCard: ReturnType<typeof createUseHoverCard> = createUseHoverCard(React)
export const useLabel: ReturnType<typeof createUseLabel> = createUseLabel(React)
export const useAspectRatio: ReturnType<typeof createUseAspectRatio> = createUseAspectRatio(React)
export const useBreadcrumb: ReturnType<typeof createUseBreadcrumb> = createUseBreadcrumb(React)
export const usePagination: ReturnType<typeof createUsePagination> = createUsePagination(React)
export const useNumberInput: ReturnType<typeof createUseNumberInput> = createUseNumberInput(React)
export const useOtpInput: ReturnType<typeof createUseOtpInput> = createUseOtpInput(React)
export const useSlider: ReturnType<typeof createUseSlider> = createUseSlider(React)
export const useRadioGroup: ReturnType<typeof createUseRadioGroup> = createUseRadioGroup(React)
export const useRadioItem: ReturnType<typeof createUseRadioItem> = createUseRadioItem(React)
export const useCheckbox: ReturnType<typeof createUseCheckbox> = createUseCheckbox(React)
export const usePresence: ReturnType<typeof createUsePresence> = createUsePresence(React)
export const useToaster: ReturnType<typeof createUseToaster> = createUseToaster(React)
export const useCombobox: ReturnType<typeof createUseCombobox> = createUseCombobox(React)
export const useComboboxItem: ReturnType<typeof createUseComboboxItem> =
  createUseComboboxItem(React)
