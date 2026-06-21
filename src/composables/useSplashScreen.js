import { computed, reactive } from 'vue'

const state = reactive({
  visible: true,
  title: 'BRI Link',
  message: 'Menyiapkan aplikasi...',
  variant: 'startup',
  startedAt: Date.now(),
  minimumDuration: 1200,
})

let hideTimerId = null

const clearHideTimer = () => {
  if (hideTimerId) {
    window.clearTimeout(hideTimerId)
    hideTimerId = null
  }
}

export function useSplashScreen() {
  const showSplash = ({
    title = 'BRI Link',
    message = 'Memuat tampilan...',
    variant = 'startup',
    minimumDuration = 1200,
  } = {}) => {
    clearHideTimer()
    state.title = title
    state.message = message
    state.variant = variant
    state.visible = true
    state.startedAt = Date.now()
    state.minimumDuration = minimumDuration
  }

  const hideSplash = ({ immediate = false } = {}) => {
    const elapsed = Date.now() - state.startedAt
    const delay = immediate ? 0 : Math.max(0, state.minimumDuration - elapsed)

    clearHideTimer()
    hideTimerId = window.setTimeout(() => {
      state.visible = false
      hideTimerId = null
    }, delay)
  }

  return {
    splashState: computed(() => state),
    showSplash,
    hideSplash,
  }
}
