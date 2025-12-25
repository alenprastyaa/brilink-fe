<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuth } from '@/composables/useAuth'
import { useSweetAlert } from '@/composables/useSweetAlert'
import FormField from '@/components/FormField.vue'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

const { get, del, put, removeUangNitip } = useApi()
const { isAdmin, user } = useAuth()
const { showAlert, showConfirm } = useSweetAlert()

const reports = ref([])
const stores = ref([])
const banks = ref([])
const isLoading = ref(false)
const showModal = ref(false)
const showEditModal = ref(false)
const selectedReport = ref(null)
const editableReport = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(0)
const totalItems = ref(0)

const filter = ref({
  store_id: '',
  start_date: '',
  end_date: '',
})

// --- Logic Pagination & Fetch ---
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchReports()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchReports()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchReports()
  }
}

const changeItemsPerPage = () => {
  currentPage.value = 1
  fetchReports()
}

const fetchReports = async () => {
  isLoading.value = true
  try {
    const queryParams = new URLSearchParams()
    if (filter.value.store_id) queryParams.append('store_id', filter.value.store_id)
    if (filter.value.start_date) queryParams.append('start_date', filter.value.start_date)
    if (filter.value.end_date) queryParams.append('end_date', filter.value.end_date)
    queryParams.append('page', currentPage.value)
    queryParams.append('limit', itemsPerPage.value)

    const response = await get(`/reports?${queryParams.toString()}`)
    let fetchedReports = response.reports || []

    totalItems.value = response.total || fetchedReports.length
    totalPages.value = response.total_pages || Math.ceil(totalItems.value / itemsPerPage.value)

    // Client-side filtering backup
    if (fetchedReports.length > 0) {
      if (filter.value.store_id) {
        fetchedReports = fetchedReports.filter((r) => r.store_id === filter.value.store_id)
      }
      if (filter.value.start_date) {
        const startDate = new Date(filter.value.start_date)
        fetchedReports = fetchedReports.filter(
          (r) => new Date(r.report_date).setHours(0, 0, 0, 0) >= startDate.setHours(0, 0, 0, 0),
        )
      }
      if (filter.value.end_date) {
        const endDate = new Date(filter.value.end_date)
        endDate.setHours(23, 59, 59, 999)
        fetchedReports = fetchedReports.filter((r) => new Date(r.report_date) <= endDate)
      }
    }

    // Sorting & Profit Calculation
    fetchedReports.sort((a, b) => {
      const dateA = parseISO(a.report_date).getTime()
      const dateB = parseISO(b.report_date).getTime()
      return dateA !== dateB ? dateB - dateA : a.store_name.localeCompare(b.store_name)
    })

    const processedReports = []
    const lastDayBalance = {}
    const storeGroups = {}

    for (const report of fetchedReports) {
      if (!storeGroups[report.store_id]) storeGroups[report.store_id] = []
      storeGroups[report.store_id].push(report)
    }

    for (const storeId in storeGroups) {
      const storeReports = storeGroups[storeId].sort(
        (a, b) => parseISO(a.report_date).getTime() - parseISO(b.report_date).getTime(),
      )
      lastDayBalance[storeId] = undefined
      for (const report of storeReports) {
        const currentBalance = report.total_balance || 0
        let profit = 0
        if (lastDayBalance[storeId] !== undefined) {
          profit = currentBalance - lastDayBalance[storeId]
        }
        processedReports.push({ ...report, profit_today: profit })
        lastDayBalance[storeId] = currentBalance
      }
    }

    processedReports.sort((a, b) => {
      const dateA = parseISO(a.report_date).getTime()
      const dateB = parseISO(b.report_date).getTime()
      return dateA !== dateB ? dateB - dateA : a.store_name.localeCompare(b.store_name)
    })

    reports.value = processedReports
  } catch (error) {
    console.error(error)
    showAlert('Error', 'Gagal memuat laporan.', 'error')
  } finally {
    isLoading.value = false
  }
}

