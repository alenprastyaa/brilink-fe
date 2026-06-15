<template>
  <KaryawanDashboardPage v-if="isKaryawan" />

  <div v-else
    class="min-h-screen max-w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-4 sm:px-4 lg:px-6">
    <div class="mb-3 sm:mb-6"></div>

    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-center sm:p-6">
      <p class="text-red-600 font-semibold">{{ error }}</p>
      <button @click="fetchDashboardData"
        class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150">
        Coba Lagi
      </button>
    </div>

    <div v-else-if="data" class="max-w-full space-y-4 overflow-x-hidden sm:space-y-6">
      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4 2xl:gap-6">
        <div class="min-w-0 rounded-xl border-l-4 border-blue-600 bg-white p-3 shadow-sm sm:p-6 sm:shadow-lg">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Total Toko</p>
              <p class="mt-1 text-xl font-bold text-gray-800 sm:mt-2 sm:text-3xl">{{ data.overview.total_stores }}</p>
            </div>
            <div class="rounded-full p-2 sm:p-4">
              <svg class="h-6 w-6 text-blue-600 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>

        <div class="min-w-0 rounded-xl border-l-4 border-green-600 bg-white p-3 shadow-sm sm:p-6 sm:shadow-lg">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Total Laporan</p>
              <p class="mt-1 text-xl font-bold text-gray-800 sm:mt-2 sm:text-3xl">{{ data.overview.total_reports }}</p>
            </div>
            <div class="rounded-full p-2 sm:p-4">
              <svg class="h-6 w-6 text-green-600 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="min-w-0 rounded-xl border-l-4 border-purple-600 bg-white p-3 shadow-sm sm:p-6 sm:shadow-lg">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Saldo Terkini</p>
              <p class="mt-1 break-words text-[11px] font-bold text-gray-800 sm:mt-2 sm:text-2xl">
                {{ formatCurrency(data.overview.latest_total_balance) }}
              </p>
            </div>
            <div class="shrink-0 rounded-full p-1 sm:p-4">
              <svg class="h-6 w-6 text-purple-600 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="rounded-xl border-l-4 bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg"
          :class="data.period.total_profit >= 0 ? 'border-emerald-600' : 'border-red-600'">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-500 sm:text-sm">Profit (30 Hari)</p>
              <p class="mt-1 break-words text-[11px] font-bold sm:mt-2 sm:text-2xl"
                :class="data.period.total_profit >= 0 ? 'text-emerald-600' : 'text-red-600'">
                {{ formatCurrency(data.period.total_profit) }}
              </p>
              <p class="mt-1 text-xs sm:text-sm"
                :class="data.period.total_profit >= 0 ? 'text-emerald-600' : 'text-red-600'">
                {{ data.period.profit_percentage }}%
              </p>
            </div>
            <div class="shrink-0 rounded-full p-1 sm:p-4"
              :class="data.period.total_profit >= 0 ? 'bg-emerald-100' : ''">
              <svg v-if="data.period.total_profit >= 0" class="h-6 w-6 text-emerald-600 sm:h-8 sm:w-8" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <svg v-else class="h-6 w-6 text-red-600 sm:h-8 sm:w-8" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div
        class="min-w-0 overflow-hidden rounded-xl bg-blue-600 to-blue-700 p-4 text-white shadow-sm sm:p-6 sm:shadow-lg">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-xs font-medium text-blue-100 sm:text-sm">Periode Laporan</p>
            <p class="mt-1 text-base font-bold sm:text-2xl">
              {{ formatDate(data.period.start_date) }} - {{ formatDate(data.period.end_date) }}
            </p>
          </div>
          <div class="grid min-w-0 grid-cols-1 gap-3 xl:flex xl:gap-8">
            <div class="min-w-0">
              <p class="text-xs text-blue-100 sm:text-sm">Total Laporan</p>
              <p class="text-xl font-bold sm:text-3xl">{{ data.period.total_reports }}</p>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-blue-100 sm:text-sm">Rata-rata Saldo</p>
              <p class="break-words text-[11px] font-bold sm:text-2xl">{{ formatCurrency(data.period.average_balance) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        <div class="min-w-0 overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg">
          <h2 class="mb-3 text-base font-bold text-gray-800 sm:mb-4 sm:text-xl">Tren Saldo Harian</h2>
          <div class="h-60 min-w-0 sm:h-80">
            <canvas ref="balanceChart"></canvas>
          </div>
        </div>

        <div class="min-w-0 overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg">
          <h2 class="mb-3 text-base font-bold text-gray-800 sm:mb-4 sm:text-xl">Tren Profit Harian</h2>
          <div class="h-60 min-w-0 sm:h-80">
            <canvas ref="profitChart"></canvas>
          </div>
        </div>
      </div>

      <div class="min-w-0 overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg">
        <h2 class="mb-3 text-base font-bold text-gray-800 sm:mb-4 sm:text-xl">Laporan per Toko (30 Hari)</h2>
        <div class="h-60 min-w-0 sm:h-80">
          <canvas ref="storeReportsChart"></canvas>
        </div>
      </div>

      <div class="min-w-0 overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg">
        <h2 class="mb-3 text-base font-bold text-gray-800 sm:mb-4 sm:text-xl">Top 5 Toko Berdasarkan Saldo</h2>

        <div class="space-y-3 xl:hidden">
          <article v-for="(store, index) in data.top_stores" :key="store.store_id"
            class="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div class="flex min-w-0 items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    :class="index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                            ? 'bg-orange-600'
                            : 'bg-gray-300'
                      ">
                    {{ index + 1 }}
                  </span>
                  <h3 class="min-w-0 truncate text-sm font-semibold text-gray-900">{{ store.store_name }}</h3>
                </div>
                <p class="mt-2 text-xs text-gray-500">{{ store.total_reports }} laporan</p>
              </div>
              <span class="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
                :class="store.balance_growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ formatCurrency(store.balance_growth) }}
              </span>
            </div>
            <div class="mt-3 grid grid-cols-1 gap-2 text-xs xl:grid-cols-2">
              <div class="min-w-0 rounded-lg bg-white p-2">
                <p class="text-gray-500">Rata-rata</p>
                <p class="mt-1 break-words text-[11px] font-semibold text-gray-900">{{ formatCurrency(store.avg_balance)
                  }}</p>
              </div>
              <div class="min-w-0 rounded-lg bg-white p-2">
                <p class="text-gray-500">Saldo Maks</p>
                <p class="mt-1 break-words text-[11px] font-semibold text-gray-900">{{ formatCurrency(store.max_balance)
                  }}</p>
              </div>
            </div>
          </article>
        </div>

        <div class="hidden overflow-x-auto xl:block">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Peringkat
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Toko
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Laporan
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rata-rata Saldo
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Saldo Maks
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pertumbuhan
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(store, index) in data.top_stores" :key="store.store_id"
                class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                      :class="index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                              ? 'bg-orange-600'
                              : 'bg-gray-300'
                        ">
                      {{ index + 1 }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ store.store_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {{ store.total_reports }} laporan
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {{ formatCurrency(store.avg_balance) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(store.max_balance) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" :class="store.balance_growth >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    ">
                    <svg v-if="store.balance_growth >= 0" class="w-3 h-3 mr-1" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <svg v-else class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {{ formatCurrency(store.balance_growth) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="min-w-0 overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg">
        <h2 class="mb-3 text-base font-bold text-gray-800 sm:mb-4 sm:text-xl">Aktivitas Terbaru</h2>
        <div class="space-y-3 sm:space-y-4">
          <div v-for="activity in data.recent_activities.slice(0, 10)" :key="activity.report_id"
            class="flex min-w-0 flex-col gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="min-w-0 truncate text-sm font-semibold text-gray-800 sm:text-base">{{ activity.store_name
                  }}</span>
                <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{{
                  activity.creator_name
                  }}</span>
              </div>
              <p class="mt-1 text-xs text-gray-600 sm:text-sm">{{ formatDate(activity.report_date) }}</p>
              <p v-if="activity.keterangan" class="text-xs text-gray-500 mt-1 truncate">
                {{ activity.keterangan }}
              </p>
            </div>
            <div class="min-w-0 flex-shrink-0 text-left sm:ml-4 sm:text-right">
              <p class="break-words text-xs font-bold text-gray-800 sm:text-base">{{
                formatCurrency(activity.total_balance) }}</p>
              <p class="text-xs text-gray-500">{{ formatDateTime(activity.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="min-w-0 overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:p-6 sm:shadow-lg">
        <h2 class="mb-3 text-base font-bold text-gray-800 sm:mb-4 sm:text-xl">Perbandingan Bulanan</h2>
        <div class="grid grid-cols-1 gap-3 xl:grid-cols-3 xl:gap-6">
          <div class="min-w-0 rounded-lg bg-blue-50 p-4 sm:p-6">
            <p class="mb-2 text-sm font-medium text-gray-600">Bulan Ini</p>
            <p class="text-xs text-gray-500 mb-3">
              {{ data.monthly_comparison.current_month.period }}
            </p>
            <div class="space-y-2">
              <div class="flex min-w-0 justify-between gap-2">
                <span class="text-sm text-gray-600">Laporan:</span>
                <span class="font-semibold">{{
                  data.monthly_comparison.current_month.total_reports
                  }}</span>
              </div>
              <div class="flex min-w-0 justify-between gap-2">
                <span class="text-sm text-gray-600">Rata-rata:</span>
                <span class="break-words text-right text-xs font-semibold sm:text-sm">{{
                  formatCurrency(data.monthly_comparison.current_month.avg_balance)
                  }}</span>
              </div>
            </div>
          </div>

          <div class="min-w-0 rounded-lg bg-green-50 p-4 sm:p-6">
            <p class="mb-2 text-sm font-medium text-gray-600">Bulan Lalu</p>
            <p class="text-xs text-gray-500 mb-3">
              {{ data.monthly_comparison.last_month.period }}
            </p>
            <div class="space-y-2">
              <div class="flex min-w-0 justify-between gap-2">
                <span class="text-sm text-gray-600">Laporan:</span>
                <span class="font-semibold">{{
                  data.monthly_comparison.last_month.total_reports
                  }}</span>
              </div>
              <div class="flex min-w-0 justify-between gap-2">
                <span class="text-sm text-gray-600">Rata-rata:</span>
                <span class="break-words text-right text-xs font-semibold sm:text-sm">{{
                  formatCurrency(data.monthly_comparison.last_month.avg_balance)
                  }}</span>
              </div>
            </div>
          </div>

          <div class="min-w-0 rounded-lg bg-purple-50 p-4 sm:p-6">
            <p class="mb-2 text-sm font-medium text-gray-600">Pertumbuhan</p>
            <p class="text-xs text-gray-500 mb-3">Perubahan (vs. Bulan Lalu)</p>
            <div class="space-y-2">
              <div class="flex min-w-0 justify-between gap-2">
                <span class="text-sm text-gray-600">Laporan:</span>
                <span class="font-semibold" :class="data.monthly_comparison.growth.reports >= 0 ? 'text-green-600' : 'text-red-600'
                  ">
                  {{ data.monthly_comparison.growth.reports >= 0 ? '+' : ''
                  }}{{ data.monthly_comparison.growth.reports }}
                </span>
              </div>
              <div class="flex min-w-0 justify-between gap-2">
                <span class="text-sm text-gray-600">Rata-rata:</span>
                <span class="break-words text-right text-xs font-semibold sm:text-sm" :class="data.monthly_comparison.growth.avg_balance >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                  ">
                  {{ formatCurrency(data.monthly_comparison.growth.avg_balance) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import Chart from 'chart.js/auto'
import { useAuth } from '@/composables/useAuth'
import KaryawanDashboardPage from '@/views/KaryawanDashboardPage.vue'

const { isAdmin, isKaryawan } = useAuth()

// --- State Reaktif ---
const data = ref(null)
const loading = ref(true)
const error = ref(null)
const balanceChart = ref(null)
const profitChart = ref(null)
const storeReportsChart = ref(null)
let balanceChartInstance = null
let profitChartInstance = null
let storeReportsChartInstance = null

// --- Fungsi Helper Formatting (Diintegrasikan) ---

const formatCurrency = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue) || value === null) return 'IDR 0'

  // Gunakan Math.abs untuk memformat angka tanpa tanda (agar IDR diletakkan di depan)
  const formattedValue = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(numValue))

  // Tambahkan tanda negatif jika nilai aslinya negatif
  return numValue < 0 ? `- ${formattedValue}` : formattedValue
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) {
    return dateString // Kembalikan string asli jika gagal
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return dateString // Kembalikan string asli jika gagal
  }
}

// --- Logika Fetch Data ---

const fetchDashboardData = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('token')
    if (!token) throw new Error('Token otorisasi tidak ditemukan. Harap login ulang.')

    const response = await fetch('https://bitwisi.cloud/hakimah/api/reports/dasboard/tes', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ message: 'Gagal mengambil data dari server.' }))
      throw new Error(errorBody.message || 'Gagal mengambil data dari server.')
    }

    const result = await response.json()
    data.value = result.data
  } catch (err) {
    console.error('Fetch Error:', err)
    error.value = err.message || 'Terjadi kesalahan saat memuat data.'
  } finally {
    loading.value = false
  }
}

