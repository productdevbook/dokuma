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
  createUseAvatar,
  createUseCheckbox,
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
  createUseToggle,
  createUseToggleGroup,
  createUseToggleGroupItem,
  createUseTooltip,
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
export const useSlider: ReturnType<typeof createUseSlider> = createUseSlider(Vue)
export const useRadioGroup: ReturnType<typeof createUseRadioGroup> = createUseRadioGroup(Vue)
export const useRadioItem: ReturnType<typeof createUseRadioItem> = createUseRadioItem(Vue)
export const useCheckbox: ReturnType<typeof createUseCheckbox> = createUseCheckbox(Vue)
export const usePresence: ReturnType<typeof createUsePresence> = createUsePresence(Vue)
