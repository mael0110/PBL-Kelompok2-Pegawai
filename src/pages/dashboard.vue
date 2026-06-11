<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted, computed } from "vue";
import { CalendarDays, User, Users, ScanLine, CloudUpload, ChartNoAxesColumn, UserRound, Clock, MapPin, CalendarClock } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { presensiService } from "../services/presensi";
import { kelasService } from "../services/kelas";

const router = useRouter();

const { presensiDosen } = presensiService();
const { getSesiPengampu } = kelasService();

//tanggal hari ini
const today = new Date();

const tanggalHariIni = today.toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jadwalKelas = [
  {
    mataKuliah: "Administrasi Database (4A)",
    jam: "13:30 - 17:00",
    dosen: "Aqsal Habibi",
  },
  {
    mataKuliah: "Administrasi Database (4A)",
    jam: "13:30 - 17:00",
    dosen: "Aqsal Habibi",
  }
];

const presensi = [
  {
    label: "Hadir",
    jumlah: 95,
    persen: "79%",
    width: "79%",
    color: "bg-green-500",
  },
  {
    label: "Sakit",
    jumlah: 5,
    persen: "1%",
    width: "10%",
    color: "bg-blue-300",
  },
  {
    label: "Izin",
    jumlah: 7,
    persen: "6%",
    width: "15%",
    color: "bg-yellow-400",
  },
  {
    label: "Alpha",
    jumlah: 7,
    persen: "6%",
    width: "15%",
    color: "bg-red-500",
  },
];

//kalender
const currentDate = ref(new Date());
const selectedDate = ref(null);

// Nama bulan + tahun
const namaBulan = computed(() =>
  currentDate.value.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
);

// Jumlah hari di bulan sekarang
const daysInMonth = computed(() => {
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth();
  return new Date(y, m + 1, 0).getDate();
});

// Hari pertama bulan ini (0=Min)
const firstDay = computed(() => {
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth();
  return new Date(y, m, 1).getDay();
});

// Array kalender dengan null di awal sesuai hari pertama
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
  selectedDate.value = day;
};

//buka sesi perkuliahan
const topikKelas = ref("");
const showModal = ref(false);
const selectedJadwal = ref(null)

const openModal = (item) => {
  selectedJadwal.value = item;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  topikKelas.value = "";
};

const bukaSesi = () => {
  if (!topikKelas.value.trim()) {
    alert("Topik kelas wajib diisi");
    return;
  }

  router.push({
    path: "/detail-sesi",
    query: {
      mataKuliah: selectedJadwal.value.mataKuliah,
      kelas: "4A",
      dosen: selectedJadwal.value.dosen,
      jam: selectedJadwal.value.jam,
      topik: topikKelas.value,
    },
  });
};

//presensi dosen
const sudahPresensi = ref(false);
const loadingPresensi = ref(false);

// ambil tanggal hari ini untuk key localStorage
const todayKey = new Date().toISOString().split("T")[0];

// cek localStorage saat mounted
onMounted(() => {
  const presensiTersimpan = localStorage.getItem("presensi_dosen_hari_ini");
  if (presensiTersimpan === todayKey) {
    sudahPresensi.value = true;
  }
});

// fungsi presensi
const handlePresensi = async () => {
  if (sudahPresensi.value) return; // disable jika sudah presensi
  loadingPresensi.value = true;

  try {
    const response = await presensiDosen();

    if (response.success) {
      // set status
      sudahPresensi.value = true;

      // simpan ke localStorage supaya tetap stay walau refresh/logout
      localStorage.setItem("presensi_dosen_hari_ini", todayKey);
    }
  } catch (error) {
    console.error("Gagal presensi:", error.response?.data || error);
  } finally {
    loadingPresensi.value = false;
  }
};
</script>

