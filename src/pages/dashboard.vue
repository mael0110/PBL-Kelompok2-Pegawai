<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted, computed } from "vue";
import { CalendarDays, User, Users, Clock, CalendarClock } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { presensiService } from "../services/presensi";
import { kelasService } from "../services/kelas";

const router = useRouter();

const { presensiDosen } = presensiService();
const { getAllSesiDosen, updateJadwal } = kelasService();

const today = new Date();

const tanggalHariIni = today.toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// --- STATE INTEGRASI KALENDER & API ---
const listSemuaSesi = ref([]);
const currentDate = ref(new Date());
const selectedDate = ref(new Date()); 

// STATE: Mengelola Popup Buka Sesi
const showModalBukaSesi = ref(false);
const topikKelas = ref("");
const selectedJadwal = ref({
  id: "",
  mataKuliah: "",
  number: "",
  class_id: "",
  pengampu_id: "",
  course_code: ""
});

// --- STATE: NOTIFIKASI POP-UP (TOAST) ---
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("error"); // 'success' | 'error' | 'warning'

// Fungsi pemicu pop-up pengganti alert
const pemicuToast = (message, type = "error") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// Helper format tanggal dua digit (YYYY-MM-DD)
const formatKeYYYYMMDD = (tahun, bulan, tanggal) => {
  const mm = String(bulan + 1).padStart(2, '0');
  const dd = String(tanggal).padStart(2, '0');
  return `${tahun}-${mm}-${dd}`;
};

// --- FUNGSI HELPER: Menentukan UI Status Tombol ---
const dapatkanUiStatus = (sesi) => {
  if (sesi.status === "opened") {
    return "Berjalan";
  } else if (sesi.status === "closed") {
    if (sesi.topic && sesi.topic !== "" && sesi.topic !== "-") {
      return "Selesai";
    } else {
      return "Terjadwal";
    }
  }
  return "Terjadwal";
};

// --- COMPUTED: JADWAL KELAS HARI INI (DINAMIS DARI API) ---
const jadwalKelasHariIniDinamis = computed(() => {
  const tanggalHariIniString = formatKeYYYYMMDD(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  return listSemuaSesi.value.filter(sesi => sesi.session_date === tanggalHariIniString);
});

// FUNGSI MERGE ALL PAGES JADWAL DOSEN
const fetchSesiKalender = async () => {
  try {
    listSemuaSesi.value = []; 
    let tempCombinedData = [];

    const firstPageResult = await getAllSesiDosen(null, 1);
    
    if (firstPageResult && firstPageResult.success) {
      const dataHalaman1 = firstPageResult.data || [];
      tempCombinedData = [...tempCombinedData, ...dataHalaman1];

      const lastPage = firstPageResult.meta?.last_page || 1;

      for (let currentPage = 2; currentPage <= lastPage; currentPage++) {
        const nextPageResult = await getAllSesiDosen(null, currentPage);
        if (nextPageResult && nextPageResult.success) {
          const dataHalamanSisa = nextPageResult.data || [];
          tempCombinedData = [...tempCombinedData, ...dataHalamanSisa];
        }
      }

      listSemuaSesi.value = tempCombinedData;
    }
  } catch (err) {
    console.error("Gagal memuat sesi kalender:", err);
  }
};

const namaBulan = computed(() =>
  currentDate.value.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
);

const daysInMonth = computed(() => {
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth();
  return new Date(y, m + 1, 0).getDate();
});

const firstDay = computed(() => {
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth();
  return new Date(y, m, 1).getDay();
});

const kalenderDays = computed(() => {
  const days = [];
  for (let i = 0; i < firstDay.value; i++) days.push(null);
  for (let i = 1; i <= daysInMonth.value; i++) days.push(i);
  return days;
});

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const pilihTanggal = (day) => {
  if (!day) return;
  selectedDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), day);
};

