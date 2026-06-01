<script setup>
import { ref, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { useSweetAlert } from '@/composables/useSweetAlert'

const { get, post, put, del } = useApi()
const { showAlert, showConfirm } = useSweetAlert()

const banks = ref([])
const stores = ref([])
const selectedStoreId = ref(null)

const newBank = ref({
  bank_name: '',
  store_id: null,
})
const editingBank = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)

// --- Fetch Banks ---
const fetchBanks = async () => {
  isLoading.value = true
  try {
    let response
    if (selectedStoreId.value) {
      response = await get(`/banks/store/${selectedStoreId.value}`)
    } else {
      response = await get('/banks')
    }
    banks.value = response.banks || []
  } catch (error) {
    console.error('Failed to fetch banks:', error)
    if (error.response && error.response.status === 404 && selectedStoreId.value) {
      banks.value = []
    } else {
      showAlert('Error!', 'Gagal memuat data bank/pembayaran.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

// --- Fetch Stores ---
const fetchStores = async () => {
  try {
    const response = await get('/stores')
    stores.value = response.stores || []
    if (stores.value.length > 0 && selectedStoreId.value === null) {
      selectedStoreId.value = stores.value[0].store_id
    }
    if (newBank.value.store_id === null && stores.value.length > 0) {
      newBank.value.store_id = stores.value[0].store_id
    }
  } catch (error) {
    console.error('Failed to fetch stores:', error)
    showAlert('Error!', 'Gagal memuat data toko.', 'error')
  }
}

// --- Watcher ---
watch(selectedStoreId, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    fetchBanks()
  }
})

// --- Create Bank ---
const handleCreateBank = async () => {
  if (!newBank.value.bank_name.trim()) {
    showAlert('Error!', 'Nama bank/pembayaran harus diisi.', 'error')
    return
  }
  if (!newBank.value.store_id) {
    showAlert('Error!', 'Silakan pilih toko.', 'error')
    return
  }

  isSubmitting.value = true
  try {
    await post('/banks', {
      bank_name: newBank.value.bank_name,
      store_id: newBank.value.store_id,
    })
    showAlert('Berhasil!', 'Bank/Pembayaran berhasil ditambahkan.', 'success')
    showCreateModal.value = false
    resetNewBankForm()
    await fetchBanks()
  } catch (error) {
    console.error('Failed to create bank:', error)
    const errorMessage = error.response?.data?.message || 'Gagal menambahkan data.'
    showAlert('Error!', errorMessage, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// --- Edit Bank ---
const openEditModal = (bank) => {
  editingBank.value = { ...bank }
  showEditModal.value = true
}

const handleUpdateBank = async () => {
  if (!editingBank.value.bank_name.trim()) {
    showAlert('Error!', 'Nama bank/pembayaran harus diisi.', 'error')
    return
  }

  isSubmitting.value = true
  try {
    await put(`/banks/${editingBank.value.bank_id}`, { bank_name: editingBank.value.bank_name })
    showAlert('Berhasil!', 'Data berhasil diperbarui.', 'success')
    showEditModal.value = false
    editingBank.value = null
    await fetchBanks()
  } catch (error) {
    console.error('Failed to update bank:', error)
    const errorMessage = error.response?.data?.message || 'Gagal memperbarui data.'
    showAlert('Error!', errorMessage, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// --- Delete Bank ---
const handleDeleteBank = async (bankId) => {
  const result = await showConfirm(
    'Konfirmasi Hapus',
    'Yakin ingin menghapus data ini?',
    'warning',
    'Ya, Hapus!',
    'Batal',
  )

  if (result.isConfirmed) {
    isSubmitting.value = true
    try {
      await del(`/banks/${bankId}`)
      showAlert('Dihapus!', 'Data berhasil dihapus.', 'success')
      await fetchBanks()
    } catch (error) {
      console.error('Failed to delete bank:', error)
      const errorMessage = error.response?.data?.message || 'Gagal menghapus data.'
      showAlert('Error!', errorMessage, 'error')
    } finally {
      isSubmitting.value = false
    }
  }
}

// --- Helpers ---
const resetNewBankForm = () => {
  newBank.value = {
    bank_name: '',
    store_id: stores.value.length > 0 ? stores.value[0].store_id : null,
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// --- Lifecycle ---
onMounted(async () => {
  await fetchStores()
  await fetchBanks()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-xs text-gray-800 sm:text-sm">
    <div class="mx-auto max-w-full px-3 py-4 sm:px-4 sm:py-6">
      <div class="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 sm:text-2xl">Manajemen Bank & Pembayaran</h1>
          <p class="text-xs text-gray-500 sm:text-sm">Kelola daftar bank dan metode pembayaran toko.</p>
        </div>
        <button
          @click="((showCreateModal = true), resetNewBankForm())"
          class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 md:w-auto md:px-5"
        >
          + Tambah Bank
        </button>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div
          class="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
        >
          <div class="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <label for="store-filter" class="whitespace-nowrap font-semibold text-gray-700"
              >Filter Toko:</label
            >
            <select
              id="store-filter"
              v-model="selectedStoreId"
              class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64 sm:py-1.5 sm:text-sm"
            >
              <option :value="null">Semua Toko</option>
              <option v-for="store in stores" :key="store.store_id" :value="store.store_id">
                {{ store.store_name }}
              </option>
            </select>
          </div>
          <div class="text-xs text-gray-500 sm:text-sm">
            Total Data: <strong>{{ banks.length }}</strong>
          </div>
        </div>

        <div v-if="isLoading" class="p-8 text-center text-gray-500">Memuat data...</div>

        <div v-else-if="banks.length === 0" class="p-8 text-center">
          <p class="text-gray-500 mb-4">Belum ada data bank/pembayaran.</p>
        </div>

        <template v-else>
          <div class="space-y-3 p-3 md:hidden">
            <article
              v-for="(bank, index) in banks"
              :key="bank.bank_id"
              class="rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-[11px] text-gray-500">#{{ index + 1 }}</div>
                  <div class="mt-1 text-sm font-semibold text-gray-900">{{ bank.bank_name }}</div>
                  <div class="mt-1 text-xs text-gray-600">{{ bank.store_name || '-' }}</div>
                  <div class="mt-1 text-[11px] text-gray-500">{{ formatDate(bank.created_at) }}</div>
                </div>
              </div>
              <div class="mt-3 flex gap-2">
                <button
                  @click="openEditModal(bank)"
                  class="rounded-lg border border-yellow-200 bg-white px-3 py-2 text-xs font-semibold text-yellow-700"
                >
                  Edit
                </button>
                <button
                  @click="handleDeleteBank(bank.bank_id)"
                  class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Hapus
                </button>
              </div>
            </article>
          </div>

          <div class="hidden overflow-x-auto md:block">
            <table class="w-full text-left border-collapse">
            <thead class="bg-gray-100 text-gray-700 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 font-bold border-r border-gray-200 w-12 text-center">No</th>
                <th class="px-4 py-3 font-bold border-r border-gray-200">Nama Bank / Pembayaran</th>
                <th class="px-4 py-3 font-bold border-r border-gray-200">Nama Toko</th>
                <th class="px-4 py-3 font-bold border-r border-gray-200">Tanggal Dibuat</th>
                <th class="px-4 py-3 font-bold text-center w-40">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="(bank, index) in banks"
                :key="bank.bank_id"
                class="hover:bg-blue-50 transition-colors"
              >
                <td class="px-4 py-3 text-center text-gray-500 border-r border-gray-100">
                  {{ index + 1 }}
                </td>
                <td class="px-4 py-3 font-medium text-gray-900 border-r border-gray-100">
                  {{ bank.bank_name }}
                </td>
                <td class="px-4 py-3 text-gray-600 border-r border-gray-100">
                  {{ bank.store_name || '-' }}
                </td>
                <td class="px-4 py-3 text-gray-600 border-r border-gray-100">
                  {{ formatDate(bank.created_at) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditModal(bank)"
                      class="text-yellow-600 hover:text-yellow-800 font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <span class="text-gray-300">|</span>
                    <button
                      @click="handleDeleteBank(bank.bank_id)"
                      class="text-red-600 hover:text-red-800 font-medium hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </template>
      </div>

      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4"
        @click.self="showCreateModal = false"
      >
        <div class="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-lg">
          <div class="flex items-center justify-between border-b bg-gray-100 px-4 py-3">
            <h3 class="text-sm font-bold text-gray-800 sm:text-base">Tambah Bank Baru</h3>
            <button
              @click="showCreateModal = false"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-lg font-bold text-white shadow"
            >
              &times;
            </button>
          </div>

          <form @submit.prevent="handleCreateBank" class="space-y-3 p-4 sm:space-y-4">
            <div>
              <label class="mb-1 block font-medium">Nama Bank/Pembayaran</label>
              <input
                type="text"
                v-model="newBank.bank_name"
                class="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none sm:text-sm"
                placeholder="Contoh: BCA, OVO"
                required
              />
            </div>
            <div>
              <label class="mb-1 block font-medium">Pilih Toko</label>
              <select
                v-model="newBank.store_id"
                class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none sm:text-sm"
                required
              >
                <option :value="null" disabled>-- Pilih Toko --</option>
                <option v-for="store in stores" :key="store.store_id" :value="store.store_id">
                  {{ store.store_name }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                @click="showCreateModal = false"
                class="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4"
        @click.self="showEditModal = false"
      >
        <div class="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-lg">
          <div class="flex items-center justify-between border-b bg-gray-100 px-4 py-3">
            <h3 class="text-sm font-bold text-gray-800 sm:text-base">Edit Bank</h3>
            <button
              @click="showEditModal = false"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-lg font-bold text-white shadow"
            >
              &times;
            </button>
          </div>

          <form @submit.prevent="handleUpdateBank" class="space-y-3 p-4 sm:space-y-4">
            <div>
              <label class="mb-1 block font-medium">Nama Bank/Pembayaran</label>
              <input
                type="text"
                v-model="editingBank.bank_name"
                class="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none sm:text-sm"
                required
              />
            </div>

            <div v-if="editingBank.store_id">
              <label class="mb-1 block font-medium text-gray-500"
                >ID Toko (Tidak dapat diubah)</label
              >
              <input
                type="text"
                :value="editingBank.store_id"
                readonly
                class="w-full cursor-not-allowed rounded border border-gray-300 bg-gray-100 px-3 py-2 text-xs text-gray-500 sm:text-sm"
              />
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                @click="showEditModal = false"
                class="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Menyimpan...' : 'Update' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