<template>
  <adminLayout>
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-[20px] font-semibold mb-2">Selamat Datang, Budi Siregar!</h1>
        <p class="text-[12px] font-normal">Berikut jadwal dan aktivitas hari Ini</p>
      </div>

      <div class="card-dashboard bg-white px-5 py-3 rounded-[10px] shadow-md flex items-center gap-2 mb-8">
        <CalendarDays class="w-5 h-5" />
        <p class="font-semibold text-[12px]">{{ tanggalHariIni }}</p>
      </div>
    </div>

    <div class="flex gap-5 items-start">
      <!-- kiri -->
      <div class="w-[500px] space-y-5">
        <!-- jadwal kelas -->
        <div class="card-dashboard bg-white rounded-[3px] shadow-md p-4">
          <h1 class="text-[15px] font-bold mb-2">JADWAL KELAS HARI INI</h1>

          <div class="space-y-2">
            <div
              v-for="(item, index) in jadwalKelas"
              :key="index"
              class="bg-white rounded-[3px] shadow-md p-4 flex justify-between items-center">
              <div>
                <h3 class="font-bold text-[12px] mb-2">{{ item.mataKuliah }}</h3>
                <div class="flex items-center gap-2 text-[12px] mb-1">
                  <Clock class="w-4 h-4" />
                  <span>{{ item.jam }}</span>
                </div>

                <div class="flex items-center gap-2 text-[12px]">
                  <User class="w-4 h-4" />
                  <span>{{ item.dosen }}</span>
                </div>
              </div>

              <button @click="openModal(item)" class="bg-blue-900 text-white text-[12px] font-semibold px-5 py-2 rounded-[8px] shadow-md hover:bg-blue-800">
                Buka Sesi
              </button>
            </div>
          </div>

          <div class="text-right mt-2">
            <button @click="$router.push('/kelas')" class="text-blue-900 font-semibold hover:text-blue-700">
              Lihat Semua Jadwal &gt;
            </button>
          </div>
        </div>

        <!-- Presensi Dosen -->
        <div class="bg-white rounded-[10px] shadow-md p-6 w-full h-[260px]">
          <p class="text-gray-400 text-[12px] mb-1">Kelas Hari Ini</p>
          <p class="text-[15px] font-semibold mb-6">{{ new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }}</p>
          <div class="flex justify-center mb-4">
            <!-- belum -->
            <div
              v-if="!sudahPresensi"
              class="w-[70px] h-[70px] bg-red-500 rounded-full border-[5px] border-red-500 flex items-center justify-center"
            >
              <span class="text-white text-[42px] font-bold">
                ✕
              </span>
            </div>
            <!-- sudah -->
            <div
              v-else
              class="w-[70px] h-[70px] bg-green-500 rounded-full border-[5px] border-green-500 flex items-center justify-center"
            >
              <span class="text-white text-[42px] font-bold">
                ✓
              </span>
            </div>
          </div>

          <p class="text-center text-[16px] font-semibold mb-3">
            {{
              sudahPresensi
                ? "Kamu sudah presensi hari ini"
                : "Kamu belum presensi hari ini"
            }}
          </p>
          <div class="flex justify-center">
            <button
              @click="handlePresensi"
              :disabled="sudahPresensi || loadingPresensi"
              class="bg-blue-900 text-white px-8 py-2 rounded-[5px] text-[13px] font-semibold disabled:bg-gray-400"
            >
              {{ loadingPresensi ? "Mengirim..." : "Presensi" }}
            </button>
          </div>
        </div>

      </div>
      

      <!-- Kanan Dashboard -->
      <div class="w-[500px] flex flex-col space-y-5">

        <!-- Chart Presensi Mahasiswa -->
        <div class="bg-white rounded-[10px] shadow-md p-5">
          <h1 class="text-[15px] font-bold mb-1">REKAP PRESENSI HARI INI</h1>

          <!-- Total Mahasiswa -->
          <div class="card-dashboard bg-blue-50 shadow-sm rounded-[7px] p-1 flex items-center gap-3 mb-3 w-fit">
            <Users class="w-8 h-8" />
            <div>
              <p class="text-[12px] font-semibold">Total Mahasiswa</p>
              <p class="text-[12px] text-gray-600">120 Mahasiswa</p>
            </div>
          </div>

          <!-- Chart Presensi Detail -->
          <div class="space-y-4">
            <div v-for="(item, index) in presensi" :key="index" class="grid grid-cols-[70px_1fr_20px_30px] items-center gap-3">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :class="item.color"></div>
                <p class="text-[12px] font-semibold">{{ item.label }}</p>
              </div>

              <div class="w-full bg-gray-200 h-2 rounded-full">
                <div class="h-2 rounded-full" :class="item.color" :style="{ width: item.width }"></div>
              </div>

              <p class="text-[12px] font-semibold">{{ item.jumlah }}</p>
              <p class="text-[12px] font-semibold">{{ item.persen }}</p>
            </div>
          </div>
        </div>

        <!-- Kalender Akademik -->
        <div class="bg-white shadow rounded p-4">
          <h3 class="font-semibold text-[14px] mb-3">Kalender Akademik</h3>

          <!-- Header Bulan -->
          <div class="flex items-center justify-center gap-8 mb-4">
            <button @click="prevMonth" class="font-bold text-[14px]">‹</button>
            <h2 class="text-[12px] font-medium">{{ namaBulan }}</h2>
            <button @click="nextMonth" class="font-bold text-[14px]">›</button>
          </div>

          <!-- Nama Hari -->
          <div class="grid grid-cols-7 text-center text-[12px] mb-2">
            <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span>
            <span>Kam</span><span>Jum</span><span>Sab</span>
          </div>

          <!-- Tanggal Kalender -->
          <div class="grid grid-cols-7 text-center gap-y-2">
            <div v-for="(day, index) in kalenderDays" :key="index">
              <button
                v-if="day"
                @click="pilihTanggal(day)"
                class="w-8 h-8 rounded text-[12px] flex items-center justify-center hover:bg-blue-100"
                :class="selectedDate === day ? 'bg-blue-900 text-white' : ''"
              >
                {{ day }}
              </button>
              <div v-else class="w-8 h-8"></div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white w-[480px] rounded-[8px] border border-blue-900 p-8 relative shadow-lg">
        <button
          @click="closeModal"
          class="absolute top-4 right-4 text-black text-3xl"
        >
          ×
        </button>

        <div class="flex justify-center mb-3">
          <CalendarClock class="w-16 h-16" />
        </div>

        <h2 class="text-center text-[22px] font-bold mb-5">
          Buka Sesi Perkuliahan
        </h2>

        <div class="border border-blue-100 rounded-[8px] shadow-md p-5 mb-5 w-[340px] mx-auto">
          <h3 class="font-bold text-[15px] mb-1">
            {{ selectedJadwal.mataKuliah }}
          </h3>

          <p class="text-[11px] text-gray-400 mb-4">
            Sesi 12
          </p>

          <label class="block text-[12px] font-medium mb-2">
            Topik Kelas
          </label>

          <input
            v-model="topikKelas"
            type="text"
            placeholder="Masukkan topik kelas"
            class="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-blue-900"
          />
        </div>

        <h3 class="text-center text-[15px] font-semibold mb-2">
          Apakah Anda yakin ingin membuka sesi perkuliahan?
        </h3>

        <p class="text-center text-[12px] text-gray-600 mb-8">
          Mahasiswa dapat melakukan presensi<br />
          setelah sesi dibuka.
        </p>

        <div class="flex gap-8">
          <button
            @click="closeModal"
            class="w-full border border-blue-900 text-blue-900 font-semibold py-2 rounded-[5px]">
            Batal
          </button>

          <button @click="bukaSesi"
            class="w-full bg-blue-900 text-white font-semibold py-2 rounded-[5px]">
            Buka Sesi
          </button>
        </div>
      </div>
    </div>
    
  </adminLayout>
</template>