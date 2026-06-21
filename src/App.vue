<script setup>
import { onMounted } from 'vue'
import AppSplashScreen from '@/components/AppSplashScreen.vue'
import { useSplashScreen } from '@/composables/useSplashScreen'

const { splashState, showSplash, hideSplash } = useSplashScreen()

onMounted(() => {
  showSplash({
    title: 'BRI Link',
    message: 'Menyiapkan dashboard pembukuan harian...',
    variant: 'startup',
    minimumDuration: 1400,
  })
  hideSplash()
})
</script>

<template>
  <router-view />
  <AppSplashScreen
    :visible="splashState.visible"
    :title="splashState.title"
    :message="splashState.message"
    :variant="splashState.variant"
  />
</template>
