<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuth } from '@/composables/useAuth'
import { useSplashScreen } from '@/composables/useSplashScreen'

const route = useRoute()
const { isKaryawan } = useAuth()
const { hideSplash } = useSplashScreen()
const isSidebarOpen = ref(false)
const isDesktopViewport = ref(false)
const showSidebar = computed(() => !isKaryawan.value)
const bottomNavItems = [
  {
    name: 'Beranda',
    to: '/',
    match: ['Dashboard'],
    icon: 'M3 12l2-2m0 0l7-7 7 7m-14 0v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Laporan',
    to: '/reports',
    match: ['ReportList'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    name: 'Buat',
    to: '/reports/create',
    match: ['ReportCreation'],
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    primary: true,
  },
  {
    name: 'Bank',
    to: '/banks',
    match: ['BankManagement'],
    icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  },
  {
    name: 'Tarik',
    to: '/withdrawals',
    match: ['WithdrawalManagement'],
    icon: 'M12 8c-2.2 0-4 1.3-4 3s1.8 3 4 3 4 1.3 4 3-1.8 3-4 3m0-12v14m0-14C9.8 5 8 6.3 8 8m4 0c2.2 0 4 1.3 4 3',
  },
]

const isBottomNavActive = (item) => item.match.includes(route.name)

const syncSidebarWithViewport = () => {
  const nextIsDesktop = window.matchMedia('(min-width: 768px)').matches
  if (nextIsDesktop === isDesktopViewport.value) return

  isDesktopViewport.value = nextIsDesktop
  isSidebarOpen.value = showSidebar.value && nextIsDesktop
}

const openSidebar = () => {
  if (!showSidebar.value) return
  isSidebarOpen.value = true
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

watch(showSidebar, (nextShowSidebar) => {
  isSidebarOpen.value = nextShowSidebar && isDesktopViewport.value
})

onMounted(() => {
  syncSidebarWithViewport()
  window.addEventListener('resize', syncSidebarWithViewport)
  hideSplash()
})

onUnmounted(() => {
  window.removeEventListener('resize', syncSidebarWithViewport)
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <AppHeader :show-sidebar-toggle="showSidebar" @open-sidebar="openSidebar" />
    <div class="flex flex-1 pt-16">
      <AppSidebar v-if="showSidebar" :is-open="isSidebarOpen" @close="closeSidebar" />
      <main
        class="flex-1 main-content"
        :class="{ 'main-content--full': !showSidebar, 'main-content--bottom-nav': isKaryawan }"
      >
        <router-view />
      </main>
    </div>

    <nav
      v-if="isKaryawan"
      class="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2"
      aria-label="Navigasi bawah"
    >
      <div
        class="mx-auto grid max-w-md grid-cols-5 items-end gap-1 rounded-[26px] border border-white/60 bg-white/85 px-2 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-xl"
      >
        <router-link
          v-for="item in bottomNavItems"
          :key="item.name"
          :to="item.to"
          class="group relative flex min-w-0 flex-col items-center justify-end gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors duration-300"
          :class="
            isBottomNavActive(item) && !item.primary
              ? 'text-blue-600'
              : item.primary
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
          "
        >
          <span
            class="flex items-center justify-center transition-all duration-300 ease-out"
            :class="
              item.primary
                ? 'mb-1 h-14 w-14 -translate-y-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/40 ring-4 ring-white group-active:scale-95'
                : isBottomNavActive(item)
                  ? 'h-9 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                  : 'h-9 w-12 rounded-2xl text-gray-400 group-hover:bg-gray-100 group-active:scale-95'
            "
          >
            <svg
              class="transition-transform duration-300"
              :class="[
                item.primary ? 'h-7 w-7' : 'h-[22px] w-[22px]',
                isBottomNavActive(item) && !item.primary ? 'scale-110' : '',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :stroke-width="isBottomNavActive(item) || item.primary ? 2.2 : 1.9"
                :d="item.icon"
              />
            </svg>
          </span>
          <span class="max-w-full truncate">{{ item.name }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.main-content {
  margin-left: 288px;
  min-width: 0;
  width: 100%;
  overflow-x: hidden;
}

.main-content--full {
  margin-left: 0;
}

.main-content--bottom-nav {
  padding-bottom: calc(7rem + env(safe-area-inset-bottom));
}

@media (max-width: 767px) {
  .main-content {
    margin-left: 0 !important;
  }
}
</style>
