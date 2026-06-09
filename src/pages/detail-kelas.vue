<script setup>
import adminLayout from "./adminLayout.vue";
import { useRoute, useRouter } from "vue-router";
import { ref } from "vue";
import { User, Clock, Users, UserRound, Mail } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

const kelas = {
  mataKuliah: route.query.mataKuliah || "Administrasi Database",
  kelas: route.query.kelas || "4A",
  dosen: route.query.dosen || "Aqsal Habibi",
  jam: route.query.jam || "13:30 - 17:00 WITA",
  peserta: 28,
};

const activeTab = ref("informasi");

const infoKelas = {
  mataKuliah: "Administrasi Database",
  kode: "IF402",
  prodi: "Teknik Informatika",
  semester: "4 (Empat)",
  sks: "3 SKS",
  kelas: "4A",
  dosen: "Aqsal Habibi",
  hari: "Jumat",
  waktu: "13:30 - 17:00 WITA",
  ruangan: "Lab Komputer",
  tahunAkademik: "2024/2025 Genap",
  peserta: 28
};

const sesi = [
  {
    tanggal: "07/02/25",
    materi: "Normalisasi",
    status: "Selesai",
  },
  {
    tanggal: "14/02/25",
    materi: "SQL - Dasaer",
    status: "Selesai",
  },
  {
    tanggal: "21/02/25",
    materi: "Pengandar DB",
    status: "Berjalan",
  }
]

const pesertaKelas = [
  { id: 1, nama: "Achmad Rizky Maulani", nim: "C030324001" },
  { id: 2, nama: "Ananda Maula Putri", nim: "C030324002" },
  { id: 3, nama: "Afdhal Rathomi", nim: "C030324003" },
  { id: 4, nama: "Akhmad Hafiz Azhari", nim: "C030324004" },
  { id: 5, nama: "Chairin Nur Izza", nim: "C030324005" },
  { id: 6, nama: "Dina Arianti", nim: "C030324006" },
];

const searchPeserta = ref("");

const filteredPeserta = ref(() => {
  return pesertaKelas.value.filter((p) =>
    p.nama.toLowerCase().includes(searchPeserta.value.toLowerCase())
  );
});

const detailSesi = (s) => {
  router.push({
    path: "/detail-sesi",
    query: { id: s.id },
  });
};
</script>

<template>
  <adminLayout>
    <div class="mb-4">
      <h1 class="text-[20px] font-semibold mb-2">{{ kelas.mataKuliah }}</h1>

      <p class="text-[13px] font-semibold mt-1">Kelas : {{ kelas.kelas }}</p>

      <div class="flex items-center gap-6 mt-2 text-[12px] text-gray-600">
        <div class="flex items-center gap-2">
          <User class="w-4 h-4" />
          <span>{{ kelas.dosen }}</span>
        </div>

        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4" />
          <span>{{ kelas.jam }}</span>
        </div>

        <div class="flex items-center gap-2">
          <Users class="w-4 h-4" />
          <span>{{ kelas.peserta }} Peserta</span>
        </div>
      </div>
    </div>

    <div class=" bg-gray-100 min-h-screen">
      <!-- CONTENT -->
      <div class="flex gap-4 mt-4">
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
        <!-- 1. Informasi Kelas -->
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
        <div v-if="activeTab === 'informasi'" class="bg-white p-4 rounded shadow text-[12px]">
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
              <tr v-for="s in sesi" :key="s.id" class="hover:bg-gray-50 border-b border-gray-300">
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
                    Detail Sesi
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="text-center mt-2">
            <button  @click="activeTab = 'sesi'" class="text-blue-900 text-[12px] font-semibold hover:text-blue-700">
              Lihat Semua Jadwal >
            </button>
          </div>
        </div>

        <!-- pengajar peserta -->
          <div v-if="activeTab === 'informasi'" class="grid grid-cols-2 gap-3 mt-3">
            <!-- pengajar -->
            <div class="bg-white shadow rounded-[5px] p-3">
              <h2 class="font-semibold text-[14px] mb-3">Pengajar</h2>

              <div class="shadow rounded-[5px] p-3 flex items-center gap-4">
                <div class="w-[90px] h-[90px] rounded-full bg-blue-100 flex items-center justify-center">
                  <UserRound class="w-12 h-12 text-blue-900" />
                </div>

                <div>
                  <h3 class="text-[12px] font-medium">Aqsal Habibi, S.Kom., M.Kom.</h3>
                  <p class="text-[11px] text-gray-600 mt-1">Dosen Pengampu</p>

                  <div class="flex items-center gap-2 mt-2">
                    <Mail class="w-4 h-4" />
                    <span class="text-[11px]">
                      aqsal.habibi@univ.ac.id
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <!-- peserta -->
            <div class="bg-white shadow rounded-[5px] p-3">
              <h2 class="font-semibold text-[14px] mb-3">Peserta Kelas</h2>

              <div class="flex items-center gap-4">
                <div class="w-[90px] h-[90px] rounded-full bg-blue-100 flex items-center justify-center">
                  <Users class="w-12 h-12 text-blue-900" />
                </div>

                <div>
                  <h3 class="font-semibold text-[20px]">28 Mahasiswa</h3>
                  <p class="text-[12px] text-gray-600 mb-3">Daftar Seluruh Peserta Kelas ini</p>
                  <button @click="activeTab = 'peserta'" class="border border-blue-900 text-blue-900 px-4 py-2 rounded-[5px] text-[12px] hover:bg-blue-900 hover:text-white transition">
                    Lihat Daftar Peserta
                  </button>
                </div>
              </div>

            </div>
          </div>
        

        <!-- 2. Sesi Pembelajaran -->
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
              <tr v-for="s in sesi" :key="s.id" class="hover:bg-gray-50 border-b border-gray-300">
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
                    Detail Sesi
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. Pengajar & Peserta -->
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

    </div>
  </adminLayout>
</template>