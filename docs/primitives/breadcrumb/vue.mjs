import * as Vue from "vue"
import { createUseBreadcrumb } from "/dist/adapters/vue.mjs"

const useBreadcrumb = createUseBreadcrumb(Vue)

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/docs/primitives", label: "Primitives" },
  { label: "Breadcrumb" },
]

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      ctx.onState(`${ITEMS.length} items`)
      const bc = useBreadcrumb()
      return {
        rootProps: bc.getRootProps(),
        sepProps: bc.getSeparatorProps(),
        items: ITEMS,
        getItemProps: (i) => bc.getItemProps({ current: i === ITEMS.length - 1 }),
      }
    },
    template: `
      <nav v-bind="rootProps">
        <ol style="display:flex; gap:6px; list-style:none; padding:0; margin:0;">
          <template v-for="(item, i) in items" :key="i">
            <li>
              <a v-if="item.href && i !== items.length - 1" :href="item.href" style="text-decoration:underline;">{{ item.label }}</a>
              <span v-else v-bind="getItemProps(i)" :style="i === items.length - 1 ? 'font-weight:600;' : ''">{{ item.label }}</span>
            </li>
            <li v-if="i !== items.length - 1" v-bind="sepProps" style="opacity:0.5;">/</li>
          </template>
        </ol>
      </nav>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}