// --- Fetch Aux Data ---
const fetchStores = async () => {
  try {
    const response = await get('/stores')
    if (!isAdmin.value && user.value?.user_id) {
      stores.value = response.stores.filter(
        (s) => s.employee_ids && s.employee_ids.includes(user.value.user_id),
      )
    } else {
      stores.value = response.stores || []
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchBanks = async () => {
  try {
    const response = await get('/banks')
    banks.value = response.banks || []
  } catch (e) {
    console.error(e)
  }
}

// --- CRUD Actions ---
const deleteReport = async (reportId) => {
  const result = await showConfirm(
    'Hapus Laporan',
    'Yakin ingin menghapus?',
    'warning',
    'Ya',
    'Batal',
  )
  if (!result.isConfirmed) return

  try {
    isLoading.value = true
    await del(`/reports/${reportId}`)
    reports.value = reports.value.filter((r) => r.report_id !== reportId)
    showAlert('Sukses', 'Laporan dihapus.', 'success')
    fetchReports()
  } catch (e) {
    showAlert('Error', 'Gagal menghapus.', 'error')
  } finally {
    isLoading.value = false
  }
}

const openEditModal = (report) => {
  editableReport.value = JSON.parse(JSON.stringify(report))
  editableReport.value.report_date = report.report_date
    ? format(parseISO(report.report_date), 'yyyy-MM-dd')
    : ''

  if (!editableReport.value.balances) {
    editableReport.value.balances = editableReport.value.balances_detail
      ? editableReport.value.balances_detail.map((d) => ({ bank_id: d.bank_id, saldo: d.saldo }))
      : []
  }
  if (typeof editableReport.value.uang_nitip === 'undefined') editableReport.value.uang_nitip = 0

  showEditModal.value = true
  if (showModal.value) showModal.value = false
}

const closeEditModal = () => {
  showEditModal.value = false
  editableReport.value = null
}

const updateReport = async () => {
  if (!editableReport.value) return
  const result = await showConfirm('Simpan', 'Simpan perubahan?', 'info', 'Ya', 'Batal')
  if (!result.isConfirmed) return

  isLoading.value = true
  try {
    const payload = {
      store_id: editableReport.value.store_id,
      report_date: editableReport.value.report_date,
      balances: editableReport.value.balances.map((b) => ({
        bank_id: b.bank_id,
        saldo: parseFloat(b.saldo) || 0,
      })),
      keterangan: editableReport.value.keterangan || '',
      uang_nitip: parseFloat(editableReport.value.uang_nitip) || 0,
    }
    await put(`/reports/${editableReport.value.report_id}`, payload)
    showAlert('Sukses', 'Laporan diperbarui.', 'success')
    closeEditModal()
    fetchReports()
  } catch (e) {
    showAlert('Error', 'Gagal update.', 'error')
  } finally {
    isLoading.value = false
  }
}

const addBankDetail = () => editableReport.value?.balances.push({ bank_id: '', saldo: 0 })
const removeBankDetail = (idx) => editableReport.value?.balances.splice(idx, 1)

const handleRemoveUangNitip = async (reportId) => {
  const result = await showConfirm('Reset Uang Nitip', 'Ubah jadi 0?', 'warning', 'Ya', 'Batal')
  if (!result.isConfirmed) return
  try {
    await removeUangNitip(reportId)
    fetchReports()
    showAlert('Sukses', 'Uang nitip direset.', 'success')
  } catch (e) {
    showAlert('Error', 'Gagal.', 'error')
  }
}

// --- Helpers ---
onMounted(() => {
  fetchStores()
  fetchBanks()
  fetchReports()
})

const storeOptions = computed(() => [
  { label: 'Semua Toko', value: '' },
  ...stores.value.map((s) => ({ label: s.store_name, value: s.store_id })),
])
const bankOptions = computed(() =>
  banks.value.map((b) => ({ label: b.bank_name, value: b.bank_id })),
)
const totalOverallProfit = computed(() =>
  reports.value.reduce((sum, r) => sum + (r.profit_today || 0), 0),
)
const calculatedTotalBalance = computed(() => {
  if (!editableReport.value) return 0
  const bal = editableReport.value.balances.reduce((s, b) => s + (parseFloat(b.saldo) || 0), 0)
  return bal + (parseFloat(editableReport.value.uang_nitip) || 0)
})

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v || 0)
const formatCurrencyInput = (v) => new Intl.NumberFormat('id-ID').format(v || 0)
const formatDate = (d) => (d ? format(parseISO(d), 'dd/MM/yyyy', { locale: id }) : '-')
const getProfitColor = (v) => (v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : 'text-gray-600')

const openModal = (r) => {
  selectedReport.value = r
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
  selectedReport.value = null
}
const updateBalance = (b, e) => (b.saldo = parseFloat(e.target.value.replace(/[^\d]/g, '')) || 0)
const blurBalance = (b, e) => (e.target.value = formatCurrencyInput(b.saldo))
const focusBalance = (b, e) => (e.target.value = b.saldo || '')
const resetFilter = () => {
  filter.value = { store_id: '', start_date: '', end_date: '' }
  fetchReports()
}
</script>

<template>
  <div class="container mx-auto py-6 px-4 text-[12px] text-gray-800">
    <div class="flex justify-between items-end mt-5">
      <div class="text-right bg-white p-2 rounded border border-gray-200 shadow-sm">
        <div class="text-[10px] text-gray-500 uppercase tracking-wider">Total Profit Terfilter</div>
        <div class="font-bold text-[14px]" :class="getProfitColor(totalOverallProfit)">
          {{ formatCurrency(totalOverallProfit) }}
        </div>
      </div>
    </div>

    <div class="bg-white p-4 rounded border border-gray-200 mb-6 shadow-sm">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1 w-full">
          <label class="block mb-1 font-medium">Toko</label>
          <select
            v-model="filter.store_id"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-[12px]"
          >
            <option v-for="opt in storeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="flex-1 w-full">
          <label class="block mb-1 font-medium">Dari</label>
          <input
            type="date"
            v-model="filter.start_date"
            class="w-full border border-gray-300 rounded px-3 py-2 text-[12px]"
          />
        </div>
        <div class="flex-1 w-full">
          <label class="block mb-1 font-medium">Sampai</label>
          <input
            type="date"
            v-model="filter.end_date"
            class="w-full border border-gray-300 rounded px-3 py-2 text-[12px]"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="resetFilter"
            class="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 font-medium"
          >
            Reset
          </button>
          <button
            @click="fetchReports"
            class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
          >
            Filter
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-700 border-b border-gray-200">
              <th class="py-3 px-4 font-bold w-12 text-center">No</th>
              <th class="py-3 px-4 font-bold">Tanggal & Inputter</th>
              <th class="py-3 px-4 font-bold">Nama Toko</th>
              <th class="py-3 px-4 font-bold text-right">Saldo Bank</th>
              <th class="py-3 px-4 font-bold text-right">Uang Nitip</th>
              <th class="py-3 px-4 font-bold text-right">Total Saldo</th>
              <th class="py-3 px-4 font-bold text-right">Profit Harian</th>
              <th class="py-3 px-4 font-bold text-center w-32">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="isLoading">
              <td colspan="8" class="text-center py-8 text-gray-500">Memuat data tabel...</td>
            </tr>
            <tr v-else-if="reports.length === 0">
              <td colspan="8" class="text-center py-8 text-gray-500">
                Tidak ada laporan ditemukan.
              </td>
            </tr>
            <tr
              v-for="(report, index) in reports"
              :key="report.report_id"
              class="hover:bg-blue-50 transition-colors"
            >
              <td class="py-3 px-4 text-center text-gray-500">
                {{ (currentPage - 1) * itemsPerPage + index + 1 }}
              </td>
              <td class="py-3 px-4">
                <div class="font-medium">{{ formatDate(report.report_date) }}</div>
                <!-- <div class="text-[10px] text-gray-500 uppercase">{{ report.creator_username }}</div> -->
              </td>
              <td class="py-3 px-4 font-medium text-gray-800">
                {{ report.store_name }}
              </td>
              <td class="py-3 px-4 text-right font-mono">
                {{ formatCurrency(report.total_balance) }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex flex-col items-end">
                  <span class="font-mono">{{ formatCurrency(report.uang_nitip) }}</span>
                  <button
                    v-if="report.uang_nitip > 0"
                    @click="handleRemoveUangNitip(report.report_id)"
                    class="text-[10px] text-red-500 hover:text-red-700 hover:underline mt-0.5"
                  >
                    Reset
                  </button>
                </div>
              </td>
              <td class="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                {{ formatCurrency(report.total_balance + (report.uang_nitip || 0)) }}
              </td>
              <td
                class="py-3 px-4 text-right font-bold font-mono"
                :class="getProfitColor(report.profit_today)"
              >
                {{ formatCurrency(report.profit_today) }}
              </td>
              <td class="py-3 px-4 text-center">
                <div class="flex justify-center gap-3">
                  <button
                    @click="openModal(report)"
                    class="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Detail
                  </button>
                  <template v-if="isAdmin">
                    <button
                      @click="openEditModal(report)"
                      class="text-yellow-600 hover:text-yellow-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteReport(report.report_id)"
                      class="text-red-600 hover:text-red-800 font-medium"
                    >
                      Hapus
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="reports.length > 0"
        class="bg-gray-50 p-3 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4"
      >
        <div class="flex items-center gap-2">
          <span>Baris per hal:</span>
          <select
            v-model="itemsPerPage"
            @change="changeItemsPerPage"
            class="border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="text-gray-600">
          Hal {{ currentPage }} dari {{ totalPages }} (Total {{ totalItems }})
        </div>
        <div class="flex gap-1">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-1 border bg-white rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border bg-white rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div
        class="bg-white rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div class="bg-gray-100 px-4 py-3 border-b flex justify-between items-center flex-shrink-0">
          <h3 class="font-bold">Detail Laporan: {{ selectedReport?.store_name }}</h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-800 text-lg font-bold">
            &times;
          </button>
        </div>

        <div class="p-4 overflow-y-auto flex-1">
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div class="p-2 border rounded bg-gray-50">
              <div class="text-gray-500 text-[10px] uppercase">Profit Hari Ini</div>
              <div
                class="font-bold text-[14px]"
                :class="getProfitColor(selectedReport?.profit_today)"
              >
                {{ formatCurrency(selectedReport?.profit_today) }}
              </div>
            </div>
            <div class="p-2 border rounded bg-gray-50">
              <div class="text-gray-500 text-[10px] uppercase">Total Balance + Titipan</div>
              <div class="font-bold text-[14px] text-blue-700">
                {{
                  formatCurrency(selectedReport?.total_balance + (selectedReport?.uang_nitip || 0))
                }}
              </div>
            </div>
          </div>

          <div class="border border-gray-200 rounded mb-4 overflow-hidden">
            <div class="max-h-60 overflow-y-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th class="p-2 border-b font-medium bg-gray-50">Bank</th>
                    <th class="p-2 border-b font-medium text-right bg-gray-50">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="b in selectedReport?.balances_detail"
                    :key="b.bank_id"
                    class="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td class="p-2">{{ b.bank_name }}</td>
                    <td class="p-2 text-right">{{ formatCurrency(b.saldo) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            v-if="selectedReport?.keterangan"
            class="bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800"
          >
            <span class="font-bold block mb-1">Catatan:</span> {{ selectedReport.keterangan }}
          </div>
        </div>

        <div class="p-3 bg-gray-50 border-t flex justify-end">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="bg-white px-4 py-3 border-b flex justify-between items-center">
          <h3 class="font-bold">Edit Laporan</h3>
          <button
            @click="closeEditModal"
            class="text-gray-500 hover:text-gray-800 text-lg font-bold"
          >
            &times;
          </button>
        </div>
        <div class="p-4 overflow-y-auto flex-1 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 font-medium">Toko</label>
              <select
                v-model="editableReport.store_id"
                class="w-full border rounded p-2 text-[12px]"
              >
                <option v-for="opt in storeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-1 font-medium">Tanggal</label>
              <input
                type="date"
                v-model="editableReport.report_date"
                class="w-full border rounded p-2 text-[12px]"
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="font-medium">Rincian Bank</label>
              <button @click="addBankDetail" class="text-blue-600 hover:underline">+ Tambah</button>
            </div>
            <div class="border rounded p-2 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
              <div
                v-for="(bal, idx) in editableReport.balances"
                :key="idx"
                class="flex gap-2 items-center"
              >
                <select v-model="bal.bank_id" class="flex-1 border rounded p-1.5 text-[12px]">
                  <option value="" disabled>Pilih Bank</option>
                  <option v-for="bk in bankOptions" :key="bk.value" :value="bk.value">
                    {{ bk.label }}
                  </option>
                </select>
                <input
                  type="text"
                  :value="formatCurrencyInput(bal.saldo)"
                  @input="updateBalance(bal, $event)"
                  @blur="blurBalance(bal, $event)"
                  @focus="focusBalance(bal, $event)"
                  class="flex-1 border rounded p-1.5 text-right text-[12px]"
                  placeholder="Rp"
                />
                <button
                  @click="removeBankDetail(idx)"
                  class="text-red-500 hover:text-red-700 font-bold px-2"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 font-medium">Uang Nitip</label>
              <input
                type="number"
                v-model.number="editableReport.uang_nitip"
                class="w-full border rounded p-2 text-right text-[12px]"
              />
            </div>
            <div>
              <label class="block mb-1 font-medium text-gray-500">Total (Auto)</label>
              <input
                type="text"
                :value="formatCurrency(calculatedTotalBalance)"
                readonly
                class="w-full bg-gray-100 border rounded p-2 text-right text-[12px] font-bold"
              />
            </div>
          </div>

          <div>
            <label class="block mb-1 font-medium">Keterangan</label>
            <textarea
              v-model="editableReport.keterangan"
              rows="2"
              class="w-full border rounded p-2 text-[12px]"
            ></textarea>
          </div>
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            @click="closeEditModal"
            class="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            @click="updateReport"
            :disabled="isLoading"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
