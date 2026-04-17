import * as Vue from "vue"
import { createUsePagination } from "/dist/adapters/vue.mjs"

const usePagination = createUsePagination(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const p = usePagination({
        pageCount: 12,
        defaultPage: 1,
        onPageChange: (n) => ctx.onState(`page ${n}`),
      })
      ctx.onState(`page ${p.pageRef.value}`)
      return {
        rootProps: p.rootProps,
        pages: p.pagesRef,
        prev: Vue.computed(() => p.getPrevProps()),
        next: Vue.computed(() => p.getNextProps()),
        itemFor: (n) => p.getItemProps(n),
      }
    },
    template: `
      <div style="padding: 24px 0;">
        <nav v-bind="rootProps">
          <ul style="display:flex; gap:6px; list-style:none; padding:0; margin:0; align-items:center;">
            <li><button v-bind="prev" style="padding:4px 10px; border-radius:6px;">‹</button></li>
            <template v-for="(it, i) in pages" :key="it === 'ellipsis' ? 'e' + i : it">
              <li v-if="it === 'ellipsis'" style="opacity:0.5; padding:4px 6px;">…</li>
              <li v-else>
                <button
                  v-bind="itemFor(it)"
                  :style="{ padding: '4px 10px', borderRadius: '6px', fontWeight: itemFor(it)['aria-current'] ? '600' : '400' }"
                >{{ it }}</button>
              </li>
            </template>
            <li><button v-bind="next" style="padding:4px 10px; border-radius:6px;">›</button></li>
          </ul>
        </nav>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}
