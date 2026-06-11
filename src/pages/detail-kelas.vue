<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { User, Clock, Users, UserRound } from "lucide-vue-next";
import { kelasService } from "../services/kelas.js";

// Service
const { getSesiPengampu, getMahasiswaKelas } = kelasService();

// Router
const route = useRoute();
const router = useRouter();

// Ambil query params: classId, kode matkul, dan pengampuId
const classId = route.query.id || "";
const mataKuliahKode = route.query.kode || "";
const pengampuId = route.query.pengampuId || "";

// Tab sidebar
const activeTab = ref("informasi");

// Data kelas, sesi, peserta
const infoKelas = ref({});
const sesiList = ref([]);
const pesertaKelas = ref([]);
const meta = ref({});
const currentPage = ref(1);

// Fetch sesi pelajaran berdasarkan pengampuId
const fetchSesiPelajaran = async () => {
  if (!pengampuId || !mataKuliahKode) return;

  try {
    console.log("DEBUG classId =", classId, "pengampuId =", pengampuId, "mataKuliahKode =", mataKuliahKode);

    // Ambil semua sesi dari pengampu
    const semuaSesi = await getSesiPengampu(pengampuId);

    // Filter sesuai kode mata kuliah
    sesiList.value = semuaSesi
      .filter(s => s.course_code === mataKuliahKode)
      .map(s => ({
        id: s.id,
        tanggal: s.session_date,
        materi: s.course_name || "-",
        status: s.status === "closed" ? "Selesai" : s.status === "open" ? "Berjalan" : "Belum",
      }));

    // Ambil info kelas dari sesi pertama
    if (sesiList.value.length > 0) {
      const first = semuaSesi.find(s => s.course_code === mataKuliahKode);

      infoKelas.value = {
        mataKuliah: first.course_name || "-",
        kode: first.course_code || "-",
        kelas: first.class_name || "-",
        dosen: first.lecturer?.employee_name || "-",
        peserta: first.total_mahasiswa || 0,
        hari: "-", // bisa diisi sesuai kebutuhan
        waktu: `${first.start_time} - ${first.end_time}`,
        ruangan: "-", 
        semester: "-", 
        sks: "-", 
        prodi: "-", 
        tahunAkademik: "-"
      };
    }

  } catch (err) {
    console.error("Gagal ambil sesi pelajaran:", err);
  }
};

// Fetch peserta kelas
const fetchPesertaKelas = async () => {
  if (!classId) return;

  try {
    const data = await getMahasiswaKelas(classId);
    pesertaKelas.value = data.map(m => ({
      id: m.id,
      nama: m.nama,
      nim: m.nim,
      status: m.status || "A"
    }));
  } catch (error) {
    console.error("Gagal ambil peserta kelas:", error);
  }
};

// Navigasi ke detail sesi
const detailSesi = (s) => {
  router.push({
    path: "/detail-sesi",
    query: { id: s.id },
  });
};

// Jalankan fetch saat mounted
onMounted(() => {
  fetchSesiPelajaran();
  fetchPesertaKelas();
});
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

    <div class="flex items-center gap-6 mt-2 text-[12px] text-gray-600">
      <div class="flex items-center gap-2">
        <User class="w-4 h-4" /> <span>{{ infoKelas.dosen }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4" /> <span>{{ infoKelas.waktu }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Users class="w-4 h-4" /> <span>{{ infoKelas.peserta }} Peserta</span>
      </div>
    </div>
  </div>

  <div class="bg-gray-100 min-h-screen flex gap-4 mt-4">
    <!-- Sidebar -->
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

    <!-- Konten -->
    <div class="flex-1 space-y-4">
      <!-- Informasi Kelas -->
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
          <p>Ruangan</p><p>{{ infoKelas.ruangan }}</p>
          <p>Tahun Akademik</p><p>{{ infoKelas.tahunAkademik }}</p>
          <p>Peserta</p><p>{{ infoKelas.peserta }}</p>
        </div>
      </div>

      <!-- Sesi Pembelajaran -->
      <div v-else-if="activeTab === 'sesi'" class="bg-white p-4 rounded shadow text-[12px]">
        <div class="flex justify-between items-center mb-3">
          <h2 class="font-semibold text-[15px]">Sesi Pembelajaran</h2>
        </div>
        <table class="w-full text-[12px] border-collapse">
          <thead class="bg-blue-100">
            <tr>
              <th class="p-2 text-center">Tanggal</th>
              <th class="p-2 text-center">Materi</th>
              <th class="p-2 text-center">Status</th>
              <th class="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sesiList" :key="s.id" class="hover:bg-gray-50 border-b border-gray-300">
              <td class="p-2 text-center">{{ s.tanggal }}</td>
              <td class="p-2 text-center">{{ s.materi }}</td>
              <td class="p-2 text-center">
                <span class="text-white px-4 py-1 rounded"
                      :class="s.status === 'Selesai' ? 'bg-green-600' : 'bg-blue-900'">
                  {{ s.status }}
                </span>
              </td>
              <td class="p-2 text-center">
                <button @click="detailSesi(s)"
                        class="border border-blue-900 text-blue-900 px-4 py-1 rounded hover:bg-blue-900 hover:text-white transition">
                  Buka Sesi
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pengajar & Peserta -->
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
            <div v-for="p in pesertaKelas" :key="p.id" class="flex items-center gap-4">
              <div class="w-[28px] h-[28px] rounded-full bg-purple-100 flex items-center justify-center">
                <UserRound class="w-4 h-4 text-blue-900" />
              </div>
              <div>
                <h3 class="text-[12px] font-semibold">{{ p.nama }}</h3>
                <p class="text-[11px] text-gray-500">{{ p.nim }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</adminLayout>
</template>