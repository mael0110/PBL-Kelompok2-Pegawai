<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { User, Clock, Users, UserRound, CalendarClock } from "lucide-vue-next";
import { kelasService } from "../services/kelas.js";

const { getSesiPengampu, getMahasiswaKelas, meta, updateJadwal, get } = kelasService();

const route = useRoute();
const router = useRouter();

const search = ref("");
const currentPage = ref(1);
const searchPeserta = ref("");

const classId = ref(route.query.class_id || route.query.classId || route.query.id || "");
const mataKuliahKode = computed(() => route.query.kode || "");
const pengampuId = computed(() => route.query.pengampuId || route.query.pengampu_id || "");

console.log("ROUTE QUERY:", route.query);
console.log("CLASS ID:", classId.value);
console.log("PENGAMPU ID:", pengampuId.value);

const activeTab = ref("informasi");

const infoKelas = ref({
  mataKuliah: "-",
  kode: "-",
  kelas: "-",
  dosen: "-",
  peserta: 0,
  hari: "-", 
  waktu: "-",
  ruangan: "-", 
  semester: "-", 
  sks: "-", 
  prodi: "-", 
  tahunAkademik: "-"
});
const sesiList = ref([]);
const pesertaKelas = ref([]);
const totalMahasiswa = ref(0);
const topikKelas = ref("");
const showModal = ref(false);

const selectedJadwal = ref({
  id: "",
  mataKuliah: "",
  number: "",
});

// 🔥 FUNGSI HELPER: Mengubah session_date YYYY-MM-DD menjadi nama hari Indonesia
const konversiKeHari = (dateString) => {
  if (!dateString || dateString === "-") return "-";
  try {
    const hariUrutan = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "-";
    return hariUrutan[dateObj.getDay()];
  } catch (e) {
    return "-";
  }
};

const fetchSesiPelajaran = async () => {
  if (!pengampuId.value) return;

  try {
    const res = await getSesiPengampu(pengampuId.value, classId.value, currentPage.value);

    const list = res ?? [];

    console.log("RAW SESSION:", list);

    // ❌ HAPUS FILTER INI TOTAL
    sesiList.value = list.map(s => {
      let labelStatus = "Terjadwal";

      if (s.status === "opened") labelStatus = "Berjalan";
      else if (s.status === "closed") labelStatus = "Selesai";

      return {
        id: s.id,
        tanggal: s.session_date || "-",
        number: s.session_number,
        materi: s.topic || "-",
        uiStatus: labelStatus,
        status: s.status
      };
    });

    // info kelas dari item pertama
    if (list.length > 0) {
      const first = list[0];
      
      // 🔥 Ekstrak hari riil dari properti session_date item pertama backend
      const hariHasilKonversi = konversiKeHari(first.session_date);

      infoKelas.value = {
        mataKuliah: first.course_name,
        kode: first.course_code,
        kelas: first.class_name,
        dosen: first.lecturer?.employee_name,
        peserta: first.total_mahasiswa || 0,
        hari: hariHasilKonversi, // 🔥 Sekarang terisi otomatis sesuai session_date backend
        waktu: `${first.start_time} - ${first.end_time}`,
        ruangan: "-",
        semester: "-",
        sks: first.sks || "-",
        prodi: "-",
        tahunAkademik: "-"
      };
    }

  } catch (err) {
    console.error(err);
    sesiList.value = [];
  }
};

const fetchPesertaKelas = async () => {
  if (!classId.value) return;

  try {
    const data = await getMahasiswaKelas(classId.value);
    if (data && Array.isArray(data)) {
      pesertaKelas.value = data.flatMap(item => {
        if (item.mahasiswa && Array.isArray(item.mahasiswa)) {
          return item.mahasiswa.map(m => ({
            id: m.mahasiswa_id,
            nama: m.name,
            email: m.email,
          }));
        }
        return [];
      });
    }
  } catch (error) {
    console.error("Gagal ambil peserta kelas:", error);
  }
};

