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
  createUseAutocomplete,
  createUseAutocompleteItem,
  createUseAvatar,
  createUseBreadcrumb,
  createUseButton,
  createUseCheckbox,
  createUseCheckboxGroup,
  createUseCollapsible,
  createUseCombobox,
  createUseComboboxItem,
  createUseContextMenu,
  createUseDialog,
  createUseDirectionProvider,
  createUseDisclosure,
  createUseDrawer,
  createUseField,
  createUseFieldset,
  createUseForm,
  createUseHoverCard,
  createUseInput,
  createUseLabel,
  createUseMenu,
  createUseMenubar,
  createUseMenubarMenu,
  createUseMenuItem,
  createUseMeter,
  createUseNavigationMenu,
  createUseNavigationMenuItem,
  createUseNumberInput,
  createUseOtpInput,
  createUsePagination,
  createUsePopover,
  createUsePresence,
  createUsePreviewCard,
  createUseProgress,
  createUseRadio,
  createUseRadioGroup,
  createUseRadioItem,
  createUseScrollArea,
  createUseSelect,
  createUseSelectItem,
  createUseSeparator,
  createUseSlider,
  createUseSwitch,
  createUseTab,
  createUseTabs,
  createUseToaster,
  createUseToggle,
  createUseToggleGroup,
  createUseToggleGroupItem,
  createUseToolbar,
  createUseToolbarItem,
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

// v0.3 primitives
export const useMeter: ReturnType<typeof createUseMeter> = createUseMeter(React)
export const useDirectionProvider: ReturnType<typeof createUseDirectionProvider> =
  createUseDirectionProvider(React)
export const useToolbar: ReturnType<typeof createUseToolbar> = createUseToolbar(React)
export const useToolbarItem: ReturnType<typeof createUseToolbarItem> = createUseToolbarItem(React)
export const useButton: ReturnType<typeof createUseButton> = createUseButton(React)
export const useInput: ReturnType<typeof createUseInput> = createUseInput(React)
export const useField: ReturnType<typeof createUseField> = createUseField(React)
export const useFieldset: ReturnType<typeof createUseFieldset> = createUseFieldset(React)
export const useForm: ReturnType<typeof createUseForm> = createUseForm(React)
export const useCheckboxGroup: ReturnType<typeof createUseCheckboxGroup> =
  createUseCheckboxGroup(React)
export const useMenubar: ReturnType<typeof createUseMenubar> = createUseMenubar(React)
export const useMenubarMenu: ReturnType<typeof createUseMenubarMenu> = createUseMenubarMenu(React)
export const useSelect: ReturnType<typeof createUseSelect> = createUseSelect(React)
export const useSelectItem: ReturnType<typeof createUseSelectItem> = createUseSelectItem(React)
export const usePreviewCard: ReturnType<typeof createUsePreviewCard> = createUsePreviewCard(React)
export const useRadio: ReturnType<typeof createUseRadio> = createUseRadio(React)
export const useNavigationMenu: ReturnType<typeof createUseNavigationMenu> =
  createUseNavigationMenu(React)
export const useNavigationMenuItem: ReturnType<typeof createUseNavigationMenuItem> =
  createUseNavigationMenuItem(React)
export const useAutocomplete: ReturnType<typeof createUseAutocomplete> =
  createUseAutocomplete(React)
export const useAutocompleteItem: ReturnType<typeof createUseAutocompleteItem> =
  createUseAutocompleteItem(React)
export const useScrollArea: ReturnType<typeof createUseScrollArea> = createUseScrollArea(React)
export const useDrawer: ReturnType<typeof createUseDrawer> = createUseDrawer(React)