// --- Logika Chart Initialization ---

const initCharts = async () => {
  // Tunggu hingga DOM (Canvas) dirender
  await nextTick()

  if (!data.value) return

  // Destroy existing charts
  if (balanceChartInstance) balanceChartInstance.destroy()
  if (profitChartInstance) profitChartInstance.destroy()
  if (storeReportsChartInstance) storeReportsChartInstance.destroy()

  const dashboardData = data.value

  // 1. Balance Trend Chart (Line)
  const balanceCtx = balanceChart.value?.getContext('2d')
  if (balanceCtx) {
    balanceChartInstance = new Chart(balanceCtx, {
      type: 'line',
      data: {
        labels: dashboardData.daily_balance_trend.map((item) => formatDate(item.report_date)),
        datasets: [
          {
            label: 'Total Saldo',
            data: dashboardData.daily_balance_trend.map((item) => parseFloat(item.total_balance)),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: (value) => formatCurrency(value) },
          },
        },
      },
    })
  }

  // 2. Profit Trend Chart (Bar)
  const profitCtx = profitChart.value?.getContext('2d')
  if (profitCtx) {
    profitChartInstance = new Chart(profitCtx, {
      type: 'bar',
      data: {
        labels: dashboardData.profit_trend.map((item) => formatDate(item.date)),
        datasets: [
          {
            label: 'Profit Harian',
            data: dashboardData.profit_trend.map((item) => item.profit),
            backgroundColor: dashboardData.profit_trend.map((item) =>
              item.profit >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            ),
            borderColor: dashboardData.profit_trend.map((item) =>
              item.profit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
        },
        scales: {
          y: {
            ticks: { callback: (value) => formatCurrency(value) },
          },
        },
      },
    })
  }

  // 3. Store Reports Chart (Bar)
  const storeReportsCtx = storeReportsChart.value?.getContext('2d')
  if (storeReportsCtx) {
    storeReportsChartInstance = new Chart(storeReportsCtx, {
      type: 'bar',
      data: {
        labels: dashboardData.period.reports_by_store.map((item) => item.store_name),
        datasets: [
          {
            label: 'Jumlah Laporan',
            data: dashboardData.period.reports_by_store.map((item) => item.report_count),
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
          x: {
            // Untuk mengantisipasi nama toko yang panjang
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
      },
    })
  }
}

// --- Lifecycle Hook & Watcher ---

onMounted(() => {
  if (isAdmin.value) {
    fetchDashboardData()
  }
})

// Panggil initCharts setiap kali data.value berubah dan tidak dalam mode loading
watch(
  data,
  (newValue) => {
    if (newValue && isAdmin.value) {
      initCharts()
    }
  },
  { deep: true },
)
</script>
