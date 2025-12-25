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
  <div class="min-h-screen bg-gray-50 font-sans text-sm text-gray-800">
    <div class="container mx-auto py-6 px-4 max-w-full">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Manajemen Bank & Pembayaran</h1>
          <p class="text-gray-500">Kelola daftar bank dan metode pembayaran toko.</p>
        </div>
        <button
          @click="((showCreateModal = true), resetNewBankForm())"
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          + Tambah Bank
        </button>
      </div>

      <div class="bg-white rounded-lg shadow border border-gray-200">
        <div
          class="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <label for="store-filter" class="font-semibold text-gray-700 whitespace-nowrap"
              >Filter Toko:</label
            >
            <select
              id="store-filter"
              v-model="selectedStoreId"
              class="w-full sm:w-64 border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option :value="null">Semua Toko</option>
              <option v-for="store in stores" :key="store.store_id" :value="store.store_id">
                {{ store.store_name }}
              </option>
            </select>
          </div>
          <div class="text-gray-500">
            Total Data: <strong>{{ banks.length }}</strong>
          </div>
        </div>

        <div v-if="isLoading" class="p-8 text-center text-gray-500">Memuat data...</div>

        <div v-else-if="banks.length === 0" class="p-8 text-center">
          <p class="text-gray-500 mb-4">Belum ada data bank/pembayaran.</p>
        </div>

        <div v-else class="overflow-x-auto">
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
      </div>

      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
          <div class="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
            <h3 class="font-bold text-gray-800">Tambah Bank Baru</h3>
            <button
              @click="showCreateModal = false"
              class="text-gray-500 hover:text-gray-800 font-bold text-lg"
            >
              &times;
            </button>
          </div>

          <form @submit.prevent="handleCreateBank" class="p-4 space-y-4">
            <div>
              <label class="block font-medium mb-1">Nama Bank/Pembayaran</label>
              <input
                type="text"
                v-model="newBank.bank_name"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Contoh: BCA, OVO"
                required
              />
            </div>
            <div>
              <label class="block font-medium mb-1">Pilih Toko</label>
              <select
                v-model="newBank.store_id"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                required
              >
                <option :value="null" disabled>-- Pilih Toko --</option>
                <option v-for="store in stores" :key="store.store_id" :value="store.store_id">
                  {{ store.store_name }}
                </option>
              </select>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="showCreateModal = false"
                class="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showEditModal = false"
      >
        <div class="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
          <div class="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
            <h3 class="font-bold text-gray-800">Edit Bank</h3>
            <button
              @click="showEditModal = false"
              class="text-gray-500 hover:text-gray-800 font-bold text-lg"
            >
              &times;
            </button>
          </div>

          <form @submit.prevent="handleUpdateBank" class="p-4 space-y-4">
            <div>
              <label class="block font-medium mb-1">Nama Bank/Pembayaran</label>
              <input
                type="text"
                v-model="editingBank.bank_name"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div v-if="editingBank.store_id">
              <label class="block font-medium mb-1 text-gray-500"
                >ID Toko (Tidak dapat diubah)</label
              >
              <input
                type="text"
                :value="editingBank.store_id"
                readonly
                class="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded px-3 py-2 cursor-not-allowed"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="showEditModal = false"
                class="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