// Filter Peserta Berdasarkan Input Search
const filteredPeserta = computed(() => {
  if (!searchPeserta.value) return pesertaKelas.value;
  return pesertaKelas.value.filter(p =>
    p.nama && p.nama.toLowerCase().includes(searchPeserta.value.toLowerCase())
  );
});

// Hooks & Watchers
onMounted(() => {
  fetchSesiPelajaran();
  if (classId.value) {
    fetchPesertaKelas();
  }
});

watch(
  () => [route.query.class_id, route.query.classId, route.query.id],
  () => {
    classId.value = route.query.class_id || route.query.classId || route.query.id || "";
    fetchSesiPelajaran();
    if (classId.value) {
      fetchPesertaKelas();
    }
  },
  { deep: true }
);

const goPage = async (page) => {
  currentPage.value = page;
  await fetchSesiPelajaran();
};

watch(search, async () => {
  currentPage.value = 1;
  await fetchSesiPelajaran();
});

// Modal Actions & Redirection
const handleSesiClick = (sesi) => {
  if (!sesi) return;

  if (sesi.uiStatus === 'Berjalan' || sesi.uiStatus === 'Selesai') {
    router.push({
      path: "/detail-sesi",
      query: {
        id: sesi.id,
        class_id: classId.value,
        classId: classId.value,
        pengampuId: pengampuId.value,
        kode: mataKuliahKode.value
      }
    });
  } else {
    selectedJadwal.value = {
      id: sesi.id,
      mataKuliah: infoKelas.value.mataKuliah,
      number: sesi.number,
    };
    topikKelas.value = sesi.materi !== "-" ? sesi.materi : "";
    showModal.value = true;
  }
};

// Eksekusi Update Jadwal
const bukaSesi = async () => {
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
      showModal.value = false;
      topikKelas.value = "";

      router.push({
        path: "/detail-sesi",
        query: {
          id: selectedJadwal.value.id,
          class_id: classId.value,
          classId: classId.value,
          pengampuId: pengampuId.value,
          kode: mataKuliahKode.value
        }
      });
    } else {
      alert("Gagal mengaktifkan sesi perkuliahan.");
    }
  } catch (error) {
    console.error("❌ Gagal buka sesi:", error);
    const pesanServer = error.response?.data?.errors?.status?.[0] || error.message;
    alert(`Gagal membuka sesi. Pesan: ${pesanServer}`);
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedJadwal.value = { id: "", mataKuliah: "", number: "" };
  topikKelas.value = "";
};

const openAturanNilai = () => {
  router.push({
    path: "/aturan-nilai",
    query: {
      class_id: classId.value,
      kode: mataKuliahKode.value,
      pengampuId: pengampuId.value
    }
  });
};

const lihatNilai = () => {
  router.push({
    path: "/nilai",
    query: {
      class_id: classId.value,
      kode: mataKuliahKode.value,
      namaKelas: route.query.namaKelas,
    },
  });
};
</script>

<template>
<adminLayout>
  <div class="mb-4">
    <p class="text-[12px] mb-2">
      <RouterLink to="/kelas" class="hover:underline">Kelas</RouterLink>
      <span class="mx-2 text-gray-400">&gt;</span>
      Detail Kelas
    </p>

    <h1 class="text-[20px] font-semibold mb-2">{{ infoKelas.mataKuliah }}</h1>
    <p class="text-[13px] font-semibold mt-1">Kelas : {{ infoKelas.kelas }}</p>

    <div class="flex items-center justify-between mt-2 text-[12px] text-gray-600">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <User class="w-4 h-4" />
          <span>{{ infoKelas.dosen }}</span>
        </div>

        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4" />
          <span>{{ infoKelas.waktu }}</span>
        </div>

        <div class="flex items-center gap-2">
          <Users class="w-4 h-4" />
          <span>{{ totalMahasiswa }} Peserta</span>
        </div>
      </div>

      <div class="flex gap-2">
  <button
    class="bg-blue-900 text-white px-4 py-1.5 rounded text-[12px] font-normal hover:bg-blue-800 transition"
    @click="lihatNilai"
  >
    Lihat Nilai
  </button>

  <button
    class="bg-blue-900 text-white px-4 py-1.5 rounded text-[12px] font-normal hover:bg-blue-800 transition"
    @click="openAturanNilai"
  >
    Aturan Nilai
  </button>
