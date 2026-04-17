import * as Vue from "vue"
import { createUseAvatar } from "/dist/adapters/vue.mjs"

const useAvatar = createUseAvatar(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const a = useAvatar({
        src: "https://github.com/productdevbook.png?size=64",
        alt: "Mehmet",
        onStatusChange: ctx.onState,
      })
      ctx.onState(a.status.get())
      return { imageProps: a.imageProps, fallbackProps: a.fallbackProps, status: a.status }
    },
    template: `
      <div class="avatar-row">
        <div class="avatar">
          <img v-bind="imageProps" alt="Mehmet" />
          <span v-bind="fallbackProps" class="avatar-fb">MK</span>
        </div>
        <div>
          <div style="font-weight:600;">Mehmet Kahya</div>
          <div style="color:var(--muted); font-size:13px;">Status: {{ status.get() }}</div>
        </div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}
