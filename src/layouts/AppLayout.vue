<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'

const isSidebarOpen = ref(false)
const isDesktopViewport = ref(false)

const syncSidebarWithViewport = () => {
  const nextIsDesktop = window.matchMedia('(min-width: 768px)').matches
  if (nextIsDesktop === isDesktopViewport.value) return

  isDesktopViewport.value = nextIsDesktop
  isSidebarOpen.value = nextIsDesktop
  console.log('[sidebar] viewport sync state:', isSidebarOpen.value)
}

const openSidebar = () => {
  console.log('[sidebar] open requested')
  isSidebarOpen.value = true
  console.log('[sidebar] state:', isSidebarOpen.value)
}

const closeSidebar = () => {
  console.log('[sidebar] close requested')
  isSidebarOpen.value = false
  console.log('[sidebar] state:', isSidebarOpen.value)
}

onMounted(() => {
  syncSidebarWithViewport()
  window.addEventListener('resize', syncSidebarWithViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncSidebarWithViewport)
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <AppHeader @open-sidebar="openSidebar" />
    <div class="flex flex-1 pt-16">
      <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />
      <main class="flex-1 main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  margin-left: 300px;
}

@media (max-width: 767px) {
  .main-content {
    margin-left: 0 !important;
  }
}
</style>
