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

// Data Rekap Absensi Mahasiswa
const presensi = [
  { label: "Hadir", jumlah: 95, persen: "79%", width: "79%", color: "bg-green-500" },
  { label: "Sakit", jumlah: 5, persen: "1%", width: "10%", color: "bg-blue-300" },
  { label: "Izin", jumlah: 7, persen: "6%", width: "15%", color: "bg-yellow-400" },
  { label: "Alpha", jumlah: 7, persen: "6%", width: "15%", color: "bg-red-500" },
];

// --- STATE INTEGRASI KALENDER & API ---
const listSemuaSesi = ref([]);
const currentDate = ref(new Date());
const selectedDate = ref(new Date()); 

// 🟢 STATE BARU: Untuk Mengelola Popup Buka Sesi
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

// Helper format tanggal dua digit (YYYY-MM-DD) agar cocok dengan database
const formatKeYYYYMMDD = (tahun, bulan, tanggal) => {
  const mm = String(bulan + 1).padStart(2, '0');
  const dd = String(tanggal).padStart(2, '0');
  return `${tahun}-${mm}-${dd}`;
};

// --- FUNGSI HELPER: Menentukan UI Status Tombol (Sama persis dengan detail-kelas.vue) ---
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
      console.log("Berhasil menggabungkan seluruh halaman sesi:", listSemuaSesi.value.length);
    }
  } catch (err) {
    console.error("Gagal memuat atau menggabungkan halaman sesi kalender:", err);
  }
};

// Logika pembentukan struktur kalender
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

// TRIGGER TITIK MERAH
const cekJadwalMengajar = (day) => {
  if (!day) return false;
  const tanggalString = formatKeYYYYMMDD(currentDate.value.getFullYear(), currentDate.value.getMonth(), day);
  return listSemuaSesi.value.some(sesi => sesi.session_date === tanggalString);
};

// Filter data sesi yang muncul di bawah kalender berdasarkan klik tanggal
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