const cekJadwalMengajar = (day) => {
  if (!day) return false;
  const tanggalString = formatKeYYYYMMDD(currentDate.value.getFullYear(), currentDate.value.getMonth(), day);
  return listSemuaSesi.value.some(sesi => sesi.session_date === tanggalString);
};

const infoJadwalTerpilih = computed(() => {
  if (!selectedDate.value) return [];
  const tanggalString = formatKeYYYYMMDD(
    selectedDate.value.getFullYear(),
    selectedDate.value.getMonth(),
    selectedDate.value.getDate()
  );
  return listSemuaSesi.value.filter(sesi => sesi.session_date === tanggalString);
});

const labelHariTerpilih = computed(() => {
  if (!selectedDate.value) return "";
  return selectedDate.value.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
});

const handleSesiClick = (sesi) => {
  if (!sesi) return;
  
  const uiStatus = dapatkanUiStatus(sesi);

  if (uiStatus === 'Berjalan' || uiStatus === 'Selesai') {
    router.push({
      path: "/detail-sesi",
      query: {
        id: sesi.id,
        class_id: sesi.class_id,
        classId: sesi.class_id,
        pengampuId: sesi.pengampu_id,
        kode: sesi.course_code
      }
    });
  } else {
    selectedJadwal.value = {
      id: sesi.id,
      mataKuliah: sesi.course_name,
      number: sesi.session_number,
      class_id: sesi.class_id,
      pengampu_id: sesi.pengampu_id,
      course_code: sesi.course_code
    };
    topikKelas.value = (sesi.topic && sesi.topic !== "-") ? sesi.topic : "";
    showModalBukaSesi.value = true;
  }
};

const bukaSesiPerkuliahan = async () => {
  if (!topikKelas.value.trim()) {
    pemicuToast("Mohon masukkan topik kelas terlebih dahulu!", "warning");
    return;
  }

  try {
    const payload = { topic: topikKelas.value, status: "opened" };
    const res = await updateJadwal(selectedJadwal.value.id, payload);

    if (res?.success || res?.code === 200 || res?.status === 200) {
      showModalBukaSesi.value = false;
      topikKelas.value = "";
      router.push({
        path: "/detail-sesi",
        query: {
          id: selectedJadwal.value.id,
          class_id: selectedJadwal.value.class_id,
          classId: selectedJadwal.value.class_id,
          pengampuId: selectedJadwal.value.pengampu_id,
          kode: selectedJadwal.value.course_code
        }
      });
    } else {
      pemicuToast("Gagal mengaktifkan sesi perkuliahan.", "error");
    }
  } catch (error) {
    console.error("❌ Gagal buka sesi via dashboard:", error);
    const pesanServer = error.response?.data?.errors?.status?.[0] || error.message;
    pemicuToast(`Gagal membuka sesi. Pesan: ${pesanServer}`, "error");
  }
};

const closeModalBukaSesi = () => {
  showModalBukaSesi.value = false;
  selectedJadwal.value = { id: "", mataKuliah: "", number: "", class_id: "", pengampu_id: "", course_code: "" };
  topikKelas.value = "";
};

// --- LOGIKA PRESENSI DOSEN ---
const sudahPresensi = ref(false);
const loadingPresensi = ref(false);
const showPresensiModal = ref(false);
const statusPresensi = ref("");

const todayKey = new Date().toISOString().split("T")[0];

const submitPresensi = async () => {
  if (!statusPresensi.value) return;

  loadingPresensi.value = true;

  try {
    const mapStatus = {
      hadir: "hadir",
      izin: "izin",
      sakit: "sakit",
      alpha: "alpha"
    };

    const payload = {
      status: mapStatus[statusPresensi.value] || "alpha"
    };

    console.log("SEND PAYLOAD PRESENSI:", payload);

    const res = await presensiDosen(payload);

    console.log("STATUS RAW:", statusPresensi.value);
    console.log("STATUS SEND:", payload.status);

    if (res?.success || res) {
      sudahPresensi.value = true;
      localStorage.setItem("presensi_dosen_hari_ini", todayKey);
      showPresensiModal.value = false;
      statusPresensi.value = "";
      await fetchSesiKalender();
    }

  } catch (error) {
    console.error("Error submit presensi:", error);
  } finally {
    loadingPresensi.value = false;
  }
};

