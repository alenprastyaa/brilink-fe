<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useApi } from '@/composables/useApi'
import { useAuth } from '@/composables/useAuth'
import { useSweetAlert } from '@/composables/useSweetAlert'
import FormField from '@/components/FormField.vue'

const { get, post, del } = useApi()
const { isAdmin } = useAuth()
const { showAlert, showConfirm } = useSweetAlert()

const withdrawals = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isOcrLoading = ref(false)
const selectedFile = ref(null)
const previewUrl = ref('')
const fileInputRef = ref(null)
const currentPage = ref(1)
const itemsPerPage = 8
const selectedKtpPreview = ref(null)
const ocrMessage = ref('')
const searchQuery = ref('')
const isFormModalOpen = ref(false)

const createEmptyForm = () => ({
  withdrawal_name: '',
  amount: 0,
  ktp_nik: '',
  ktp_birth_place: '',
  ktp_birth_date: '',
  ktp_gender: '',
  ktp_address: '',
  ktp_ocr_status: '',
  ktp_ocr_text: '',
  ktp_ocr_error: '',
})

const form = ref(createEmptyForm())

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return '-'
  return format(new Date(value), 'dd MMM yyyy', { locale: id })
}

const ktpFields = computed(() => {
  if (!selectedKtpPreview.value) return []

  return [
    { label: 'Status OCR', value: selectedKtpPreview.value.ktp_ocr_status || '-' },
    { label: 'NIK', value: selectedKtpPreview.value.ktp_nik || '-' },
    { label: 'Nama', value: selectedKtpPreview.value.ktp_name || '-' },
    { label: 'Tempat Lahir', value: selectedKtpPreview.value.ktp_birth_place || '-' },
    { label: 'Tanggal Lahir', value: formatDate(selectedKtpPreview.value.ktp_birth_date) },
    { label: 'Jenis Kelamin', value: selectedKtpPreview.value.ktp_gender || '-' },
    { label: 'Alamat', value: selectedKtpPreview.value.ktp_address || '-' },
  ]
})

const clearPreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const resetForm = () => {
  form.value = createEmptyForm()
  selectedFile.value = null
  ocrMessage.value = ''
  clearPreview()
}

const applyOcrResult = (result) => {
  form.value.ktp_nik = result.ktp_nik || ''
  form.value.withdrawal_name = result.ktp_name || form.value.withdrawal_name
  form.value.ktp_birth_place = result.ktp_birth_place || ''
  form.value.ktp_birth_date = result.ktp_birth_date || ''
  form.value.ktp_gender = result.ktp_gender || ''
  form.value.ktp_address = result.ktp_address || ''
  form.value.ktp_ocr_status = result.ktp_ocr_status || ''
  form.value.ktp_ocr_text = result.ktp_ocr_text || ''
  form.value.ktp_ocr_error = result.ktp_ocr_error || ''
}

const resetKtpFields = () => {
  form.value.ktp_nik = ''
  form.value.ktp_birth_place = ''
  form.value.ktp_birth_date = ''
  form.value.ktp_gender = ''
  form.value.ktp_address = ''
  form.value.ktp_ocr_status = ''
  form.value.ktp_ocr_text = ''
  form.value.ktp_ocr_error = ''
}

const handleFileChange = async (event) => {
  const [file] = event.target.files || []
  clearPreview()
  resetKtpFields()
  ocrMessage.value = ''

  if (!file) {
    selectedFile.value = null
    return
  }

  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    showAlert('Validasi', 'Foto KTP harus JPG, JPEG, PNG, atau WEBP.', 'warning')
    selectedFile.value = null
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showAlert('Validasi', 'Ukuran foto KTP maksimal 5 MB.', 'warning')
    selectedFile.value = null
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  isOcrLoading.value = true
  ocrMessage.value = 'Membaca data KTP...'
  try {
    const fileData = await fileToOptimizedOcrDataUrl(file)
    const result = await post(
      '/withdrawals/ocr-ktp',
      {
        ktp_file_name: file.name,
        ktp_file_data: fileData,
      },
      { timeout: 120000 },
    )

    applyOcrResult(result)
    ocrMessage.value =
      result.ktp_ocr_status === 'completed'
        ? 'Data KTP berhasil dibaca. Periksa lagi sebelum submit.'
        : 'OCR belum berhasil membaca KTP. Isi atau koreksi data manual.'
  } catch (error) {
    console.error('Failed to OCR KTP:', error)
    ocrMessage.value = 'OCR gagal. Isi data KTP secara manual.'
  } finally {
    isOcrLoading.value = false
  }
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file KTP.'))
    reader.readAsDataURL(file)
  })

