<script setup>
import { computed, onMounted, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useSweetAlert } from '@/composables/useSweetAlert'

const { get, post, put, del } = useApi()
const { showAlert, showConfirm, showToast } = useSweetAlert()

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = formatLocalDate()
const recipients = ref([])
const schedules = ref([])
const selectedRecipientIds = ref([])
const form = ref({
  name: '',
  phone_number: '',
  is_active: true,
})
const scheduleForm = ref({
  scheduled_time: '20:00',
  is_active: true,
})
const isLoading = ref(false)
const isSaving = ref(false)
const isScheduleSaving = ref(false)
const isSending = ref(false)
const isDownloadingPdf = ref(false)
const lastSendResult = ref(null)

const activeRecipients = computed(() =>
  recipients.value.filter((recipient) => Number(recipient.is_active) === 1),
)

const activeSchedules = computed(() =>
  schedules.value.filter((schedule) => Number(schedule.is_active) === 1),
)

const selectedCount = computed(() => selectedRecipientIds.value.length)

const latestPdfFileName = computed(() => {
  const date = lastSendResult.value?.report_date || today
  return `laporan-keuntungan-harian-${date}.pdf`
})

const downloadLatestPdf = () => {
  if (!lastSendResult.value?.pdf_url) return

  const link = document.createElement('a')
  link.href = lastSendResult.value.pdf_url
  link.download = latestPdfFileName.value
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const generateAndDownloadPdf = async () => {
  isDownloadingPdf.value = true
  try {
    const response = await post('/whatsapp-reports/daily-profit/pdf', {
      date: today,
    })
    lastSendResult.value = {
      ...response,
      sent: 0,
      failed: 0,
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
    downloadLatestPdf()
    showToast('PDF berhasil dibuat.', 'success')
  } catch (error) {
    console.error('Generate daily profit PDF error:', error)
  } finally {
    isDownloadingPdf.value = false
  }
}

const formatPhone = (phone) => {
  const value = String(phone || '')
  if (value.startsWith('62')) return `+${value}`
  return value
}

const fetchRecipients = async () => {
  isLoading.value = true
  try {
    const response = await get('/whatsapp-reports/recipients')
    recipients.value = response.recipients || []
    const activeIds = new Set(
      recipients.value
        .filter((recipient) => Number(recipient.is_active) === 1)
        .map((recipient) => recipient.recipient_id),
    )
    selectedRecipientIds.value = selectedRecipientIds.value.filter((id) => activeIds.has(id))
  } catch (error) {
    console.error('Fetch WhatsApp recipients error:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchSchedules = async () => {
  try {
    const response = await get('/whatsapp-reports/schedules')
    schedules.value = response.schedules || []
  } catch (error) {
    console.error('Fetch WhatsApp schedules error:', error)
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    phone_number: '',
    is_active: true,
  }
}

const createRecipient = async () => {
  if (!form.value.name.trim() || !form.value.phone_number.trim()) {
    showToast('Nama dan nomor wajib diisi.', 'warning')
    return
  }

  isSaving.value = true
  try {
    await post('/whatsapp-reports/recipients', form.value)
    showToast('Nomor WhatsApp berhasil disimpan.', 'success')
    resetForm()
    await fetchRecipients()
  } catch (error) {
    console.error('Create WhatsApp recipient error:', error)
  } finally {
    isSaving.value = false
  }
}

const createSchedule = async () => {
  if (!scheduleForm.value.scheduled_time) {
    showToast('Jam kirim wajib diisi.', 'warning')
    return
  }

  isScheduleSaving.value = true
  try {
    await post('/whatsapp-reports/schedules', scheduleForm.value)
    showToast('Jadwal kirim berhasil disimpan.', 'success')
    await fetchSchedules()
  } catch (error) {
    console.error('Create WhatsApp schedule error:', error)
  } finally {
    isScheduleSaving.value = false
  }
}

const toggleScheduleStatus = async (schedule) => {
  try {
    await put(`/whatsapp-reports/schedules/${schedule.schedule_id}`, {
      is_active: Number(schedule.is_active) !== 1,
    })
    await fetchSchedules()
  } catch (error) {
    console.error('Toggle schedule status error:', error)
  }
}

const deleteSchedule = async (schedule) => {
  const result = await showConfirm(
    'Hapus Jadwal',
    `Hapus jadwal kirim jam ${schedule.scheduled_time}?`,
    'warning',
    'Ya, Hapus',
  )

  if (!result.isConfirmed) return

  try {
    await del(`/whatsapp-reports/schedules/${schedule.schedule_id}`)
    showToast('Jadwal kirim berhasil dihapus.', 'success')
    await fetchSchedules()
  } catch (error) {
    console.error('Delete WhatsApp schedule error:', error)
  }
}

const toggleRecipientStatus = async (recipient) => {
  try {
    await put(`/whatsapp-reports/recipients/${recipient.recipient_id}`, {
      is_active: Number(recipient.is_active) !== 1,
    })
    await fetchRecipients()
  } catch (error) {
    console.error('Toggle recipient status error:', error)
  }
}

const deleteRecipient = async (recipient) => {
  const result = await showConfirm(
    'Hapus Nomor',
    `Hapus nomor ${recipient.name}?`,
    'warning',
    'Ya, Hapus',
  )

  if (!result.isConfirmed) return

  try {
    await del(`/whatsapp-reports/recipients/${recipient.recipient_id}`)
    selectedRecipientIds.value = selectedRecipientIds.value.filter((id) => id !== recipient.recipient_id)
    showToast('Nomor WhatsApp berhasil dihapus.', 'success')
    await fetchRecipients()
  } catch (error) {
    console.error('Delete WhatsApp recipient error:', error)
  }
}

const toggleSelectAllActive = () => {
  if (selectedRecipientIds.value.length === activeRecipients.value.length) {
    selectedRecipientIds.value = []
    return
  }

  selectedRecipientIds.value = activeRecipients.value.map((recipient) => recipient.recipient_id)
}

const sendDailyProfitReport = async () => {
  const targetText =
    selectedCount.value > 0
      ? `${selectedCount.value} nomor terpilih`
      : `semua nomor aktif (${activeRecipients.value.length})`

  const result = await showConfirm(
    'Kirim Laporan?',
    `Generate PDF keuntungan harian hari ini dan kirim ke ${targetText}.`,
    'question',
    'Kirim',
  )

  if (!result.isConfirmed) return

  isSending.value = true
  lastSendResult.value = null
  try {
    const response = await post('/whatsapp-reports/daily-profit/send', {
      date: today,
      recipient_ids: selectedRecipientIds.value,
    })
    lastSendResult.value = response
    showAlert(
      'Selesai',
      `Terkirim: ${response.sent || 0}, gagal: ${response.failed || 0}`,
      response.failed > 0 ? 'warning' : 'success',
    )
  } catch (error) {
    console.error('Send daily profit report error:', error)
  } finally {
    isSending.value = false
  }
}

onMounted(() => {
  fetchRecipients()
  fetchSchedules()
})
</script>

<template>
  <div class="mx-auto space-y-4 px-3 py-4 sm:px-4">
    <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">WhatsApp</p>
          <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">Kirim Laporan Keuntungan</h1>
          <p class="mt-1 text-sm text-gray-500">
            Generate PDF keuntungan harian tiap toko lalu kirim ke nomor WhatsApp terdaftar.
          </p>
        </div>
        <div class="grid gap-2 sm:flex">
          <button
            type="button"
            class="rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            :disabled="isDownloadingPdf"
            @click="generateAndDownloadPdf"
          >
            {{ isDownloadingPdf ? 'Membuat PDF...' : 'Download PDF' }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-gray-300"
            :disabled="isSending || activeRecipients.length === 0"
            @click="sendDailyProfitReport"
          >
            {{ isSending ? 'Mengirim...' : 'Generate & Kirim' }}
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div class="space-y-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-base font-bold text-gray-900">Daftar Nomor</h2>
          <p class="mt-1 text-xs text-gray-500">Hanya role admin yang dapat mengelola penerima.</p>

          <form class="mt-4 space-y-3" @submit.prevent="createRecipient">
            <label class="block">
              <span class="text-xs font-bold text-gray-700">Nama</span>
              <input v-model="form.name" type="text"
                class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Contoh: Owner" />
            </label>

            <label class="block">
              <span class="text-xs font-bold text-gray-700">Nomor WhatsApp</span>
              <input v-model="form.phone_number" type="tel" inputmode="tel"
                class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="081234567890" />
            </label>

            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300" />
              Aktif menerima laporan
            </label>

            <button type="submit"
              class="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              :disabled="isSaving">
              {{ isSaving ? 'Menyimpan...' : 'Simpan Nomor' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-base font-bold text-gray-900">Jadwal Otomatis</h2>
          <p class="mt-1 text-xs text-gray-500">
            Sistem akan kirim PDF otomatis setiap hari pada jam yang aktif.
          </p>

          <form class="mt-4 space-y-3" @submit.prevent="createSchedule">
            <label class="block">
              <span class="text-xs font-bold text-gray-700">Jam Kirim</span>
              <input v-model="scheduleForm.scheduled_time" type="time"
                class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500" />
            </label>

            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="scheduleForm.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300" />
              Aktifkan jadwal
            </label>

            <button type="submit"
              class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              :disabled="isScheduleSaving">
              {{ isScheduleSaving ? 'Menyimpan...' : 'Simpan Jadwal' }}
            </button>
          </form>

          <div v-if="schedules.length === 0" class="mt-4 text-sm text-gray-500">
            Belum ada jadwal otomatis.
          </div>

          <div v-else class="mt-4 space-y-2">
            <article v-for="schedule in schedules" :key="schedule.schedule_id"
              class="rounded-xl border border-gray-200 p-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-lg font-bold text-gray-900">{{ schedule.scheduled_time }}</p>
                  <p class="text-xs text-gray-500">WIB / Asia Jakarta</p>
                </div>
                <span class="rounded-full px-2 py-1 text-[10px] font-bold" :class="Number(schedule.is_active) === 1
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
                  ">
                  {{ Number(schedule.is_active) === 1 ? 'Aktif' : 'Nonaktif' }}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button type="button"
                  class="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700"
                  @click="toggleScheduleStatus(schedule)">
                  {{ Number(schedule.is_active) === 1 ? 'Nonaktifkan' : 'Aktifkan' }}
                </button>
                <button type="button" class="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                  @click="deleteSchedule(schedule)">
                  Hapus
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" class="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700"
              @click="toggleSelectAllActive">
              {{ selectedRecipientIds.length === activeRecipients.length ? 'Batal Pilih' : 'Pilih Semua Aktif' }}
            </button>
            <p class="text-xs text-gray-500">
              Laporan memakai tanggal hari ini otomatis. Jadwal harian tetap mengikuti jam yang Anda tentukan.
            </p>
          </div>

          <div class="mt-3 grid gap-2 sm:flex sm:items-center sm:justify-between">
            <p class="text-xs text-gray-500">
              Jika tidak memilih nomor, laporan akan dikirim ke semua nomor aktif.
            </p>
            <button
              type="button"
              class="rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              :disabled="isDownloadingPdf"
              @click="generateAndDownloadPdf"
            >
              {{ isDownloadingPdf ? 'Membuat PDF...' : 'Download PDF' }}
            </button>
          </div>

          <div
            v-if="lastSendResult?.pdf_url"
            class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                  PDF Terakhir
                </p>
                <p class="mt-1 text-sm font-bold text-blue-950">
                  {{ latestPdfFileName }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-2 sm:flex">
                <a
                  :href="lastSendResult.pdf_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white"
                >
                  Lihat PDF
                </a>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-800 ring-1 ring-blue-200"
                  @click="downloadLatestPdf"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900">Penerima</h2>
            <button type="button" class="text-xs font-bold text-blue-600" @click="fetchRecipients">
              Refresh
            </button>
          </div>

          <div v-if="isLoading" class="py-8 text-center text-sm text-gray-500">Memuat nomor...</div>
          <div v-else-if="recipients.length === 0" class="py-8 text-center text-sm text-gray-500">
            Belum ada nomor WhatsApp.
          </div>

          <div v-else class="mt-4 space-y-3">
            <article v-for="recipient in recipients" :key="recipient.recipient_id"
              class="rounded-2xl border border-gray-200 p-3">
              <div class="flex items-start gap-3">
                <input v-model="selectedRecipientIds" type="checkbox" class="mt-1 h-4 w-4 rounded border-gray-300"
                  :value="recipient.recipient_id" :disabled="Number(recipient.is_active) !== 1" />

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate text-sm font-bold text-gray-900">{{ recipient.name }}</p>
                    <span class="rounded-full px-2 py-1 text-[10px] font-bold" :class="Number(recipient.is_active) === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                      ">
                      {{ Number(recipient.is_active) === 1 ? 'Aktif' : 'Nonaktif' }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">{{ formatPhone(recipient.phone_number) }}</p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button type="button"
                  class="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700"
                  @click="toggleRecipientStatus(recipient)">
                  {{ Number(recipient.is_active) === 1 ? 'Nonaktifkan' : 'Aktifkan' }}
                </button>
                <button type="button" class="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                  @click="deleteRecipient(recipient)">
                  Hapus
                </button>
              </div>
            </article>
          </div>
        </div>

        <div v-if="lastSendResult" class="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p class="font-bold">Hasil Pengiriman</p>
          <p class="mt-1">Terkirim: {{ lastSendResult.sent }} | Gagal: {{ lastSendResult.failed }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <a
              :href="lastSendResult.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white"
            >
              Lihat PDF
            </a>
            <button
              type="button"
              class="inline-flex rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-800 ring-1 ring-blue-200"
              @click="downloadLatestPdf"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
