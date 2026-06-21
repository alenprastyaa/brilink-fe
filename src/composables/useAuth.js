// src/composables/useAuth.js
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useSplashScreen } from './useSplashScreen'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const { isAuthenticated, isAdmin, isKaryawan, user, getUserId } = storeToRefs(authStore)
  const { showSplash } = useSplashScreen()

  watchEffect(() => {
    authStore.setAuthHeader()
  })

  const login = async (username, password) => {
    try {
      await authStore.login(username, password)
      showSplash({
        title: 'Login Berhasil',
        message: 'Membuka dashboard dan menyinkronkan data Anda...',
        variant: 'login',
        minimumDuration: 1500,
      })
      router.push({ name: 'Dashboard' })
      return true
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authStore.logout()
    router.push({ name: 'Login' })
  }

  return {
    isAuthenticated,
    isAdmin,
    isKaryawan,
    user,
    getUserId,
    login,
    logout,
  }
}
