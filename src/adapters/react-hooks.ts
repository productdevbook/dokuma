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
  createUseAvatar,
  createUseCheckbox,
  createUseCombobox,
  createUseComboboxItem,
  createUseDialog,
  createUseDisclosure,
  createUseMenu,
  createUseMenuItem,
  createUsePopover,
  createUsePresence,
  createUseProgress,
  createUseRadioGroup,
  createUseRadioItem,
  createUseSlider,
  createUseSwitch,
  createUseTab,
  createUseTabs,
  createUseToaster,
  createUseToggle,
  createUseToggleGroup,
  createUseToggleGroupItem,
  createUseTooltip,
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
export const useSlider: ReturnType<typeof createUseSlider> = createUseSlider(React)
export const useRadioGroup: ReturnType<typeof createUseRadioGroup> = createUseRadioGroup(React)
export const useRadioItem: ReturnType<typeof createUseRadioItem> = createUseRadioItem(React)
export const useCheckbox: ReturnType<typeof createUseCheckbox> = createUseCheckbox(React)
export const usePresence: ReturnType<typeof createUsePresence> = createUsePresence(React)
export const useToaster: ReturnType<typeof createUseToaster> = createUseToaster(React)
export const useCombobox: ReturnType<typeof createUseCombobox> = createUseCombobox(React)
export const useComboboxItem: ReturnType<typeof createUseComboboxItem> =
  createUseComboboxItem(React)