// 🟢 LOGIKA HANDLER KLIK TOMBOL (Menyamakan alur dengan detail-kelas.vue)
const handleSesiClick = (sesi) => {
  if (!sesi) return;

  const uiStatus = mendapatkanUiStatus(sesi);

  if (uiStatus === 'Berjalan' || uiStatus === 'Selesai') {
    // Alur langsung navigasi jika kelas sedang/sudah selesai dibuka
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
    // Alur memunculkan Pop Up input topik jika statusnya 'Terjadwal' (Belum pernah dibuka)
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

// 🟢 FUNGSI SUBMIT UNTUK AKTIVASI/BUKA SESI PERKULIAHAN
const bukaSesiPerkuliahan = async () => {
  if (!topikKelas.value.trim()) {
    alert("Mohon masukkan topik kelas terlebih dahulu!");
    return;
  }

  try {
    const payload = { 
      topic: topikKelas.value,
      status: "opened"
    };

    const res = await updateJadwal(selectedJadwal.value.id, payload);

    if (res?.success || res?.code === 200 || res?.status === 200) {
      showModalBukaSesi.value = false;
      topikKelas.value = "";

      // Lempar langsung ke page detail sesi setelah sukses diaktifkan
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
      alert("Gagal mengaktifkan sesi perkuliahan.");
    }
  } catch (error) {
    console.error("❌ Gagal buka sesi via dashboard:", error);
    const pesanServer = error.response?.data?.errors?.status?.[0] || error.message;
    alert(`Gagal membuka sesi. Pesan: ${pesanServer}`);
  }
};

const closeModalBukaSesi = () => {
  showModalBukaSesi.value = false;
  selectedJadwal.value = { id: "", mataKuliah: "", number: "", class_id: "", pengampu_id: "", course_code: "" };
  topikKelas.value = "";
};

// --- LOGIKA PRESENSI DOSEN ASLI SEBELUMNYA ---
const sudahPresensi = ref(false);
const loadingPresensi = ref(false);
const showPresensiModal = ref(false);
const statusPresensi = ref("");

const todayKey = new Date().toISOString().split("T")[0];

const submitPresensi = async () => {
  if (!statusPresensi.value) return;

  loadingPresensi.value = true;

  try {
    const payload = {
      status: statusPresensi.value.trim().toLowerCase()
    };

    console.log("SEND PAYLOAD:", payload);

    const res = await presensiDosen(payload);

    if (res?.success || res) {
      sudahPresensi.value = true;
      localStorage.setItem("presensi_dosen_hari_ini", todayKey);
      showPresensiModal.value = false;
      statusPresensi.value = "";

      await fetchSesiKalender();
    }
  } catch (error) {
    console.error("Error submit presensi admin:", error);
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
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-[20px] font-semibold mb-2">Selamat Datang, Dosen Pengampu!</h1>
        <p class="text-[12px] font-normal text-gray-500">Berikut jadwal dan aktivitas Anda hari ini</p>
      </div>

      <div class="bg-white px-5 py-3 rounded-[10px] shadow-sm flex items-center gap-2 mb-8 border border-gray-100">
        <CalendarDays class="w-5 h-5 text-blue-900" />
        <p class="font-semibold text-[12px] text-gray-700">{{ tanggalHariIni }}</p>
      </div>
    </div>

    <div class="flex gap-5 items-start">
      <div class="w-[500px] space-y-5">
        <div class="bg-white rounded-[10px] shadow-sm border border-gray-100 p-4">
          <h1 class="text-[14px] font-bold text-gray-800 mb-3">JADWAL KELAS HARI INI</h1>

          <div class="space-y-3">
            <div
              v-for="sesi in jadwalKelasHariIniDinamis"
              :key="sesi.id"
              class="bg-gray-50 rounded-[8px] p-4 flex justify-between items-center border border-gray-100">
              <div>
                <h3 class="font-bold text-[12px] text-gray-800 mb-2 uppercase">
                  {{ sesi.course_name }} ({{ sesi.class_name }})
                </h3>
                <div class="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span>{{ sesi.start_time.substring(0,5) }} - {{ sesi.end_time.substring(0,5) }} WIB</span>
                </div>
                <div class="flex items-center gap-2 text-[11px] text-gray-500">
                  <User class="w-3.5 h-3.5 text-gray-400" />
                  <span>Sesi ke-{{ sesi.session_number }}</span>
                </div>
              </div>

              <button 
                @click="handleSesiClick(sesi)" 
                class="bg-blue-900 text-white text-[11px] font-semibold px-4 py-2 rounded-[6px] shadow-sm hover:bg-blue-800 transition"
              >
                {{ dapatkanUiStatus(sesi) === 'Terjadwal' ? 'Buka Sesi' : 'Lihat Sesi' }}
              </button>
            </div>

            <div v-if="jadwalKelasHariIniDinamis.length === 0" class="text-center py-6 text-gray-400 text-[11px] bg-gray-50 rounded-[8px] border border-dashed border-gray-200">
              Tidak ada jadwal mengajar untuk hari ini.
            </div>
          </div>

          <div class="text-right mt-3">
            <button @click="$router.push('/kelas')" class="text-blue-900 text-[12px] font-semibold hover:text-blue-700">
              Lihat Semua Jadwal &gt;
            </button>
          </div>
        </div>

        <div class="bg-white rounded-[10px] shadow-sm border border-gray-100 p-5 h-[250px] flex flex-col justify-between">
          <div>
            <p class="text-gray-400 text-[11px] mb-0.5">Presensi Kehadiran Dosen</p>
            <p class="text-[13px] font-semibold text-gray-700">{{ tanggalHariIni }}</p>
          </div>
          
          <div class="flex justify-center my-2">
            <div v-if="!sudahPresensi" class="w-[60px] h-[60px] bg-amber-500 rounded-full flex items-center justify-center shadow-inner">
              <span class="text-white text-[32px] font-bold">!</span>
            </div>
            <div v-else class="w-[60px] h-[60px] bg-green-500 rounded-full flex items-center justify-center shadow-inner">
              <span class="text-white text-[28px] font-bold">✓</span>
            </div>
          </div>

          <p class="text-center text-[13px] font-semibold text-gray-700">
            {{ sudahPresensi ? "Anda sudah melakukan presensi hari ini" : "Anda belum melakukan presensi hari ini" }}
          </p>
          
          <div class="flex justify-center">
            <button
              @click="showPresensiModal = true"
              :disabled="sudahPresensi || loadingPresensi"
              class="w-full bg-blue-900 text-white py-2 rounded-[6px] text-[12px] font-semibold disabled:bg-gray-300 disabled:text-gray-500 transition shadow-sm"
            >
              {{ loadingPresensi ? "Mengirim..." : "Klik Untuk Presensi Masuk" }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="w-[500px] flex flex-col space-y-5">
        <div class="bg-white shadow-sm border border-gray-100 rounded-[10px] p-4">
          <h3 class="font-bold text-[14px] text-gray-800 mb-4">Kalender Akademik</h3>

          <div class="flex items-center justify-center gap-8 mb-4">
            <button @click="prevMonth" class="font-bold text-[18px] text-gray-400 hover:text-blue-900 select-none cursor-pointer">‹</button>
            <h2 class="text-[12px] font-bold text-gray-700 uppercase tracking-wider w-28 text-center">{{ namaBulan }}</h2>
            <button @click="nextMonth" class="font-bold text-[18px] text-gray-400 hover:text-blue-900 select-none cursor-pointer">›</button>
          </div>

          <div class="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 mb-2">
            <span class="text-red-500">Min</span><span>Sen</span><span>Sel</span><span>Rab</span>
            <span>Kam</span><span>Jum</span><span>Sab</span>
          </div>

          <div class="grid grid-cols-7 text-center gap-y-2">
            <div v-for="(day, index) in kalenderDays" :key="index" class="flex flex-col items-center justify-center relative h-9">
              <button
                v-if="day"
                @click="pilihTanggal(day)"
                class="w-8 h-8 rounded-full text-[12px] flex items-center justify-center transition-all focus:outline-none relative"
                :class="selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear()
                  ? 'bg-green-600 text-white font-bold shadow-sm' 
                  : 'hover:bg-blue-50 text-gray-800 font-medium'"
              >
                {{ day }}
              </button>
              
              <span 
                v-if="day && cekJadwalMengajar(day)" 
                class="w-[5px] h-[5px] bg-red-500 rounded-full absolute bottom-[1px]"
              ></span>
              
              <div v-else-if="!day" class="w-8 h-8"></div>
            </div>
          </div>

          <hr class="my-4 border-gray-100" />
          <div class="mt-2">
            <p class="text-gray-400 text-[11px] font-medium uppercase tracking-wide">Jadwal Kelas Terpilih</p>
            <p class="text-[13px] font-bold text-gray-800 mb-3">{{ labelHariTerpilih }}</p>

            <div class="space-y-3">
              <div 
                v-for="sesi in infoJadwalTerpilih" 
                :key="sesi.id" 
                class="bg-gray-50/50 border border-gray-100 rounded-[8px] p-3 flex justify-between items-start hover:bg-gray-50 transition"
              >
                <div class="space-y-1">
                  <h4 class="font-bold text-[12px] text-gray-800 uppercase">{{ sesi.course_name }}</h4>
                  
                  <div class="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <Users class="w-3.5 h-3.5 text-gray-400" />
                    <span>Kelas {{ sesi.class_name }}</span>
                  </div>
                  
                  <div class="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <Clock class="w-3.5 h-3.5 text-gray-400" />
                    <span>{{ sesi.start_time.substring(0,5) }} - {{ sesi.end_time.substring(0,5) }} WIB</span>
                  </div>
                  
                  <p class="text-[11px] text-blue-900 font-medium pt-1">
                    Sesi ke-{{ sesi.session_number }} : <span class="text-gray-600 font-normal italic">"{{ sesi.topic || 'Belum diisi topik' }}"</span>
                  </p>
                </div>

                <div class="text-right flex flex-col items-end justify-between h-full min-h-[60px]">
                  <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                    Ruang H-205
                  </span>
                  <button 
                    @click="handleSesiClick(sesi)"
                    class="bg-blue-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-[5px] shadow-sm hover:bg-blue-800 transition mt-3"
                  >
                    {{ dapatkanUiStatus(sesi) === 'Terjadwal' ? 'Buka Sesi' : 'Lihat Sesi' }}
                  </button>
                </div>
              </div>

              <div v-if="infoJadwalTerpilih.length === 0" class="text-center py-6 text-gray-400 text-[11px] bg-gray-50 rounded-[8px] border border-dashed border-gray-200">
                Tidak ada jadwal mengajar pada tanggal ini.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="showPresensiModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-[300px] p-5 rounded-[10px] shadow-xl relative border border-gray-100">
        <button class="absolute top-2 right-3 text-gray-400 hover:text-black text-[20px]" @click="showPresensiModal = false">×</button>
        <h2 class="text-center font-bold text-[14px] text-gray-800 mb-3">Pilih Status Kehadiran</h2>
        
        <select v-model="statusPresensi" class="w-full border border-gray-200 bg-white p-2 rounded-[6px] mb-4 text-[12px] outline-none focus:border-blue-900 text-gray-700">
          <option disabled value="">-- Pilih Status --</option>
          <option value="hadir">Hadir (Mengajar)</option>
          <option value="izin">Izin Resmi</option>
          <option value="sakit">Sakit</option>
        </select>
        
        <button @click="submitPresensi" class="w-full bg-blue-900 text-white py-2 rounded-[6px] text-[12px] font-bold disabled:bg-gray-300 shadow-sm" :disabled="!statusPresensi">
          Kirim Data Presensi
        </button>
      </div>
    </div>

    <div v-if="showModalBukaSesi" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white w-[420px] rounded-[8px] p-6 relative shadow-xl border border-gray-200">
        <button @click="closeModalBukaSesi" class="absolute top-3 right-4 text-gray-500 text-xl font-bold hover:text-black">×</button>

        <div class="flex justify-center mb-2">
          <CalendarClock class="w-12 h-12 text-blue-900" />
        </div>

        <h2 class="text-center text-[16px] font-bold mb-4">Buka Sesi Perkuliahan</h2>

        <div class="rounded-[6px] p-3 mb-4 bg-gray-50 border border-gray-200">
          <h3 class="font-bold text-[13px] text-gray-800">{{ selectedJadwal.mataKuliah }}</h3>
          <p class="text-[11px] text-gray-400 mb-2">Sesi ke-{{ selectedJadwal.number }}</p>
          <label class="block text-[11px] font-semibold mb-1 text-gray-700">Topik Pembelajaran</label>
          <input
            v-model="topikKelas"
            type="text"
            placeholder="Masukkan topik perkuliahan hari ini..."
            class="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none bg-white focus:border-blue-900"
          />
        </div>

        <p class="text-center text-[11px] text-gray-500 mb-5">Apakah Anda yakin ingin membuka sesi perkuliahan?<br/><span class="text-[10px] text-gray-400">Mahasiswa dapat mengisi daftar presensi setelah sesi diaktifkan.</span></p>

        <div class="flex gap-3">
          <button @click="closeModalBukaSesi" class="w-full border text-white font-semibold py-1.5 rounded text-[12px] hover:bg-red-400 bg-red-500">Batal</button>
          <button @click="bukaSesiPerkuliahan" class="w-full bg-blue-900 text-white font-semibold py-1.5 rounded text-[12px] hover:bg-blue-800">Buka Sesi</button>
        </div>
      </div>
    </div>
  </adminLayout>
</template>