onMounted(() => {
  fetchSesiKalender();
  const saved = localStorage.getItem("presensi_dosen_hari_ini");
  if (saved === todayKey) {
    sudahPresensi.value = true;
  }
});
</script>

<template>
  <adminLayout>
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-[-20px] opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showToast" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center min-w-[280px] justify-center">
        <div 
          :class="[
            toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
            toastType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
            'bg-red-50 border-red-200 text-red-800'
          ]"
          class="w-full h-full flex items-center justify-center px-4 py-2.5 rounded-lg border shadow-md text-[11px] font-semibold"
        >
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </transition>

    <!-- Header Dashboard Ringkas -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-lg font-bold">Selamat Datang, Dosen Pengampu!</h1>
        <p class="text-[11px] text-gray-500">Berikut jadwal dan aktivitas Anda hari ini</p>
      </div>

      <!-- Informasi Hari Dikecilkan Padding & Text-nya -->
      <div class="bg-white px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 border border-gray-100">
        <CalendarDays class="w-4 h-4" />
        <p class="font-semibold text-[11px]">{{ tanggalHariIni }}</p>
      </div>
    </div>

    <div class="flex gap-4 items-start">
      <!-- Kolom Kiri -->
      <div class="w-[590px] space-y-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5">
          <h1 class="text-xs font-bold mb-2.5 tracking-wide">JADWAL KELAS HARI INI</h1>

          <div class="space-y-2">
            <div
              v-for="sesi in jadwalKelasHariIniDinamis"
              :key="sesi.id"
              class="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100/70">
              <div>
                <h3 class="font-bold text-[11px] text-gray-800 mb-1 uppercase tracking-tight">
                  {{ sesi.course_name }} ({{ sesi.class_name }})
                </h3>
                <div class="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
                  <Clock class="w-3 h-3 text-gray-400" />
                  <span>{{ sesi.start_time.substring(0,5) }} - {{ sesi.end_time.substring(0,5) }} WIB</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <User class="w-3 h-3 text-gray-400" />
                  <span>Sesi ke-{{ sesi.session_number }}</span>
                </div>
              </div>

              <button 
                @click="handleSesiClick(sesi)" 
                class="bg-blue-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-800 transition"
              >
                {{ dapatkanUiStatus(sesi) === 'Terjadwal' ? 'Buka Sesi' : 'Lihat Sesi' }}
              </button>
            </div>

            <div v-if="jadwalKelasHariIniDinamis.length === 0" class="text-center py-5 text-gray-400 text-[10px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
              Tidak ada jadwal mengajar untuk hari ini.
            </div>
          </div>

          <div class="text-right mt-2.5">
            <button @click="$router.push('/kelas')" class="text-blue-900 text-[11px] font-semibold hover:text-blue-700">
              Lihat Semua Jadwal &gt;
            </button>
          </div>
        </div>

        <!-- Box Presensi Dosen Lebih Pendek (h-[250px] -> h-[210px]) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[210px] flex flex-col justify-between">
          <div>
            <p class="text-gray-400 text-[10px] mb-0.5">Presensi Kehadiran Dosen</p>
            <p class="text-xs font-semibold">{{ tanggalHariIni }}</p>
          </div>
          
          <div class="flex justify-center my-1">
            <div v-if="!sudahPresensi" class="w-11 h-11 bg-amber-500 rounded-full flex items-center justify-center shadow-inner">
              <span class="text-white text-xl font-bold">!</span>
            </div>
            <div v-else class="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shadow-inner">
              <span class="text-white text-lg font-bold">✓</span>
            </div>
          </div>

          <p class="text-center text-xs font-semibold">
            {{ sudahPresensi ? "Anda sudah melakukan presensi hari ini" : "Anda belum melakukan presensi hari ini" }}
          </p>
          
          <div class="flex justify-center">
            <button
              @click="showPresensiModal = true"
              :disabled="sudahPresensi || loadingPresensi"
              class="w-full bg-blue-900 text-white py-1.5 rounded-md text-[11px] font-semibold disabled:bg-gray-200 disabled:text-gray-400 transition shadow-sm"
            >
              {{ loadingPresensi ? "Mengirim..." : "Klik Untuk Presensi Masuk" }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Kolom Kanan (Kalender) -->
      <div class="w-[440px] flex flex-col space-y-4">
        <div class="bg-white shadow-sm border border-gray-100 rounded-xl p-3.5">
          <h3 class="font-bold text-xs mb-2.5 tracking-wide">Kalender Akademik</h3>

          <!-- Navigasi Kalender Dikecilkan -->
          <div class="flex items-center justify-center gap-6 mb-2">
            <button @click="prevMonth" class="font-bold text-base text-gray-400 hover:text-blue-900 select-none cursor-pointer">‹</button>
            <h2 class="text-[11px] font-bold text-gray-700 uppercase tracking-wider w-24 text-center">{{ namaBulan }}</h2>
            <button @click="nextMonth" class="font-bold text-base text-gray-400 hover:text-blue-900 select-none cursor-pointer">›</button>
          </div>

          <div class="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1.5">
            <span class="text-red-500">Min</span><span>Sen</span><span>Sel</span><span>Rab</span>
            <span>Kam</span><span>Jum</span><span>Sab</span>
          </div>

          <!-- Grid Tombol Tanggal Lebih Rapat (h-9 -> h-7.5) -->
          <div class="grid grid-cols-7 text-center gap-y-1">
            <div v-for="(day, index) in kalenderDays" :key="index" class="flex flex-col items-center justify-center relative h-7.5">
              <button
                v-if="day"
                @click="pilihTanggal(day)"
                class="w-7 h-7 rounded-full text-[11px] flex items-center justify-center transition-all focus:outline-none relative"
                :class="selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear()
                  ? 'bg-green-600 text-white font-bold shadow-sm' 
                  : 'hover:bg-blue-50 text-gray-800 font-medium'"
              >
                {{ day }}
              </button>
              
              <span 
                v-if="day && cekJadwalMengajar(day)" 
                class="w-1 h-1 bg-red-500 rounded-full absolute bottom-0"
              ></span>
              
              <div v-else-if="!day" class="w-7 h-7"></div>
            </div>
          </div>

          <hr class="my-3 border-gray-100" />
          
          <!-- Jadwal Terpilih Di Bawah Kalender -->
          <div class="mt-1">
            <p class="text-gray-400 text-[10px] font-medium uppercase tracking-wide">Jadwal Kelas Terpilih</p>
            <p class="text-xs font-bold mb-2">{{ labelHariTerpilih }}</p>

            <div class="space-y-2">
              <div 
                v-for="sesi in infoJadwalTerpilih" 
                :key="sesi.id" 
                class="bg-gray-50/50 border border-gray-100 rounded-lg p-2.5 flex justify-between items-start hover:bg-gray-50 transition"
              >
                <div class="space-y-0.5">
                  <h4 class="font-bold text-[11px] text-gray-800 uppercase tracking-tight">{{ sesi.course_name }}</h4>
                  
                  <div class="flex items-center gap-1.5 text-gray-500 text-[10px]">
                    <Users class="w-3 h-3 text-gray-400" />
                    <span>Kelas {{ sesi.class_name }}</span>
                  </div>
                  
                  <div class="flex items-center gap-1.5 text-gray-500 text-[10px]">
                    <Clock class="w-3 h-3 text-gray-400" />
                    <span>{{ sesi.start_time.substring(0,5) }} - {{ sesi.end_time.substring(0,5) }} WIB</span>
                  </div>
                  
                  <p class="text-[10px] text-blue-900 font-medium pt-0.5">
                    Sesi ke-{{ sesi.session_number }} : <span class="text-gray-500 font-normal italic">"{{ sesi.topic || 'Belum diisi topik' }}"</span>
                  </p>
                </div>

                <div class="text-right flex flex-col items-end justify-between h-full min-h-[52px]">
                  <span class="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded">
                    R. H-205
                  </span>
                  <button 
                    @click="handleSesiClick(sesi)"
                    class="bg-blue-900 text-white text-[9px] font-bold px-2.5 py-1 rounded shadow-sm hover:bg-blue-800 transition"
                  >
                    {{ dapatkanUiStatus(sesi) === 'Terjadwal' ? 'Buka Sesi' : 'Lihat Sesi' }}
                  </button>
                </div>
              </div>

              <div v-if="infoJadwalTerpilih.length === 0" class="text-center py-5 text-gray-400 text-[10px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Tidak ada jadwal mengajar pada tanggal ini.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Status Kehadiran Presensi -->
    <div v-if="showPresensiModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white w-full max-w-[260px] p-4 rounded-xl shadow-xl relative border border-gray-100">
        <button class="absolute top-1.5 right-2.5 text-gray-400 hover:text-black text-lg" @click="showPresensiModal = false">×</button>
        <h2 class="text-center font-bold text-xs text-gray-800 mb-2.5">Pilih Status Kehadiran</h2>
        
        <select v-model="statusPresensi" class="w-full border border-gray-200 bg-white p-1.5 rounded-md mb-3 text-[11px] outline-none focus:border-blue-900 text-gray-700">
          <option disabled value="">-- Pilih Status --</option>
          <option value="hadir">Hadir</option>
          <option value="izin">Izin</option>
          <option value="sakit">Sakit</option>
        </select>
        
        <button @click="submitPresensi" class="w-full bg-blue-900 text-white py-1.5 rounded-md text-[11px] font-bold disabled:bg-gray-200 shadow-sm" :disabled="!statusPresensi">
          Kirim Data Presensi
        </button>
      </div>
    </div>

    <!-- Modal Buka Sesi -->
    <div v-if="showModalBukaSesi" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white w-full max-w-[340px] rounded-xl p-5 relative shadow-xl border border-gray-100">
        <button @click="closeModalBukaSesi" class="absolute top-2 right-3.5 text-gray-400 text-lg font-bold hover:text-black">×</button>

        <div class="flex justify-center mb-1.5">
          <CalendarClock class="w-10 h-10" />
        </div>

        <h2 class="text-center text-sm font-bold text-slate-800 mb-3">Buka Sesi Perkuliahan</h2>

        <div class="rounded-lg p-2.5 mb-3 bg-gray-50 border border-gray-200">
          <h3 class="font-bold text-xs text-gray-800 leading-tight mb-0.5">{{ selectedJadwal.mataKuliah }}</h3>
          <p class="text-[10px] text-gray-400 mb-2">Sesi ke-{{ selectedJadwal.number }}</p>
          <label class="block text-[10px] font-semibold mb-1 text-gray-600">Topik Pembelajaran</label>
          <input
            v-model="topikKelas"
            type="text"
            placeholder="Masukkan topik perkuliahan hari ini..."
            class="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[11px] outline-none bg-white focus:border-blue-900"
          />
        </div>

        <p class="text-center text-[10px] text-gray-500 mb-4 leading-normal">Apakah Anda yakin ingin membuka sesi?<br/><span class="text-[9px] text-gray-400">Mahasiswa dapat absen setelah sesi aktif.</span></p>

        <div class="flex gap-2">
          <button @click="closeModalBukaSesi" class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 rounded-md text-[11px] transition">Batal</button>
          <button @click="bukaSesiPerkuliahan" class="w-full bg-blue-900 text-white font-semibold py-1.5 rounded-md text-[11px] hover:bg-blue-800 transition">Buka Sesi</button>
        </div>
      </div>
    </div>
  </adminLayout>
</template>