const fileToOptimizedOcrDataUrl = (file) =>
  new Promise((resolve) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      const maxWidth = 1400
      const scale = Math.min(1, maxWidth / image.width)
      const width = Math.round(image.width * scale)
      const height = Math.round(image.height * scale)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = width
      canvas.height = height
      context.drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }

    image.onerror = async () => {
      URL.revokeObjectURL(objectUrl)
      resolve(await fileToDataUrl(file))
    }

    image.src = objectUrl
  })

const fetchWithdrawals = async () => {
  isLoading.value = true
  try {
    const keyword = searchQuery.value.trim()
    const response = await get('/withdrawals', {
      params: keyword ? { search: keyword } : {},
    })
    withdrawals.value = response.withdrawals || []
    currentPage.value = 1
  } catch (error) {
    console.error('Failed to fetch withdrawals:', error)
    showAlert('Error', 'Gagal memuat data tarik uang.', 'error')
  } finally {
    isLoading.value = false
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(withdrawals.value.length / itemsPerPage)))
const paginatedWithdrawals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return withdrawals.value.slice(start, start + itemsPerPage)
})
const paginationSummary = computed(() => {
  if (withdrawals.value.length === 0) return '0 data'

  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, withdrawals.value.length)
  return `${start}-${end} dari ${withdrawals.value.length} data`
})
const visiblePageNumbers = computed(() => {
  const pages = []
  const maxVisible = 3
  let start = Math.max(1, currentPage.value - 1)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const openKtpPreview = (withdrawal) => {
  selectedKtpPreview.value = withdrawal
}

const closeKtpPreview = () => {
  selectedKtpPreview.value = null
}

const openFormModal = () => {
  isFormModalOpen.value = true
}

const closeFormModal = () => {
  if (isSubmitting.value || isOcrLoading.value) return
  isFormModalOpen.value = false
}

const handleSubmit = async () => {
  if (!form.value.withdrawal_name.trim()) {
    showAlert('Validasi', 'Nama penarik harus diisi.', 'warning')
    return
  }

  if (!form.value.amount || Number(form.value.amount) <= 0) {
    showAlert('Validasi', 'Jumlah penarikan harus lebih dari 0.', 'warning')
    return
  }

  if (!selectedFile.value) {
    showAlert('Validasi', 'Foto KTP harus diambil atau diunggah.', 'warning')
    return
  }

  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(selectedFile.value.type)) {
    showAlert('Validasi', 'Foto KTP harus JPG, JPEG, PNG, atau WEBP.', 'warning')
    return
  }

  if (selectedFile.value.size > 5 * 1024 * 1024) {
    showAlert('Validasi', 'Ukuran foto KTP maksimal 5 MB.', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    const fileData = await fileToDataUrl(selectedFile.value)
    await post('/withdrawals', {
      withdrawal_name: form.value.withdrawal_name.trim(),
      amount: Number(form.value.amount),
      ktp_file_name: selectedFile.value.name,
      ktp_file_data: fileData,
      ktp_nik: form.value.ktp_nik.trim(),
      ktp_name: form.value.withdrawal_name.trim(),
      ktp_birth_place: form.value.ktp_birth_place.trim(),
      ktp_birth_date: form.value.ktp_birth_date,
      ktp_gender: form.value.ktp_gender,
      ktp_address: form.value.ktp_address.trim(),
      ktp_ocr_status: form.value.ktp_ocr_status,
      ktp_ocr_text: form.value.ktp_ocr_text,
      ktp_ocr_error: form.value.ktp_ocr_error,
    })

    await showAlert('Berhasil', 'Data tarik uang berhasil disimpan.', 'success')
    resetForm()
    isFormModalOpen.value = false
    await fetchWithdrawals()
  } catch (error) {
    console.error('Failed to create withdrawal:', error)
  } finally {
    isSubmitting.value = false
  }
}

const deleteWithdrawal = async (withdrawal) => {
  const result = await showConfirm(
    'Hapus Data',
    `Hapus data tarik uang atas nama ${withdrawal.withdrawal_name}?`,
    'warning',
    'Ya, Hapus',
  )

  if (!result.isConfirmed) return

  try {
    await del(`/withdrawals/${withdrawal.withdrawal_id}`)
    await showAlert('Berhasil', 'Data tarik uang berhasil dihapus.', 'success')
    await fetchWithdrawals()
  } catch (error) {
    console.error('Failed to delete withdrawal:', error)
  }
}

let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchWithdrawals, 350)
})

