<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useApi } from '@/composables/useApi'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuth } from '@/composables/useAuth'
import FormField from '@/components/FormField.vue'
import { format } from 'date-fns'

const { get, post } = useApi()
const { showAlert } = useSweetAlert()
const { isAdmin, user } = useAuth()

const stores = ref([])
const banks = ref([])
const reportForm = ref({
  store_id: '',
  report_date: format(new Date(), 'yyyy-MM-dd'),
  balances: [],
  keterangan: '',
  uang_nitip: 0,
})
const isLoading = ref(false)
const isStoreFieldDisabled = ref(false)
const currentStep = ref(1)
const totalSteps = 3
const selectedStoreId = ref(null)
const step1Ref = ref(null)
const step2Ref = ref(null)
const step3Ref = ref(null)

const newBank = ref({
  store_id: null,
})

const fetchStores = async () => {
  try {
    const response = await get('/stores')
    stores.value = response.stores || []
    if (stores.value.length > 0 && selectedStoreId.value === null) {
      selectedStoreId.value = stores.value[0].store_id

      if (!isAdmin.value && stores.value.length === 1) {
        reportForm.value.store_id = stores.value[0].store_id
        isStoreFieldDisabled.value = true
      }
    }

    if (newBank.value.store_id === null && stores.value.length > 0) {
      newBank.value.store_id = stores.value[0].store_id
    }
  } catch (error) {
    console.error('Failed to fetch stores:', error)
    showAlert('Error', 'Gagal memuat daftar toko.', 'error')
  }
}

watch(selectedStoreId, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    fetchBanks()
  }
})

const fetchBanks = async () => {
  try {
    let response
    if (selectedStoreId.value) {
      response = await get(`/banks/store/${selectedStoreId.value}`)
    } else {
      response = await get('/banks')
    }
    banks.value = response.banks
    reportForm.value.balances = banks.value.map((bank) => ({
      bank_id: bank.bank_id,
      bank_name: bank.bank_name,
      saldo: 0,
      keterangan: bank.keterangan,
      uang_nitip: bank.uang_nitip,
    }))

    const currentBankIds = new Set(banks.value.map((b) => b.bank_id))
    reportForm.value.balances = reportForm.value.balances.filter((b) =>
      currentBankIds.has(b.bank_id),
    )
  } catch (error) {
    console.error('Failed to fetch banks:', error)
    showAlert('Error', 'Gagal memuat daftar bank.', 'error')
  }
}
watch(
  user,
  async (newUser) => {
    if (newUser) {
      await fetchStores()

      if (!isAdmin.value && stores.value.length === 1) {
        reportForm.value.store_id = stores.value[0].store_id
        isStoreFieldDisabled.value = true
        selectedStoreId.value = stores.value[0].store_id
      } else if (isAdmin.value && stores.value.length > 0) {
        selectedStoreId.value = stores.value[0].store_id
      }
      await fetchBanks()
    }
  },
  { immediate: true },
)

const storeOptions = computed(() => {
  return stores.value.map((store) => ({
    label: store.store_name,
    value: store.store_id,
  }))
})

const totalBalance = computed(() => {
  return reportForm.value.balances.reduce((sum, balance) => sum + (balance.saldo || 0), 0)
})

const filledBanks = computed(() => {
  return reportForm.value.balances.filter((b) => (b.saldo || 0) > 0).length
})

const canProceedToStep2 = computed(() => {
  return reportForm.value.store_id && reportForm.value.report_date
})

const canSubmit = computed(() => {
  const validBalances = reportForm.value.balances.filter((b) => (b.saldo || 0) > 0)
  return reportForm.value.store_id && reportForm.value.report_date && validBalances.length > 0
})

const nextStep = () => {
  if (currentStep.value === 1) {
    if (!canProceedToStep2.value) {
      showAlert(
        'Peringatan!',
        'Harap lengkapi semua informasi dasar (toko dan tanggal).',
        'warning',
      )
      return
    }

    reportForm.value.store_id = selectedStoreId.value
  }
  if (currentStep.value === 2 && filledBanks.value === 0 && banks.value.length > 0) {
    showAlert('Peringatan!', 'Setidaknya satu saldo bank harus diisi.', 'warning')
    return
  }
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const focusableSelector =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const getCurrentStepElement = () => {
  if (currentStep.value === 1) return step1Ref.value
  if (currentStep.value === 2) return step2Ref.value
  return step3Ref.value
}

const getFocusableElements = (container) => {
  if (!container) return []

  return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
    if (element.tabIndex === -1) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    if (element.offsetParent === null && getComputedStyle(element).position !== 'fixed') return false
    return true
  })
}

const focusFirstFieldInCurrentStep = async () => {
  await nextTick()
  const [firstField] = getFocusableElements(getCurrentStepElement())
  firstField?.focus()
}

