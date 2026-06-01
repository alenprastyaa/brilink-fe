<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
    const fileData = await fileToDataUrl(file)
    const result = await post(
      '/withdrawals/ocr-ktp',
      {
        ktp_file_name: file.name,
        ktp_file_data: fileData,
      },
      { timeout: 60000 },
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

const fetchWithdrawals = async () => {
  isLoading.value = true
  try {
    const response = await get('/withdrawals')
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

onMounted(fetchWithdrawals)
onBeforeUnmount(clearPreview)
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-4 mt-10">
    <div class="mx-auto space-y-4">
      <section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div class="mb-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Tarik Uang
          </p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900">Form Tarik Uang</h1>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <form class="space-y-3" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">KTP</label>
            <input ref="fileInputRef" type="file" accept="image/*" capture="environment" class="hidden"
              @change="handleFileChange" />
            <button type="button"
              class="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
              @click="fileInputRef?.click()">
              {{ selectedFile ? 'Ganti Foto KTP' : 'Ambil Foto KTP' }}
            </button>
            <p class="mt-2 text-xs text-slate-500">Gunakan kamera ponsel. Maksimal 5 MB.</p>
          </div>

          <div v-if="previewUrl" class="overflow-hidden rounded-xl border border-slate-200">
            <img :src="previewUrl" alt="Preview KTP" class="h-48 w-full object-cover" />
          </div>

          <div v-if="ocrMessage"
            class="rounded-xl border px-3 py-2 text-sm"
            :class="isOcrLoading ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">
            {{ ocrMessage }}
          </div>

          <FormField v-model="form.withdrawal_name" label="Nama" placeholder="Masukkan nama penarik" required />

          <FormField v-model="form.amount" label="Nominal" placeholder="Masukkan nominal" type="text"
            :is-currency="true" required />

          <div class="flex gap-3">
            <button type="submit" :disabled="isSubmitting || isOcrLoading"
              class="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {{ isSubmitting ? 'Menyimpan...' : isOcrLoading ? 'Membaca KTP...' : 'Submit Tarik Uang' }}
            </button>
            <button type="button"
              class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              @click="resetForm">
              Reset
            </button>
          </div>
        </form>
      </section>

      <section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Riwayat</h2>
            <p class="text-sm text-slate-500">
              {{ isAdmin ? 'Semua data tampil di sini.' : 'Data yang Anda buat.' }}
            </p>
          </div>
          <button type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            @click="fetchWithdrawals">
            Refresh
          </button>
        </div>

        <div v-if="isLoading" class="py-10 text-center text-sm text-slate-500">
          Memuat data...
        </div>

        <div v-else-if="withdrawals.length === 0" class="py-10 text-center text-sm text-slate-500">
          Belum ada data tarik uang.
        </div>

        <div v-else class="space-y-3">
          <article v-for="withdrawal in paginatedWithdrawals" :key="withdrawal.withdrawal_id"
            class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs text-slate-500">
                  {{ format(new Date(withdrawal.created_at), 'dd MMM yyyy, HH:mm', { locale: id }) }}
                </div>
                <div class="mt-1 text-sm font-semibold text-slate-900">
                  {{ withdrawal.withdrawal_name }}
                </div>
                <div class="mt-1 text-sm font-semibold text-emerald-700">
                  {{ formatCurrency(withdrawal.amount) }}
                </div>
              </div>

              <div class="flex flex-col items-end gap-2">
                <button type="button"
                  class="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-300"
                  @click="openKtpPreview(withdrawal)">
                  Lihat KTP
                </button>

                <button v-if="isAdmin" type="button"
                  class="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                  @click="deleteWithdrawal(withdrawal)">
                  Hapus
                </button>
              </div>
            </div>
          </article>

          <div class="space-y-3 pt-2">
            <div class="text-center text-xs font-medium text-slate-500">
              {{ paginationSummary }}
            </div>

            <div class="flex items-center justify-between gap-2">
              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === 1" @click="goToPage(1)">
                Awal
              </button>

              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
                ‹
              </button>

              <div class="flex flex-1 justify-center gap-2">
                <button v-for="page in visiblePageNumbers" :key="page" type="button"
                  class="h-10 min-w-10 rounded-lg px-3 text-sm font-semibold"
                  :class="page === currentPage ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'"
                  @click="goToPage(page)">
                  {{ page }}
                </button>
              </div>

              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
                ›
              </button>

              <button type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
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
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 class="text-base font-semibold text-slate-900">Preview KTP</h3>
            <p class="text-sm text-slate-500">{{ selectedKtpPreview.withdrawal_name }}</p>
          </div>
          <button type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
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

        <div class="border-t border-slate-200 px-4 py-3">
          <a :href="selectedKtpPreview.ktp_file_url" target="_blank" rel="noreferrer"
            class="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">
            Buka Gambar
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