onMounted(fetchWithdrawals)
onBeforeUnmount(() => {
  clearTimeout(searchTimeout)
  clearPreview()
})
</script>

<template>
  <div class="withdrawal-page min-h-screen bg-slate-50 px-4 py-4 mt-10">
    <div class="mx-auto space-y-3">
      <section class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Tarik Uang
            </p>
            <h1 class="mt-1 text-base font-bold text-slate-900">Riwayat Tarik Uang</h1>
          </div>
          <button type="button"
            class="rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm active:scale-[0.99]"
            @click="openFormModal">
            Tarik Uang
          </button>
        </div>
      </section>

      <div v-if="isFormModalOpen" class="fixed inset-0 z-[90] bg-black/60 px-4 py-6" @click="closeFormModal">
        <section class="relative mx-auto flex max-h-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" @click.stop>
          <div v-if="isOcrLoading || isSubmitting"
            class="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-sm">
            <div class="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
              <div class="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
              <div class="mt-4 text-base font-bold text-slate-950">
                {{ isSubmitting ? 'Menyimpan data...' : 'Membaca KTP...' }}
              </div>
              <p class="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                {{ isSubmitting ? 'Mohon tunggu sampai proses submit selesai.' : 'OCR sedang membaca foto KTP dan mengisi data otomatis.' }}
              </p>
            </div>
          </div>

          <div class="sticky top-0 z-[1] flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Form Tarik Uang</h2>
              <p class="text-xs text-slate-500">Ambil foto KTP lalu lengkapi nominal.</p>
            </div>
            <button type="button"
              class="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-rose-600 px-3 text-white shadow-lg disabled:opacity-50"
              :disabled="isSubmitting || isOcrLoading"
              @click="closeFormModal">
              <span class="text-2xl leading-none">&times;</span>
            </button>
          </div>

          <form class="withdrawal-form flex-1 space-y-2.5 overflow-auto p-4" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-700">KTP</label>
            <input ref="fileInputRef" type="file" accept="image/*" capture="environment" class="hidden"
              @change="handleFileChange" />
            <button type="button"
              class="flex w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm active:scale-[0.99]"
              @click="fileInputRef?.click()">
              {{ selectedFile ? 'Ganti Foto KTP' : 'Ambil Foto KTP' }}
            </button>
            <p class="mt-2 text-xs text-slate-500">Gunakan kamera ponsel. Maksimal 5 MB.</p>
          </div>

          <div v-if="previewUrl" class="overflow-hidden rounded-xl border border-slate-200">
            <img :src="previewUrl" alt="Preview KTP" class="h-48 w-full object-cover" />
          </div>

          <div v-if="ocrMessage"
            class="rounded-xl border px-3 py-2 text-xs"
            :class="isOcrLoading ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">
            {{ ocrMessage }}
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div class="mb-3">
              <h2 class="text-xs font-semibold text-slate-900">Data OCR KTP</h2>
              <p class="text-xs text-slate-500">Otomatis terisi dari KTP, bisa dikoreksi manual.</p>
            </div>

            <FormField v-model="form.ktp_nik" label="NIK" placeholder="Otomatis dari KTP" />

            <FormField v-model="form.withdrawal_name" label="Nama" placeholder="Otomatis dari KTP" required />

            <FormField v-model="form.ktp_birth_place" label="Tempat Lahir" placeholder="Otomatis dari KTP" />

            <FormField v-model="form.ktp_birth_date" label="Tanggal Lahir" placeholder="Tanggal lahir" type="date" />

            <div class="mb-4">
              <label class="mb-1.5 block text-xs font-bold text-gray-700">Jenis Kelamin</label>
              <select v-model="form.ktp_gender"
                class="w-full rounded border px-3 py-2 text-xs text-gray-700 shadow focus:outline-none focus:shadow-outline">
                <option value="">Pilih jenis kelamin</option>
                <option value="LAKI-LAKI">LAKI-LAKI</option>
                <option value="PEREMPUAN">PEREMPUAN</option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-gray-700">Alamat</label>
              <textarea v-model="form.ktp_address" rows="3" placeholder="Otomatis dari KTP"
                class="w-full rounded border px-3 py-2 text-xs text-gray-700 shadow focus:outline-none focus:shadow-outline"></textarea>
            </div>
          </div>

          <FormField v-model="form.amount" label="Nominal" placeholder="Masukkan nominal" type="text"
            :is-currency="true" required />

          <div class="grid grid-cols-3 gap-2">
            <button type="button"
              class="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              :disabled="isSubmitting || isOcrLoading"
              @click="closeFormModal">
              Tutup
            </button>
            <button type="submit" :disabled="isSubmitting || isOcrLoading"
              class="col-span-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {{ isSubmitting ? 'Menyimpan...' : isOcrLoading ? 'Membaca KTP...' : 'Submit Tarik Uang' }}
            </button>
            <button type="button"
              class="col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700"
              @click="resetForm">
              Reset
            </button>
          </div>
          </form>
        </section>
      </div>

      <section class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Riwayat</h2>
            <p class="text-xs text-slate-500">
              {{ isAdmin ? 'Semua data tampil di sini.' : 'Data yang Anda buat.' }}
            </p>
          </div>
          <button type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            @click="fetchWithdrawals">
            Refresh
          </button>
        </div>

        <div class="mb-3">
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Cari Data</label>
          <div class="flex gap-2">
            <input v-model="searchQuery" type="search" inputmode="search"
              placeholder="Cari nama, NIK, atau nominal"
              class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <button v-if="searchQuery" type="button"
              class="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
              @click="searchQuery = ''">
              Reset
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="py-10 text-center text-sm text-slate-500">
          Memuat data...
        </div>

        <div v-else-if="withdrawals.length === 0 && searchQuery" class="py-10 text-center text-sm text-slate-500">
          Tidak ada data yang cocok dengan pencarian.
        </div>

        <div v-else-if="withdrawals.length === 0" class="py-10 text-center text-sm text-slate-500">
          Belum ada data tarik uang.
        </div>

        <div v-else class="space-y-2.5">
          <article v-for="withdrawal in paginatedWithdrawals" :key="withdrawal.withdrawal_id"
            class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-[11px] text-slate-500">
                  {{ format(new Date(withdrawal.created_at), 'dd MMM yyyy, HH:mm', { locale: id }) }}
                </div>
                <div class="mt-1 text-xs font-semibold text-slate-900">
                  {{ withdrawal.withdrawal_name }}
                </div>
                <div class="mt-1 text-xs font-semibold text-emerald-700">
                  {{ formatCurrency(withdrawal.amount) }}
                </div>
              </div>

              <div class="flex flex-col items-end gap-2">
                <button type="button"
                  class="rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-300"
                  @click="openKtpPreview(withdrawal)">
                  Lihat KTP
                </button>

                <button v-if="isAdmin" type="button"
                  class="rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white"
                  @click="deleteWithdrawal(withdrawal)">
                  Hapus
                </button>
              </div>
            </div>
          </article>

          <div class="space-y-3 pt-2">
            <div class="text-center text-[11px] font-medium text-slate-500">
              {{ paginationSummary }}
            </div>

            <div class="flex items-center justify-between gap-2">
              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === 1" @click="goToPage(1)">
                Awal
              </button>

              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
                ‹
              </button>

              <div class="flex flex-1 justify-center gap-2">
                <button v-for="page in visiblePageNumbers" :key="page" type="button"
                  class="h-9 min-w-9 rounded-lg px-2.5 text-xs font-semibold"
                  :class="page === currentPage ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'"
                  @click="goToPage(page)">
                  {{ page }}
                </button>
              </div>

              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
                ›
              </button>

              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === totalPages" @click="goToPage(totalPages)">
                Akhir
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="selectedKtpPreview" class="fixed inset-0 z-[100] bg-black/70 px-4 py-6" @click="closeKtpPreview">
      <div class="mx-auto flex h-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl" @click.stop>
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Preview KTP</h3>
            <p class="text-xs text-slate-500">{{ selectedKtpPreview.withdrawal_name }}</p>
          </div>
          <button type="button"
            class="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-rose-600 px-3 text-white shadow-lg"
            @click="closeKtpPreview">
            <span class="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <div class="flex-1 overflow-auto bg-slate-100 p-3">
          <img :src="selectedKtpPreview.ktp_file_url" alt="Foto KTP"
            class="mx-auto max-h-full w-full rounded-xl object-contain" />

          <div class="mt-3 rounded-xl bg-white p-3">
            <h4 class="mb-2 text-sm font-semibold text-slate-900">Data KTP terbaca</h4>
            <div class="space-y-2">
              <div v-for="field in ktpFields" :key="field.label" class="grid grid-cols-[110px_1fr] gap-3 text-sm">
                <div class="text-slate-500">{{ field.label }}</div>
                <div class="font-medium text-slate-900">{{ field.value }}</div>
              </div>
            </div>

            <details v-if="selectedKtpPreview.ktp_ocr_text" class="mt-3">
              <summary class="cursor-pointer text-sm font-semibold text-blue-700">Raw OCR</summary>
              <pre class="mt-2 whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-xs text-slate-700">{{ selectedKtpPreview.ktp_ocr_text }}</pre>
            </details>

            <p v-if="selectedKtpPreview.ktp_ocr_error" class="mt-3 text-sm text-rose-600">
              {{ selectedKtpPreview.ktp_ocr_error }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-xs font-semibold text-slate-700"
            @click="closeKtpPreview">
            Tutup
          </button>
          <a :href="selectedKtpPreview.ktp_file_url" target="_blank" rel="noreferrer"
            class="block rounded-xl bg-blue-600 px-4 py-3 text-center text-xs font-semibold text-white">
            Buka Gambar
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.withdrawal-page {
  font-size: 12px;
  line-height: 1.35;
}

.withdrawal-page :deep(button),
.withdrawal-page :deep(input),
.withdrawal-page :deep(select),
.withdrawal-page :deep(textarea) {
  font-size: 12px;
}

.withdrawal-form :deep(label) {
  margin-bottom: 0.375rem;
  font-size: 0.6875rem;
  line-height: 0.9rem;
}

.withdrawal-form :deep(input),
.withdrawal-form :deep(select),
.withdrawal-form :deep(textarea) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 0.6875rem;
  line-height: 0.9rem;
}

.withdrawal-form :deep(.mb-4) {
  margin-bottom: 0.625rem;
}

.withdrawal-form :deep(p) {
  font-size: 0.6875rem;
}
</style>