const handleEnterNavigation = async (event) => {
  if (event.key !== 'Enter') return

  const target = event.target
  const tagName = target?.tagName?.toLowerCase()

  if (tagName === 'textarea') return
  if (tagName === 'button') {
    event.preventDefault()
    return
  }

  event.preventDefault()

  const stepElement = getCurrentStepElement()
  const focusableElements = getFocusableElements(stepElement)
  const currentIndex = focusableElements.indexOf(target)

  if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
    focusableElements[currentIndex + 1]?.focus()
    return
  }

  if (currentStep.value === 1 && canProceedToStep2.value && stores.value.length > 0) {
    nextStep()
    await focusFirstFieldInCurrentStep()
    return
  }

  if (currentStep.value === 2 && !((filledBanks.value === 0 && banks.value.length > 0) || banks.value.length === 0)) {
    nextStep()
    await focusFirstFieldInCurrentStep()
  }
}

const handleSubmitReport = async () => {
  isLoading.value = true
  try {
    const validBalances = reportForm.value.balances
      .filter((b) => (b.saldo || 0) > 0)
      .map((b) => {
        let saldoToSend = parseFloat(b.saldo) || 0
        let adminFee = 0
        if (b.bank_name === 'EDC BCA' && saldoToSend > 0) {
          adminFee = saldoToSend * 0.01
          saldoToSend -= adminFee
        } else if (b.bank_name === 'EDC DKI' && saldoToSend > 0) {
          adminFee = saldoToSend * 0.0014
          saldoToSend -= adminFee
        } else if (b.bank_name === 'QRIS' && saldoToSend > 0) {
          adminFee = saldoToSend * 0.007
          saldoToSend -= adminFee
        }
        return {
          bank_id: b.bank_id,
          bank_name: b.bank_name,
          saldo: saldoToSend,
          admin_fee_applied: adminFee,
        }
      })
    if (validBalances.length === 0) {
      showAlert('Peringatan!', 'Setidaknya satu saldo bank harus diisi.', 'warning')
      isLoading.value = false
      return
    }
    if (!reportForm.value.store_id) {
      showAlert('Peringatan!', 'Toko harus dipilih.', 'warning')
      isLoading.value = false
      return
    }
    const payload = {
      store_id: reportForm.value.store_id,
      report_date: reportForm.value.report_date,
      balances: validBalances,
      keterangan: reportForm.value.keterangan,
      uang_nitip: parseFloat(reportForm.value.uang_nitip) || 0,
    }
    await post('/reports', payload)
    showAlert(
      'Laporan Berhasil di Buat!',
      'Selamat Beristirahat & Jangan lupa matikan Komputer',
      'success',
    )
    resetForm()
    currentStep.value = 1
    if (!isAdmin.value && stores.value.length === 1) {
      reportForm.value.store_id = stores.value[0].store_id
      selectedStoreId.value = stores.value[0].store_id
      isStoreFieldDisabled.value = true
    } else if (isAdmin.value && stores.value.length > 0) {
      selectedStoreId.value = stores.value[0].store_id
    } else {
      selectedStoreId.value = null
    }
    fetchBanks()
  } catch (error) {
    console.error('Failed to create report:', error)
    const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat membuat laporan.'
    showAlert('Error', errorMessage, 'error')
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  reportForm.value = {
    store_id: '',
    report_date: format(new Date(), 'yyyy-MM-dd'),
    keterangan: '',
    uang_nitip: 0,
    balances: banks.value.map((bank) => ({
      bank_id: bank.bank_id,
      bank_name: bank.bank_name,
      saldo: 0,
    })),
  }
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount) || amount === '') {
    return 'Rp 0'
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div class="mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div class="mb-5 text-center sm:mb-8">
        <div
          class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 sm:mb-4 sm:h-16 sm:w-16"
        >
          <svg class="h-6 w-6 text-white sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1
          class="mb-1 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent sm:mb-2 sm:text-4xl"
        >
          Laporan Harian
        </h1>
        <p class="text-sm text-gray-600 sm:text-lg">Buat laporan keuangan harian dengan mudah</p>
      </div>

      <div class="mb-5 sm:mb-8">
        <div class="flex justify-center">
          <div class="flex items-center space-x-1 sm:space-x-4">
            <div v-for="step in totalSteps" :key="step" class="flex items-center">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 sm:h-10 sm:w-10"
                :class="
                  step <= currentStep
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-400'
                "
              >
                <span class="text-xs font-semibold sm:text-sm">{{ step }}</span>
              </div>
              <div
                v-if="step < totalSteps"
                class="mx-1 h-1 w-10 transition-all duration-300 sm:mx-2 sm:w-16"
                :class="
                  step < currentStep
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    : 'bg-gray-200'
                "
              ></div>
            </div>
          </div>
        </div>
        <div class="mt-3 flex justify-center sm:mt-4">
          <div class="text-center text-xs text-gray-600 sm:text-sm">
            <span v-if="currentStep === 1">Informasi Dasar</span>
            <span v-else-if="currentStep === 2">Saldo Bank & Pembayaran</span>
            <span v-else>Konfirmasi</span>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-4xl">
        <div
          class="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-sm sm:rounded-3xl sm:shadow-xl"
        >
          <form @submit.prevent="handleSubmitReport" @keydown.enter="handleEnterNavigation">
            <div v-show="currentStep === 1" ref="step1Ref" class="p-4 sm:p-8">
              <div class="mb-4 sm:mb-6">
                <h2 class="mb-1 text-lg font-semibold text-gray-800 sm:mb-2 sm:text-2xl">Informasi Dasar</h2>
                <p class="text-sm text-gray-600 sm:text-base">Pilih toko dan tanggal untuk laporan Anda</p>
              </div>

              <div
                v-if="!isAdmin && stores.length === 0"
                class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg
                      class="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-red-800 font-medium">Tidak ada toko terhubung</p>
                    <p class="text-red-700 text-sm">
                      Silakan hubungi administrator untuk penugasan toko.
                    </p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                <div class="space-y-2">
                  <FormField
                    label="Pilih Toko"
                    type="select"
                    v-model="selectedStoreId"
                    :options="storeOptions"
                    placeholder="Pilih Toko"
                    required
                    :disabled="isStoreFieldDisabled || stores.length === 0"
                  />
                </div>
                <div class="space-y-2">
                  <FormField
                    label="Tanggal Laporan"
                    type="date"
                    v-model="reportForm.report_date"
                    required
                  />
                </div>
              </div>

              <div class="mt-5 flex justify-end sm:mt-8">
                <button
                  type="button"
                  @click="nextStep"
                  :disabled="!canProceedToStep2 || stores.length === 0"
                  class="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
                >
                  Lanjutkan
                  <svg
                    class="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div v-show="currentStep === 2" ref="step2Ref" class="p-4 sm:p-8">
              <div class="mb-4 sm:mb-6">
                <h2 class="mb-1 text-lg font-semibold text-gray-800 sm:mb-2 sm:text-2xl">Saldo Bank & Pembayaran</h2>
                <p class="text-sm text-gray-600 sm:text-base">Masukkan saldo untuk setiap metode pembayaran</p>
              </div>

              <div
                v-if="banks.length === 0"
                class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6"
              >
                <div class="flex items-center">
                  <svg
                    class="w-6 h-6 text-yellow-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p class="text-yellow-800">
                    Belum ada bank/pembayaran yang terdaftar untuk toko ini. Harap tambahkan di
                    Manajemen Bank.
                  </p>
                </div>
              </div>

              <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 sm:mb-6">
                <div
                  v-for="(bankBalance, index) in reportForm.balances"
                  :key="bankBalance.bank_id"
                  class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 transition-all duration-200 hover:shadow-md sm:p-6"
                >
                  <div class="mb-3 flex items-center sm:mb-4">
                    <div
                      class="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500 sm:mr-4 sm:h-12 sm:w-12"
                    >
                      <svg
                        class="h-5 w-5 text-white sm:h-6 sm:w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <h3 class="text-sm font-semibold text-gray-800 sm:text-base">{{ bankBalance.bank_name }}</h3>
                  </div>
                  <FormField
                    :label="`Saldo ${bankBalance.bank_name}`"
                    type="text"
                    v-model.number="bankBalance.saldo"
                    :placeholder="`Masukkan saldo ${bankBalance.bank_name}`"
                    :min="0"
                    isCurrency
                  />
                </div>
              </div>

              <div class="mb-4 sm:mb-6">
                <FormField
                  label="Jumlah Uang Nitip (Jika ada)"
                  type="text"
                  v-model.number="reportForm.uang_nitip"
                  placeholder="Masukkan jumlah uang nitip dan jangan tulis pada Keterangan"
                  isCurrency
                  :min="0"
                />
              </div>

              <div class="mb-6 sm:mb-10">
                <label for="keterangan" class="block text-sm font-medium text-gray-700 mb-1"
                  >Keterangan</label
                >
                <textarea
                  v-model="reportForm.keterangan"
                  id="keterangan"
                  name="keterangan"
                  rows="4"
                  class="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2 text-sm text-gray-700"
                  placeholder="Tulis keterangan di sini..."
                ></textarea>
              </div>

              <div
                class="mb-5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:mb-6 sm:p-6"
              >
                <h3 class="mb-3 text-base font-semibold text-blue-900 sm:mb-4 sm:text-lg">Ringkasan</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div class="text-center">
                    <p class="mb-1 text-xs text-blue-700 sm:text-sm">Total Saldo</p>
                    <p class="text-lg font-bold text-blue-900 sm:text-2xl">
                      {{ formatCurrency(totalBalance) }}
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="mb-1 text-xs text-blue-700 sm:text-sm">Bank Terisi</p>
                    <p class="text-lg font-bold text-blue-900 sm:text-2xl">
                      {{ filledBanks }} / {{ banks.length }}
                    </p>
                  </div>
                  <div class="text-center sm:col-span-2">
                    <p class="mb-1 text-xs text-blue-700 sm:text-sm">Uang Nitip</p>
                    <p class="text-lg font-bold text-blue-900 sm:text-2xl">
                      {{ formatCurrency(reportForm.uang_nitip) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  @click="prevStep"
                  class="rounded-xl bg-gray-500 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-gray-600"
                >
                  <svg
                    class="w-5 h-5 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Kembali
                </button>
                <button
                  type="button"
                  @click="nextStep"
                  :disabled="(filledBanks === 0 && banks.length > 0) || banks.length === 0"
                  class="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lanjutkan
                  <svg
                    class="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div v-show="currentStep === 3" ref="step3Ref" class="p-4 sm:p-8">
              <div class="mb-4 sm:mb-6">
                <h2 class="mb-1 text-lg font-semibold text-gray-800 sm:mb-2 sm:text-2xl">Konfirmasi Laporan</h2>
                <p class="text-sm text-gray-600 sm:text-base">Periksa kembali data laporan sebelum menyimpan</p>
              </div>

              <div class="space-y-4 sm:space-y-6">
                <div
                  class="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6"
                >
                  <h3 class="mb-3 text-base font-semibold text-gray-800 sm:mb-4 sm:text-lg">Informasi Dasar</h3>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <p class="text-xs text-gray-600 sm:text-sm">Toko</p>
                      <p class="text-sm font-semibold text-gray-800 sm:text-base">
                        {{
                          storeOptions.find((s) => s.value === reportForm.store_id)?.label ||
                          'Tidak dipilih'
                        }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 sm:text-sm">Tanggal</p>
                      <p class="text-sm font-semibold text-gray-800 sm:text-base">{{ reportForm.report_date }}</p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6"
                >
                  <h3 class="mb-3 text-base font-semibold text-gray-800 sm:mb-4 sm:text-lg">Detail Saldo</h3>
                  <div class="space-y-3">
                    <div
                      v-for="balance in reportForm.balances.filter((b) => (b.saldo || 0) > 0)"
                      :key="balance.bank_id"
                      class="flex items-center justify-between gap-3 border-b border-gray-200 py-2 text-sm last:border-b-0"
                    >
                      <span class="text-gray-700">{{ balance.bank_name }}</span>
                      <span class="font-semibold text-gray-900">{{
                        formatCurrency(balance.saldo)
                      }}</span>
                    </div>
                  </div>
                  <div class="mt-4 border-t border-gray-300 pt-4">
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <span class="text-sm font-semibold text-gray-800 sm:text-lg">Total Saldo Bank</span>
                      <span class="text-sm font-bold text-green-600 sm:text-xl">{{
                        formatCurrency(totalBalance)
                      }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-sm font-semibold text-gray-800 sm:text-lg">Jumlah Uang Nitip</span>
                      <span class="text-sm font-bold text-green-600 sm:text-xl">{{
                        formatCurrency(reportForm.uang_nitip)
                      }}</span>
                    </div>
                  </div>
                  <div class="mt-10">
                    <label for="keterangan" class="block text-sm font-medium text-gray-700 mb-3"
                      >Keterangan</label
                    >
                    <div
                      class="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-3 text-sm text-gray-700 bg-gray-50 min-h-[100px]"
                    >
                      {{ reportForm.keterangan || 'Tidak ada keterangan.' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-5 flex flex-col-reverse gap-2 sm:mt-8 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  @click="prevStep"
                  class="rounded-xl bg-gray-500 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-gray-600"
                >
                  <svg
                    class="w-5 h-5 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Kembali
                </button>
                <button
                  type="submit"
                  :disabled="!canSubmit || isLoading"
                  class="flex items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-8 py-3 font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    v-if="isLoading"
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {{ isLoading ? 'Menyimpan Laporan...' : 'Simpan Laporan' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container > * {
  animation: slideIn 0.6s ease-out;
}

.bg-white\/80 {
  background: rgba(255, 255, 255, 0.8);
}

.backdrop-blur-sm {
  backdrop-filter: blur(8px);
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #6366f1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #4f46e5);
}
</style>
