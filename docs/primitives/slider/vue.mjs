import * as Vue from "vue"
import { createUseSlider } from "/dist/adapters/vue.mjs"

const useSlider = createUseSlider(Vue)

export function mount(root, ctx) {
  const app = Vue.createApp({
    setup() {
      const slider = useSlider({
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
        onValueChange: (v) => ctx.onState(String(v)),
      })
      const rootRef = Vue.ref(null)
      const trackRef = Vue.ref(null)
      const rangeRef = Vue.ref(null)
      const thumbRef = Vue.ref(null)

      Vue.onMounted(() => {
        const destroy = slider.mount({
          root: rootRef.value,
          track: trackRef.value,
          range: rangeRef.value ?? undefined,
          thumbs: [thumbRef.value],
        })
        Vue.onScopeDispose(destroy)
      })

      ctx.onState(String(slider.value.get()))
      return {
        rootProps: slider.rootProps,
        trackProps: slider.trackProps,
        rangeProps: slider.rangeProps,
        thumbProps: Vue.computed(() => slider.getThumbProps()),
        rootRef,
        trackRef,
        rangeRef,
        thumbRef,
        currentValue: Vue.computed(() => slider.value.get()),
      }
    },
    template: `
      <div>
        <div ref="rootRef" v-bind="rootProps" class="slider">
          <div ref="trackRef" v-bind="trackProps" class="slider-track">
            <div ref="rangeRef" v-bind="rangeProps" class="slider-range"></div>
          </div>
          <button ref="thumbRef" v-bind="thumbProps" class="slider-thumb" type="button"></button>
        </div>
        <div style="margin-top: 12px; color: var(--muted); font-size: 13px;">Value: {{ currentValue }}</div>
      </div>
    `,
  })
  app.mount(root)
  return () => app.unmount()
}
