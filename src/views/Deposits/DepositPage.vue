<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useApi } from '@/composables/useApi'
import { useAuth } from '@/composables/useAuth'
import { useSweetAlert } from '@/composables/useSweetAlert'
import FormField from '@/components/FormField.vue'

const { get, post, put, del } = useApi()
const { isAdmin } = useAuth()
const { showAlert, showConfirm, showToast } = useSweetAlert()

const deposits = ref([])
const recipients = ref([])
const stores = ref([])
const users = ref([])
const summary = ref({
  today: 0,
  week: 0,
  month: 0,
  year: 0,
})
const isLoading = ref(false)
const isSubmitting = ref(false)
const isRecipientSaving = ref(false)
const isFormModalOpen = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalItems = ref(0)
const totalPages = ref(1)
const itemsPerPage = ref(10)
const filters = ref({
  period: '',
  start_date: '',
  end_date: '',
  recipient_id: '',
  store_id: '',
  created_by: '',
})
const form = ref({
  amount: 0,
  store_id: '',
  recipient_id: '',
})
const recipientForm = ref({
  name: '',
  is_active: true,
})
const editingRecipientId = ref('')

const activeRecipients = computed(() =>
  recipients.value.filter((recipient) => Number(recipient.is_active) === 1),
)

const summaryCards = computed(() => [
  { label: 'Hari Ini', value: summary.value.today },
  { label: 'Minggu Ini', value: summary.value.week },
  { label: 'Bulan Ini', value: summary.value.month },
  { label: 'Tahun Ini', value: summary.value.year },
])

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatDateTime = (value) => {
  if (!value) return '-'
  return format(new Date(value), 'dd MMM yyyy, HH:mm', { locale: id })
}

const fetchRecipients = async () => {
  const response = await get('/deposits/recipients')
  recipients.value = response.recipients || []
}

const fetchStores = async () => {
  try {
    const response = await get('/stores')
    stores.value = response.stores || []
  } catch (error) {
    console.error('Fetch stores error:', error)
  }
}

const fetchUsers = async () => {
  if (!isAdmin.value) return

  try {
    const response = await get('/users')
    users.value = response.users || []
  } catch (error) {
    console.error('Fetch users error:', error)
  }
}

const buildParams = () => {
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value,
  }
  const keyword = searchQuery.value.trim()

  if (keyword) params.search = keyword
  if (filters.value.period) params.period = filters.value.period
  if (filters.value.start_date) params.start_date = filters.value.start_date
  if (filters.value.end_date) params.end_date = filters.value.end_date
  if (filters.value.recipient_id) params.recipient_id = filters.value.recipient_id
  if (filters.value.store_id) params.store_id = filters.value.store_id
  if (isAdmin.value && filters.value.created_by) params.created_by = filters.value.created_by

  return params
}

const fetchSummary = async () => {
  try {
    const params = {}
    if (filters.value.recipient_id) params.recipient_id = filters.value.recipient_id
    if (filters.value.store_id) params.store_id = filters.value.store_id
    if (isAdmin.value && filters.value.created_by) params.created_by = filters.value.created_by

    const response = await get('/deposits/summary', { params })
    summary.value = response.summary || summary.value
  } catch (error) {
    console.error('Fetch deposit summary error:', error)
  }
}

