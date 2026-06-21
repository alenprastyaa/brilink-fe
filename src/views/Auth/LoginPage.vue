<script setup>
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { login } = useAuth()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
if (localStorage.getItem('rememberedUsername')) {
  username.value = localStorage.getItem('rememberedUsername')
  rememberMe.value = true
}

const handleLogin = async () => {
  isLoading.value = true
  try {
    await login(username.value, password.value)

    if (rememberMe.value) {
      localStorage.setItem('rememberedUsername', username.value)
      // Again, avoid storing passwords directly. This is illustrative.
      // localStorage.setItem('rememberedPassword', password.value);
    } else {
      localStorage.removeItem('rememberedUsername')
      // localStorage.removeItem('rememberedPassword');
    }

  } catch (error) {
    console.error('Login gagal:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#d8ebff_0%,_#7db4f0_20%,_#1e3a8a_58%,_#0f172a_100%)]"
  >
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-slate-950/8 via-transparent to-slate-950/12"></div>
    <div class="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-300/12 blur-3xl"></div>
    <div class="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-blue-900/16 blur-3xl"></div>
    <div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-200/8 blur-3xl"></div>

    <div class="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:py-10">
      <div class="grid items-center gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:gap-10 2xl:gap-12">
        <section class="hidden xl:block">
          <div class="max-w-lg text-white 2xl:max-w-xl">
            <p class="text-xs font-semibold uppercase tracking-[0.42em] text-blue-100 2xl:text-sm">
              BRI Link Dashboard
            </p>
            <h1 class="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white [text-shadow:0_14px_34px_rgba(15,23,42,0.45)] 2xl:mt-6 2xl:text-5xl">
              Login yang lebih meyakinkan, cepat, dan terasa premium.
            </h1>
            <p class="mt-4 max-w-lg text-sm leading-6 text-slate-100 [text-shadow:0_8px_24px_rgba(15,23,42,0.35)] 2xl:mt-6 2xl:text-base 2xl:leading-7">
              Kelola laporan pembukuan, arus kas, dan performa toko dalam satu dashboard
              yang bersih dengan pengalaman masuk yang lebih profesional.
            </p>

            <div class="mt-6 grid max-w-lg grid-cols-2 gap-3 2xl:mt-10 2xl:gap-4">
              <div class="rounded-3xl border border-white/20 bg-white/14 p-4 shadow-2xl 2xl:p-5">
                <p class="text-xs font-semibold text-blue-50 2xl:text-sm">Monitoring</p>
                <p class="mt-2 text-2xl font-bold 2xl:text-3xl">24/7</p>
                <p class="mt-2 text-xs leading-5 text-slate-100 2xl:text-sm">Pantau laporan dan saldo toko setiap saat.</p>
              </div>
              <div class="rounded-3xl border border-white/20 bg-white/14 p-4 shadow-2xl 2xl:p-5">
                <p class="text-xs font-semibold text-blue-50 2xl:text-sm">Akses Aman</p>
                <p class="mt-2 text-2xl font-bold 2xl:text-3xl">1 Tap</p>
                <p class="mt-2 text-xs leading-5 text-slate-100 2xl:text-sm">Masuk cepat dengan tampilan yang jelas dan fokus.</p>
              </div>
            </div>

            <div class="login-hero-scene mt-7 2xl:mt-12">
              <div class="login-hero-stack">
                <div class="hero-card hero-card--back"></div>
                <div class="hero-card hero-card--mid"></div>
                <div class="hero-card hero-card--front">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100/80">
                        Live Summary
                      </p>
                      <p class="mt-3 text-2xl font-bold text-white">Pembukuan Harian</p>
                    </div>
                    <div class="rounded-2xl bg-white/15 px-3 py-2 text-xs font-semibold text-white 2xl:text-sm">
                      Online
                    </div>
                  </div>
                  <div class="mt-6 grid grid-cols-3 gap-3 2xl:mt-8">
                    <div class="rounded-2xl bg-white/10 p-3">
                      <p class="text-xs text-blue-100/80">Laporan</p>
                      <p class="mt-2 text-lg font-bold text-white 2xl:text-xl">128</p>
                    </div>
                    <div class="rounded-2xl bg-white/10 p-3">
                      <p class="text-xs text-blue-100/80">Toko</p>
                      <p class="mt-2 text-lg font-bold text-white 2xl:text-xl">12</p>
                    </div>
                    <div class="rounded-2xl bg-white/10 p-3">
                      <p class="text-xs text-blue-100/80">Status</p>
                      <p class="mt-2 text-lg font-bold text-emerald-300 2xl:text-xl">Aman</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mx-auto w-full max-w-md xl:max-w-none">
          <div
            class="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[linear-gradient(160deg,_rgba(248,250,252,0.96),_rgba(219,234,254,0.92)_55%,_rgba(191,219,254,0.88)_100%)] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.28)] sm:p-6 xl:rounded-[2rem] xl:p-7 2xl:p-8"
          >
            <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-600 to-cyan-400"></div>
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%)]"></div>
            <div class="absolute -right-14 top-10 h-32 w-32 rounded-full bg-cyan-200/28 blur-3xl"></div>
            <div class="absolute -left-10 bottom-16 h-24 w-24 rounded-full bg-blue-300/18 blur-3xl"></div>

            <div class="relative">
              <div class="flex items-center gap-3 sm:gap-4">
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white shadow-[0_18px_38px_rgba(37,99,235,0.35)] sm:h-16 sm:w-16"
                >
                  <svg class="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.9"
                      d="M3 10.5l9-6 9 6M5 9.5V19a1 1 0 001 1h3m10-10.5V19a1 1 0 01-1 1h-3M9 20v-5a1 1 0 011-1h4a1 1 0 011 1v5"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.35em] text-blue-700">
                    Secure Login
                  </p>
                  <h2 class="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-900 sm:text-3xl">
                    Masuk ke Dashboard
                  </h2>
                </div>
              </div>

              <p class="mt-4 text-sm leading-6 text-slate-700">
                Gunakan akun Anda untuk mengakses pembukuan, laporan, dan analitik toko secara aman.
              </p>

              <form @submit.prevent="handleLogin" class="mt-6 space-y-4 sm:space-y-5 xl:mt-7">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Username</label>
                  <div class="relative">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      v-model="username"
                      type="text"
                      required
                      autocomplete="username"
                      placeholder="Masukkan username"
                      class="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:py-3.5"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <label class="block text-sm font-semibold text-slate-700">Password</label>
                    <span class="text-xs font-medium text-slate-500">Enkripsi aktif</span>
                  </div>
                  <div class="relative">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      required
                      autocomplete="current-password"
                      placeholder="Masukkan password"
                      class="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-12 text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:py-3.5"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-700"
                    >
                      <svg
                        v-if="!showPassword"
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <label class="flex items-center gap-3 text-sm text-slate-600">
                    <input
                      id="remember"
                      v-model="rememberMe"
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Ingat username</span>
                  </label>
                  <a href="#" class="text-sm font-semibold text-blue-700 transition hover:text-blue-900">
                    Butuh bantuan?
                  </a>
                </div>

                <button
                  type="submit"
                  :disabled="isLoading"
                  class="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-slate-900 px-5 py-3.5 text-white shadow-[0_20px_40px_rgba(37,99,235,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.38)] disabled:cursor-not-allowed disabled:opacity-70 sm:py-4"
                >
                  <span class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition duration-300 group-hover:opacity-100"></span>
                  <span v-if="!isLoading" class="relative flex items-center justify-center gap-2 text-sm font-bold">
                    <span>Masuk Sekarang</span>
                    <svg class="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span v-else class="relative flex items-center justify-center gap-3 text-sm font-bold">
                    <svg class="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.003 8.003 0 0019.418 15M15 15H9"
                      />
                    </svg>
                    <span>Memverifikasi akun...</span>
                  </span>
                </button>
              </form>

              <div class="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-start gap-3">
                  <div class="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                  <div>
                    <p class="text-sm font-semibold text-slate-800">Akses aman dan cepat</p>
                    <p class="mt-1 text-sm leading-6 text-slate-600">
                      Sistem menyiapkan splash screen saat login dan saat membuka dashboard
                      agar transisi terasa lebih halus dan profesional.
                    </p>
                  </div>
                </div>
              </div>

              <p class="mt-5 text-center text-xs leading-6 text-slate-500">
                © 2026 BRI Link. Dashboard pembukuan harian untuk operasional toko.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-hero-scene {
  perspective: 1200px;
}

.login-hero-stack {
  position: relative;
  height: 220px;
  width: 100%;
  transform-style: preserve-3d;
}

.hero-card {
  position: absolute;
  inset: 0;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.9), rgba(37, 99, 235, 0.72));
  box-shadow: 0 30px 70px rgba(2, 6, 23, 0.34);
}

.hero-card--back {
  transform: rotateX(58deg) rotateZ(-16deg) translate3d(-52px, -14px, -110px);
  opacity: 0.35;
}

.hero-card--mid {
  transform: rotateX(58deg) rotateZ(-16deg) translate3d(-18px, 8px, -55px);
  opacity: 0.55;
}

.hero-card--front {
  padding: 24px;
  transform: rotateX(58deg) rotateZ(-16deg) translate3d(0, 0, 0);
  backdrop-filter: blur(14px);
}

@media (min-width: 1536px) {
  .login-hero-stack {
    height: 280px;
  }

  .hero-card--front {
    padding: 28px;
  }
}
</style>