</div>
    </div>    
  </div>

  <div class="bg-gray-100 min-h-screen flex gap-4 mt-4">
    <div class="bg-white p-3 w-[230px] rounded shadow text-[12px]">
      <button
        @click="activeTab = 'informasi'"
        :class="activeTab === 'informasi' ? 'bg-blue-900 text-white' : 'text-black'"
        class="w-full text-left px-4 py-3 rounded-[6px]"
      >
        Informasi Kelas
      </button>
      <button
        @click="activeTab = 'sesi'"
        :class="activeTab === 'sesi' ? 'bg-blue-900 text-white' : 'text-black'"
        class="w-full text-left px-4 py-3 rounded-[6px]"
      >
        Sesi Pembelajaran
      </button>
      <button
        @click="activeTab = 'peserta'"
        :class="activeTab === 'peserta' ? 'bg-blue-900 text-white' : 'text-black'"
        class="w-full text-left px-4 py-3 rounded-[6px]"
      >
        Pengajar & Peserta
      </button>
    </div>

    <div class="flex-1 space-y-4">
      <div v-if="activeTab === 'informasi'" class="bg-white p-4 rounded shadow text-[12px]">
        <h2 class="font-semibold text-[15px] mb-3">Informasi Kelas</h2>
        <div class="grid grid-cols-4 gap-y-3">
          <p>Mata Kuliah</p><p>{{ infoKelas.mataKuliah }}</p>
          <p>Kode Matakuliah</p><p>{{ infoKelas.kode }}</p>
          <p>Program Studi</p><p>{{ infoKelas.prodi }}</p>
          <p>Semester</p><p>{{ infoKelas.semester }}</p>
          <p>SKS</p><p>{{ infoKelas.sks }}</p>
          <p>Kelas</p><p>{{ infoKelas.kelas }}</p>
          <p>Dosen</p><p>{{ infoKelas.dosen }}</p>
          <p>Hari</p><p>{{ infoKelas.hari }}</p>
          <p>Waktu</p><p>{{ infoKelas.waktu }}</p>
          <p>Tahun Academic</p><p>{{ infoKelas.tahunAkademik }}</p>
        </div>
      </div>

      <div v-else-if="activeTab === 'sesi'" class="bg-white p-4 rounded shadow text-[12px]">
        <div class="flex justify-between items-center mb-3">
          <h2 class="font-semibold text-[15px]">Sesi Pembelajaran</h2>
        </div>
        <table class="w-full text-[12px] border-collapse">
          <thead class="bg-blue-100">
            <tr>
              <th class="p-2 text-center">Tanggal</th>
              <th class="p-2 text-center">Pertemuan</th>
              <th class="p-2 text-center">Materi</th>
              <th class="p-2 text-center">Status</th>
              <th class="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sesiList" :key="s.id" class="hover:bg-gray-50 border-b border-gray-300">
              <td class="p-2 text-center">{{ s.tanggal }}</td>
              <td class="p-2 text-center">Sesi ke-{{ s.number }}</td>
              <td class="p-2 text-center">{{ s.materi }}</td>
              <td class="p-2 text-center">
                <span class="text-white px-4 py-1 rounded inline-block text-center min-w-[95px]"
                      :class="{
                        'bg-green-600': s.uiStatus === 'Selesai',
                        'bg-orange-500': s.uiStatus === 'Berjalan',
                        'bg-blue-900': s.uiStatus === 'Terjadwal'
                      }">
                  {{ s.uiStatus }}
                </span>
              </td>
              <td class="p-2 text-center">
                <button @click="handleSesiClick(s)"
                        class="border border-blue-900 text-blue-900 px-4 py-1 rounded hover:bg-blue-900 hover:text-white transition">
                  {{ s.uiStatus === 'Terjadwal' ? 'Buka Sesi' : (s.uiStatus === 'Selesai' ? 'Lihat Sesi' : 'Masuk Sesi') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="meta && meta.links" class="flex justify-center gap-2 mt-4">
          <button
            v-for="(link, index) in meta.links"
            :key="index"
            :disabled="!link.url || !link.page"
            @click="goPage(link.page)"
            class="px-3 py-1 rounded border text-sm"
            :class="link.active ? 'bg-blue-900 text-white' : 'bg-white text-blue-900 hover:bg-blue-100'"
          >
            <span v-html="link.label"></span>
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'peserta'" class="space-y-3">
        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-[14px] mb-2">Dosen Pengajar</h2>
          <div class="flex items-center gap-4">
            <div class="w-[50px] h-[50px] rounded-full bg-blue-100 flex items-center justify-center">
              <UserRound class="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h3 class="text-[12px] font-semibold">{{ infoKelas.dosen }}</h3>
              <p class="text-[11px] text-gray-600">Dosen Pengampu</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-[14px] mb-2">Peserta Kelas</h2>
          <div class="flex gap-4 mb-3">
            <input v-model="searchPeserta" type="text" placeholder="Search"
              class="w-full border rounded-[6px] px-3 py-2 text-[11px] outline-none" />
            <button class="bg-green-600 text-white px-4 py-2 text-[12px] rounded-[6px] font-semibold">Cari</button>
          </div>
          <div class="space-y-2">
            <div v-for="p in filteredPeserta" :key="p.id" class="flex items-center gap-4">
              <div class="w-[28px] h-[28px] rounded-full bg-purple-100 flex items-center justify-center">
                <UserRound class="w-4 h-4 text-blue-900" />
              </div>
              <div>
                <h3 class="text-[12px] font-normal">{{ p.nama }}</h3>
                <p class="text-[11px] text-gray-500">{{ p.email }}</p>
              </div>
            </div>
            <div v-if="filteredPeserta.length === 0" class="text-center text-gray-400 text-[12px] py-4">
              Mahasiswa tidak ditemukan atau belum dimuat.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white w-[420px] rounded-[8px] p-6 relative shadow-xl border border-gray-200">
        <button @click="closeModal" class="absolute top-3 right-4 text-gray-500 text-xl font-bold hover:text-black">×</button>

        <div class="flex justify-center mb-2">
          <CalendarClock class="w-12 h-12 text-blue-900" />
        </div>

        <h2 class="text-center text-[16px] font-bold mb-4 text-slate-800">Buka Sesi Perkuliahan</h2>

        <div class="rounded-[6px] p-3 mb-4 bg-gray-50 border border-gray-200">
          <h3 class="font-bold text-[13px] text-slate-700">{{ selectedJadwal.mataKuliah }}</h3>
          <p class="text-[11px] text-gray-400 mb-2">Sesi ke-{{ selectedJadwal.number }}</p>
          <label class="block text-[11px] font-semibold mb-1 text-slate-600">Topik Pembelajaran</label>
          <input
            v-model="topikKelas"
            type="text"
            placeholder="Masukkan topik perkuliahan hari ini..."
            class="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none bg-white focus:border-blue-900"
          />
        </div>

        <p class="text-center text-[11px] text-gray-500 mb-5">Apakah Anda yakin ingin membuka sesi perkuliahan?<br/><span class="text-[10px] text-gray-400">Mahasiswa dapat mengisi daftar presensi setelah sesi diaktifkan.</span></p>

        <div class="flex gap-3">
          <button @click="closeModal" class="w-full border border-gray-300 text-gray-700 font-semibold py-1.5 rounded text-[12px] hover:bg-gray-100">Batal</button>
          <button @click="bukaSesi" class="w-full bg-blue-900 text-white font-semibold py-1.5 rounded text-[12px] hover:bg-blue-800">Buka Sesi</button>
        </div>
      </div>
  </div>
</adminLayout>
</template>