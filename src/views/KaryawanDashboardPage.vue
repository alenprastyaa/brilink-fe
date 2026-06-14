<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

const quickLinks = [
  {
    name: 'Setoran',
    description: 'Input dan pantau setoran harian.',
    to: '/deposits',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2M5 20h14a1 1 0 001-1V8.5a1 1 0 00-.293-.707l-3.5-3.5A1 1 0 0015.5 4H5a1 1 0 00-1 1v14a1 1 0 001 1z',
    gradient: 'from-violet-500 to-fuchsia-700',
    glow: 'shadow-violet-500/30',
  },
  {
    name: 'Laporan',
    description: 'Lihat dan pantau laporan harian toko.',
    to: '/reports',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    gradient: 'from-blue-500 to-blue-700',
    glow: 'shadow-blue-500/30',
  },
  {
    name: 'Buat Laporan',
    description: 'Input laporan baru untuk aktivitas hari ini.',
    to: '/reports/create',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    gradient: 'from-emerald-500 to-green-700',
    glow: 'shadow-emerald-500/30',
  },
  {
    name: 'Manajemen Bank',
    description: 'Kelola daftar bank dan data rekening.',
    to: '/banks',
    icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
    gradient: 'from-teal-500 to-cyan-700',
    glow: 'shadow-teal-500/30',
  },
  {
    name: 'Tarik Uang',
    description: 'Catat dan cek transaksi penarikan uang.',
    to: '/withdrawals',
    icon: 'M12 8c-2.2 0-4 1.3-4 3s1.8 3 4 3 4 1.3 4 3-1.8 3-4 3m0-12v14m0-14C9.8 5 8 6.3 8 8m4 0c2.2 0 4 1.3 4 3',
    gradient: 'from-orange-500 to-amber-600',
    glow: 'shadow-orange-500/30',
  },
]

const userName = computed(() => user.value?.full_name || user.value?.username || 'Pengguna')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
})

const initials = computed(() =>
  userName.value
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <main class="min-h-screen max-w-full overflow-x-hidden bg-linear-to-b from-slate-50 to-slate-100 px-3 py-4 sm:px-4 lg:px-6">
    <section class="mx-auto max-w-6xl">
      <div
        class="relative mb-5 overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 shadow-lg shadow-blue-900/20 sm:mb-7 sm:p-7"
      >
        <div class="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl"></div>
        <div class="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl"></div>

        <div class="relative flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Dashboard</p>
            <h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {{ greeting }}, {{ userName }}
            </h1>
            <p class="mt-1.5 text-sm text-blue-100/90">
              Pilih menu di bawah untuk mulai bekerja hari ini.
            </p>
            <span
              class="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize text-white ring-1 ring-inset ring-white/20 backdrop-blur"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
              {{ user?.role || 'user' }}
            </span>
          </div>
          <div
            class="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white ring-1 ring-inset ring-white/25 backdrop-blur sm:flex"
          >
            {{ initials }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <router-link
          v-for="link in quickLinks"
          :key="link.name"
          :to="link.to"
          class="group relative flex min-h-[156px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-100 sm:min-h-[185px] sm:p-5"
          :class="[link.gradient, link.glow]"
        >
          <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
          <div
            class="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl transition-transform duration-500 group-hover:scale-150"
          ></div>

          <div class="relative min-w-0">
            <div
              class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner ring-1 ring-inset ring-white/25 backdrop-blur-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:h-16 sm:w-16"
            >
              <svg class="h-7 w-7 sm:h-9 sm:w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
              </svg>
            </div>
            <h2 class="text-base font-bold leading-snug text-white sm:text-lg">{{ link.name }}</h2>
            <p class="mt-1.5 hidden text-sm leading-5 text-white/85 sm:block">{{ link.description }}</p>
          </div>

          <div class="relative mt-4 flex items-center justify-between gap-3">
            <span
              class="inline-flex items-center gap-1 truncate rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/15"
            >
              Buka menu
            </span>
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-inset ring-white/15 transition-all duration-300 group-hover:bg-white group-hover:text-slate-900"
            >
              <svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </router-link>
      </div>
    </section>
  </main>
</template>
