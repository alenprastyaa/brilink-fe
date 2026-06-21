<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'BRI Link',
  },
  message: {
    type: String,
    default: 'Menyiapkan aplikasi...',
  },
  variant: {
    type: String,
    default: 'startup',
  },
})
</script>

<template>
  <transition name="splash-fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] overflow-hidden bg-slate-950 text-white"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.28),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_42%,_#111827_100%)]"></div>
      <div class="absolute -left-16 top-20 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-cyan-400/15 blur-3xl"></div>

      <div class="relative flex min-h-screen items-center justify-center px-6 py-8">
        <div class="w-full max-w-md text-center">
          <div class="scene mx-auto mb-6 h-24 w-24 sm:mb-8 sm:h-28 sm:w-28">
            <div class="cube">
              <div class="cube-face cube-face--front">
                <span class="text-3xl font-black tracking-[0.2em]">BRI</span>
              </div>
              <div class="cube-face cube-face--right">
                <span class="text-lg font-bold tracking-[0.18em]">LINK</span>
              </div>
              <div class="cube-face cube-face--top"></div>
            </div>
          </div>

          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.5em] text-blue-200/80">
            {{ variant === 'login' ? 'Secure Access' : 'Smart Reporting' }}
          </p>
          <h1 class="text-2xl font-black tracking-[0.1em] text-white sm:text-3xl">{{ title }}</h1>
          <p class="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-300">
            {{ message }}
          </p>

          <div class="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-white/10 sm:mt-8 sm:w-56">
            <div class="splash-progress h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300"></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.35s ease;
}

.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}

.scene {
  perspective: 900px;
}

.cube {
  position: relative;
  height: 100%;
  width: 100%;
  transform-style: preserve-3d;
  animation: cubeFloat 3.8s ease-in-out infinite;
}

.cube-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(59, 130, 246, 0.95), rgba(15, 23, 42, 0.92));
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.28);
  backdrop-filter: blur(10px);
}

.cube-face--front {
  transform: translateZ(28px);
}

.cube-face--right {
  background: linear-gradient(145deg, rgba(14, 165, 233, 0.95), rgba(30, 41, 59, 0.95));
  transform: rotateY(90deg) translateZ(28px);
}

.cube-face--top {
  background: linear-gradient(145deg, rgba(148, 163, 184, 0.22), rgba(59, 130, 246, 0.45));
  transform: rotateX(90deg) translateZ(28px);
}

.splash-progress {
  animation: progressSlide 1.8s ease-in-out infinite;
}

@keyframes cubeFloat {
  0%,
  100% {
    transform: rotateX(-18deg) rotateY(-30deg) translateY(0);
  }
  50% {
    transform: rotateX(-8deg) rotateY(-8deg) translateY(-10px);
  }
}

@keyframes progressSlide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(220%);
  }
}
</style>
