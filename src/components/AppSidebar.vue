<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { isAdmin } = useAuth()
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close'])

const navLinks = [
  {
    name: 'Dashboard',
    to: '/',
    icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  },
  {
    name: 'Laporan',
    to: '/reports',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    name: 'Buat Laporan',
    to: '/reports/create',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  },
  {
    name: 'Manajemen Bank',
    to: '/banks',
    icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  },
  {
    name: 'Tarik Uang',
    to: '/withdrawals',
    icon: 'M12 8c-2.2 0-4 1.3-4 3s1.8 3 4 3 4 1.3 4 3-1.8 3-4 3m0-12v14m0-14C9.8 5 8 6.3 8 8m4 0c2.2 0 4 1.3 4 3',
  },
]

const adminLinks = [
  {
    name: 'Manajemen Pengguna',
    to: '/users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    name: 'Manajemen Toko',
    to: '/stores',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
]

const allLinks = computed(() => [...navLinks, ...(isAdmin.value ? adminLinks : [])])

const handleCloseClick = () => {
  console.log('[sidebar] close button clicked')
  emit('close')
}

const handleRouteClick = () => {
  console.log('[sidebar] menu link clicked')
  emit('close')
}
</script>

<template>
  <aside
    class="fixed top-16 bottom-0 left-0 z-[70] w-[280px] bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 ease-in-out pointer-events-auto md:w-72"
    :style="{ transform: props.isOpen ? 'translateX(0)' : 'translateX(-100%)' }"
  >
    <div class="h-full overflow-y-auto p-4">
      <div class="sticky top-0 z-[60] mb-4 flex items-center justify-between bg-white pb-4 md:hidden">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Menu</p>
          <h2 class="text-lg font-bold text-gray-900">Navigasi</h2>
        </div>
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm active:scale-95"
          @click.stop="handleCloseClick"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav class="space-y-2">
        <router-link
          v-for="link in allLinks"
          :key="link.name"
          :to="link.to"
          @click="handleRouteClick"
          class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="link.icon"
              />
            </svg>
          </span>
          <span>{{ link.name }}</span>
        </router-link>
      </nav>
    </div>
  </aside>
</template>
