/**
 * Pre-bound Vue composables. Importing from `dokuma/vue-composables`
 * saves the `const useFoo = createUseFoo(Vue)` step — use it when you
 * have a normal Vue 3 app with `vue` as a dep.
 *
 * Need to pass a different Vue runtime? Use the factory entry:
 * `import { createUseFoo } from "dokuma/vue"`.
 */
import * as Vue from "vue"
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
} from "./vue.ts"

export const useDisclosure: ReturnType<typeof createUseDisclosure> = createUseDisclosure(Vue)
export const useAccordion: ReturnType<typeof createUseAccordion> = createUseAccordion(Vue)
export const useAccordionItem: ReturnType<typeof createUseAccordionItem> =
  createUseAccordionItem(Vue)
export const useTabs: ReturnType<typeof createUseTabs> = createUseTabs(Vue)
export const useTab: ReturnType<typeof createUseTab> = createUseTab(Vue)
export const useSwitch: ReturnType<typeof createUseSwitch> = createUseSwitch(Vue)
export const useToggle: ReturnType<typeof createUseToggle> = createUseToggle(Vue)
export const useToggleGroup: ReturnType<typeof createUseToggleGroup> = createUseToggleGroup(Vue)
export const useToggleGroupItem: ReturnType<typeof createUseToggleGroupItem> =
  createUseToggleGroupItem(Vue)
export const useDialog: ReturnType<typeof createUseDialog> = createUseDialog(Vue)
export const useTooltip: ReturnType<typeof createUseTooltip> = createUseTooltip(Vue)
export const usePopover: ReturnType<typeof createUsePopover> = createUsePopover(Vue)
export const useAvatar: ReturnType<typeof createUseAvatar> = createUseAvatar(Vue)
export const useProgress: ReturnType<typeof createUseProgress> = createUseProgress(Vue)
export const useMenu: ReturnType<typeof createUseMenu> = createUseMenu(Vue)
export const useMenuItem: ReturnType<typeof createUseMenuItem> = createUseMenuItem(Vue)
export const useContextMenu: ReturnType<typeof createUseContextMenu> = createUseContextMenu(Vue)
export const useSeparator: ReturnType<typeof createUseSeparator> = createUseSeparator(Vue)
export const useVisuallyHidden: ReturnType<typeof createUseVisuallyHidden> =
  createUseVisuallyHidden(Vue)
export const useCollapsible: ReturnType<typeof createUseCollapsible> = createUseCollapsible(Vue)
export const useAlertDialog: ReturnType<typeof createUseAlertDialog> = createUseAlertDialog(Vue)
export const useHoverCard: ReturnType<typeof createUseHoverCard> = createUseHoverCard(Vue)
export const useLabel: ReturnType<typeof createUseLabel> = createUseLabel(Vue)
export const useAspectRatio: ReturnType<typeof createUseAspectRatio> = createUseAspectRatio(Vue)
export const useBreadcrumb: ReturnType<typeof createUseBreadcrumb> = createUseBreadcrumb(Vue)
export const usePagination: ReturnType<typeof createUsePagination> = createUsePagination(Vue)
export const useNumberInput: ReturnType<typeof createUseNumberInput> = createUseNumberInput(Vue)
export const useOtpInput: ReturnType<typeof createUseOtpInput> = createUseOtpInput(Vue)
export const useSlider: ReturnType<typeof createUseSlider> = createUseSlider(Vue)
export const useRadioGroup: ReturnType<typeof createUseRadioGroup> = createUseRadioGroup(Vue)
export const useRadioItem: ReturnType<typeof createUseRadioItem> = createUseRadioItem(Vue)
export const useCheckbox: ReturnType<typeof createUseCheckbox> = createUseCheckbox(Vue)
export const usePresence: ReturnType<typeof createUsePresence> = createUsePresence(Vue)
export const useToaster: ReturnType<typeof createUseToaster> = createUseToaster(Vue)
export const useCombobox: ReturnType<typeof createUseCombobox> = createUseCombobox(Vue)
export const useComboboxItem: ReturnType<typeof createUseComboboxItem> = createUseComboboxItem(Vue)

// v0.3 primitives
export const useMeter: ReturnType<typeof createUseMeter> = createUseMeter(Vue)
export const useDirectionProvider: ReturnType<typeof createUseDirectionProvider> =
  createUseDirectionProvider(Vue)
export const useToolbar: ReturnType<typeof createUseToolbar> = createUseToolbar(Vue)
export const useToolbarItem: ReturnType<typeof createUseToolbarItem> = createUseToolbarItem(Vue)
export const useButton: ReturnType<typeof createUseButton> = createUseButton(Vue)
export const useInput: ReturnType<typeof createUseInput> = createUseInput(Vue)
export const useField: ReturnType<typeof createUseField> = createUseField(Vue)
export const useFieldset: ReturnType<typeof createUseFieldset> = createUseFieldset(Vue)
export const useForm: ReturnType<typeof createUseForm> = createUseForm(Vue)
export const useCheckboxGroup: ReturnType<typeof createUseCheckboxGroup> =
  createUseCheckboxGroup(Vue)
export const useMenubar: ReturnType<typeof createUseMenubar> = createUseMenubar(Vue)
export const useMenubarMenu: ReturnType<typeof createUseMenubarMenu> = createUseMenubarMenu(Vue)
export const useSelect: ReturnType<typeof createUseSelect> = createUseSelect(Vue)
export const useSelectItem: ReturnType<typeof createUseSelectItem> = createUseSelectItem(Vue)
export const usePreviewCard: ReturnType<typeof createUsePreviewCard> = createUsePreviewCard(Vue)
export const useRadio: ReturnType<typeof createUseRadio> = createUseRadio(Vue)
export const useNavigationMenu: ReturnType<typeof createUseNavigationMenu> =
  createUseNavigationMenu(Vue)
export const useNavigationMenuItem: ReturnType<typeof createUseNavigationMenuItem> =
  createUseNavigationMenuItem(Vue)
export const useAutocomplete: ReturnType<typeof createUseAutocomplete> = createUseAutocomplete(Vue)
export const useAutocompleteItem: ReturnType<typeof createUseAutocompleteItem> =
  createUseAutocompleteItem(Vue)
export const useScrollArea: ReturnType<typeof createUseScrollArea> = createUseScrollArea(Vue)
export const useDrawer: ReturnType<typeof createUseDrawer> = createUseDrawer(Vue)