const fetchDeposits = async () => {
  isLoading.value = true
  try {
    const response = await get('/deposits', {
      params: buildParams(),
    })
    deposits.value = response.deposits || []
    totalItems.value = Number(response.pagination?.total || 0)
    totalPages.value = Math.max(1, Number(response.pagination?.total_pages || 1))
  } catch (error) {
    console.error('Fetch deposits error:', error)
    showAlert('Error', 'Gagal memuat data setoran.', 'error')
  } finally {
    isLoading.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([fetchRecipients(), fetchStores(), fetchUsers(), fetchSummary(), fetchDeposits()])
}

const resetForm = () => {
  form.value = {
    amount: 0,
    store_id: stores.value[0]?.store_id || '',
    recipient_id: activeRecipients.value[0]?.recipient_id || '',
  }
}

const openFormModal = () => {
  if (!form.value.store_id) {
    form.value.store_id = stores.value[0]?.store_id || ''
  }
  if (!form.value.recipient_id) {
    form.value.recipient_id = activeRecipients.value[0]?.recipient_id || ''
  }
  isFormModalOpen.value = true
}

const closeFormModal = () => {
  if (isSubmitting.value) return
  isFormModalOpen.value = false
}

const handleSubmit = async () => {
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    showToast('Total setoran harus lebih dari 0.', 'warning')
    return
  }

  if (!form.value.store_id) {
    showToast('Toko harus dipilih.', 'warning')
    return
  }

  if (!form.value.recipient_id) {
    showToast('Penerima harus dipilih.', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    await post('/deposits', {
      amount: Number(form.value.amount),
      store_id: form.value.store_id,
      recipient_id: form.value.recipient_id,
    })
    showToast('Setoran berhasil disimpan.', 'success')
    resetForm()
    isFormModalOpen.value = false
    currentPage.value = 1
    await Promise.all([fetchDeposits(), fetchSummary()])
  } catch (error) {
    console.error('Create deposit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

const resetRecipientForm = () => {
  editingRecipientId.value = ''
  recipientForm.value = {
    name: '',
    is_active: true,
  }
}

const startEditRecipient = (recipient) => {
  editingRecipientId.value = recipient.recipient_id
  recipientForm.value = {
    name: recipient.name,
    is_active: Number(recipient.is_active) === 1,
  }
}

const saveRecipient = async () => {
  if (!recipientForm.value.name.trim()) {
    showToast('Nama penerima wajib diisi.', 'warning')
    return
  }

  isRecipientSaving.value = true
  try {
    const payload = {
      name: recipientForm.value.name.trim(),
      is_active: recipientForm.value.is_active,
    }

    if (editingRecipientId.value) {
      await put(`/deposits/recipients/${editingRecipientId.value}`, payload)
      showToast('Penerima berhasil diperbarui.', 'success')
    } else {
      await post('/deposits/recipients', payload)
      showToast('Penerima berhasil disimpan.', 'success')
    }

    resetRecipientForm()
    await fetchRecipients()
    resetForm()
  } catch (error) {
    console.error('Save deposit recipient error:', error)
  } finally {
    isRecipientSaving.value = false
  }
}

const toggleRecipientStatus = async (recipient) => {
  try {
    await put(`/deposits/recipients/${recipient.recipient_id}`, {
      is_active: Number(recipient.is_active) !== 1,
    })
    await fetchRecipients()
    resetForm()
  } catch (error) {
    console.error('Toggle deposit recipient status error:', error)
  }
}

const deleteRecipient = async (recipient) => {
  const result = await showConfirm(
    'Hapus Penerima',
    `Hapus penerima ${recipient.name}?`,
    'warning',
    'Ya, Hapus',
  )

  if (!result.isConfirmed) return

  try {
    await del(`/deposits/recipients/${recipient.recipient_id}`)
    showToast('Penerima berhasil dihapus.', 'success')
    await fetchRecipients()
    resetForm()
  } catch (error) {
    console.error('Delete deposit recipient error:', error)
  }
}

const deleteDeposit = async (deposit) => {
  const result = await showConfirm(
    'Hapus Setoran',
    `Hapus setoran ${formatCurrency(deposit.amount)} ke ${deposit.recipient_name}?`,
    'warning',
    'Ya, Hapus',
  )

  if (!result.isConfirmed) return

  try {
    await del(`/deposits/${deposit.deposit_id}`)
    showToast('Setoran berhasil dihapus.', 'success')
    await Promise.all([fetchDeposits(), fetchSummary()])
  } catch (error) {
    console.error('Delete deposit error:', error)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchDeposits()
  fetchSummary()
}

const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    period: '',
    start_date: '',
    end_date: '',
    recipient_id: '',
    store_id: '',
    created_by: '',
  }
  currentPage.value = 1
  fetchDeposits()
  fetchSummary()
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  fetchDeposits()
}

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

const paginationSummary = computed(() => {
  if (totalItems.value === 0) return '0 data'

  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
  return `${start}-${end} dari ${totalItems.value} data`
})

let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  currentPage.value = 1
  searchTimeout = setTimeout(fetchDeposits, 350)
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  fetchDeposits()
})

watch(
  activeRecipients,
  () => {
    if (!form.value.recipient_id) {
      form.value.recipient_id = activeRecipients.value[0]?.recipient_id || ''
    }
  },
  { immediate: true },
)

watch(
  stores,
  () => {
    if (!form.value.store_id) {
      form.value.store_id = stores.value[0]?.store_id || ''
    }
  },
  { immediate: true },
)

onMounted(refreshAll)
onBeforeUnmount(() => {
  clearTimeout(searchTimeout)
})
</script>

<template>
  <div class="deposit-page min-h-screen bg-slate-50 px-4 py-4 mt-10">
    <div class="mx-auto space-y-3">
      <section class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Setoran
            </p>
            <h1 class="mt-1 text-base font-bold text-slate-900">Input dan Riwayat Setoran</h1>
          </div>
          <button
            type="button"
            class="rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm disabled:bg-slate-300"
            :disabled="activeRecipients.length === 0 || stores.length === 0"
            @click="openFormModal"
          >
            Input Setoran
          </button>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
        >
          <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ card.label }}
          </p>
          <p class="mt-1 text-sm font-bold text-slate-900">
            {{ formatCurrency(card.value) }}
          </p>
        </article>
      </section>

      <section v-if="isAdmin" class="grid gap-3 lg:grid-cols-[360px_1fr]">
        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-sm font-bold text-slate-900">Penerima Setoran</h2>
          <form class="mt-3 space-y-3" @submit.prevent="saveRecipient">
            <label class="block">
              <span class="text-xs font-semibold text-slate-700">Nama Penerima</span>
              <input
                v-model="recipientForm.name"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs outline-none focus:border-blue-500"
                placeholder="Contoh: Owner / Bendahara"
              />
            </label>

            <label class="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input v-model="recipientForm.is_active" type="checkbox" class="h-4 w-4 rounded" />
              Aktif
            </label>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="submit"
                class="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white disabled:bg-slate-300"
                :disabled="isRecipientSaving"
              >
                {{ isRecipientSaving ? 'Menyimpan...' : editingRecipientId ? 'Update' : 'Simpan' }}
              </button>
              <button
                type="button"
                class="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
                @click="resetRecipientForm"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900">Daftar Penerima</h2>
            <button type="button" class="text-xs font-bold text-blue-600" @click="fetchRecipients">
              Refresh
            </button>
          </div>

          <div v-if="recipients.length === 0" class="py-8 text-center text-sm text-slate-500">
            Belum ada penerima setoran.
          </div>

          <div v-else class="mt-3 grid gap-2 md:grid-cols-2">
            <article
              v-for="recipient in recipients"
              :key="recipient.recipient_id"
              class="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-slate-900">{{ recipient.name }}</p>
                  <span
                    class="mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold"
                    :class="
                      Number(recipient.is_active) === 1
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    "
                  >
                    {{ Number(recipient.is_active) === 1 ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700"
                  @click="startEditRecipient(recipient)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700"
                  @click="toggleRecipientStatus(recipient)"
                >
                  {{ Number(recipient.is_active) === 1 ? 'Off' : 'On' }}
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-rose-200 bg-white px-2 py-2 text-[11px] font-semibold text-rose-600"
                  @click="deleteRecipient(recipient)"
                >
                  Hapus
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <Teleport to="body">
        <div
          v-if="isFormModalOpen"
          class="fixed inset-0 z-[1000] overflow-y-auto bg-black/60 px-4 pb-6 pt-24 md:py-6 mt-20"
          @click="closeFormModal"
        >
          <section
            class="relative mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            @click.stop
          >
            <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">Form Setoran</h2>
                <p class="text-xs text-slate-500">Isi toko, total setoran, dan penerima.</p>
              </div>
              <button
                type="button"
                class="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-red-600 px-3.5 text-white shadow-lg"
                :disabled="isSubmitting"
                @click="closeFormModal"
              >
                <span class="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <form class="space-y-3 p-4" @submit.prevent="handleSubmit">
              <FormField
                v-model="form.amount"
                label="Total Setoran"
                placeholder="Masukkan total setoran"
                type="text"
                :is-currency="true"
                required
              />

              <label class="block">
                <span class="text-xs font-semibold text-slate-700">Toko</span>
                <select
                  v-model="form.store_id"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
                  required
                >
                  <option value="" disabled>Pilih toko</option>
                  <option v-for="store in stores" :key="store.store_id" :value="store.store_id">
                    {{ store.store_name }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-xs font-semibold text-slate-700">Penerima</span>
                <select
                  v-model="form.recipient_id"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
                  required
                >
                  <option value="" disabled>Pilih penerima</option>
                  <option
                    v-for="recipient in activeRecipients"
                    :key="recipient.recipient_id"
                    :value="recipient.recipient_id"
                  >
                    {{ recipient.name }}
                  </option>
                </select>
              </label>

              <div class="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  class="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
                  :disabled="isSubmitting"
                  @click="closeFormModal"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  class="col-span-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:bg-slate-300"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Menyimpan...' : 'Submit Setoran' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      </Teleport>

      <section class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Riwayat Setoran</h2>
            <p class="text-xs text-slate-500">
              {{ isAdmin ? 'Semua setoran tampil di sini.' : 'Data setoran yang Anda buat.' }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            @click="refreshAll"
          >
            Refresh
          </button>
        </div>

        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-6">
          <label class="lg:col-span-2">
            <span class="text-xs font-semibold text-slate-700">Cari</span>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari toko, penerima, nominal, user, tanggal"
              class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs outline-none focus:border-blue-500"
            />
          </label>

          <label>
            <span class="text-xs font-semibold text-slate-700">Periode</span>
            <select
              v-model="filters.period"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
              @change="applyFilters"
            >
              <option value="">Semua</option>
              <option value="today">Hari ini</option>
              <option value="week">Minggu ini</option>
              <option value="month">Bulan ini</option>
              <option value="year">Tahun ini</option>
            </select>
          </label>

          <label>
            <span class="text-xs font-semibold text-slate-700">Dari</span>
            <input
              v-model="filters.start_date"
              type="date"
              class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs outline-none focus:border-blue-500"
              @change="applyFilters"
            />
          </label>

          <label>
            <span class="text-xs font-semibold text-slate-700">Sampai</span>
            <input
              v-model="filters.end_date"
              type="date"
              class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs outline-none focus:border-blue-500"
              @change="applyFilters"
            />
          </label>

          <label>
            <span class="text-xs font-semibold text-slate-700">Limit</span>
            <select
              v-model.number="itemsPerPage"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </label>

          <label>
            <span class="text-xs font-semibold text-slate-700">Penerima</span>
            <select
              v-model="filters.recipient_id"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
              @change="applyFilters"
            >
              <option value="">Semua</option>
              <option
                v-for="recipient in recipients"
                :key="recipient.recipient_id"
                :value="recipient.recipient_id"
              >
                {{ recipient.name }}
              </option>
            </select>
          </label>

          <label>
            <span class="text-xs font-semibold text-slate-700">Toko</span>
            <select
              v-model="filters.store_id"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
              @change="applyFilters"
            >
              <option value="">Semua</option>
              <option v-for="store in stores" :key="store.store_id" :value="store.store_id">
                {{ store.store_name }}
              </option>
            </select>
          </label>

          <label v-if="isAdmin">
            <span class="text-xs font-semibold text-slate-700">Karyawan</span>
            <select
              v-model="filters.created_by"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
              @change="applyFilters"
            >
              <option value="">Semua</option>
              <option v-for="user in users" :key="user.user_id" :value="user.user_id">
                {{ user.username }}
              </option>
            </select>
          </label>

          <div class="flex items-end gap-2">
            <button
              type="button"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
              @click="resetFilters"
            >
              Reset
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="py-10 text-center text-sm text-slate-500">
          Memuat data...
        </div>

        <div v-else-if="deposits.length === 0" class="py-10 text-center text-sm text-slate-500">
          Belum ada data setoran.
        </div>

        <div v-else class="mt-3 space-y-2.5">
          <article
            v-for="deposit in deposits"
            :key="deposit.deposit_id"
            class="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-[11px] text-slate-500">
                  {{ formatDateTime(deposit.created_at) }}
                </div>
                <div class="mt-1 text-xs font-semibold text-slate-900">
                  Penerima: {{ deposit.recipient_name }}
                </div>
                <div class="mt-1 text-[11px] text-slate-500">
                  Toko: {{ deposit.store_name || '-' }}
                </div>
                <div v-if="isAdmin" class="mt-1 text-[11px] text-slate-500">
                  Dibuat oleh: {{ deposit.created_by_username || '-' }}
                </div>
                <div class="mt-1 text-sm font-bold text-emerald-700">
                  {{ formatCurrency(deposit.amount) }}
                </div>
              </div>

              <button
                v-if="isAdmin"
                type="button"
                class="rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white"
                @click="deleteDeposit(deposit)"
              >
                Hapus
              </button>
            </div>
          </article>

          <div class="space-y-3 pt-2">
            <div class="text-center text-[11px] font-medium text-slate-500">
              {{ paginationSummary }}
            </div>

            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >
                Awal
              </button>

              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                ‹
              </button>

              <div class="flex flex-1 justify-center gap-2">
                <button
                  v-for="page in visiblePageNumbers"
                  :key="page"
                  type="button"
                  class="h-9 min-w-9 rounded-lg px-2.5 text-xs font-semibold"
                  :class="
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-700'
                  "
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>

              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                ›
              </button>

              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >
                Akhir
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.deposit-page {
  font-size: 12px;
  line-height: 1.35;
}

.deposit-page :deep(button),
.deposit-page :deep(input),
.deposit-page :deep(select),
.deposit-page :deep(textarea) {
  font-size: 12px;
}
</style>
