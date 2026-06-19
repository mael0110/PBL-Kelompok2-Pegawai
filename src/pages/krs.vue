<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted } from "vue";
import { krsService } from "../services/krs";
import { Eye, Clock, CheckCircle, XCircle, X } from "lucide-vue-next";

// Chart dummy (nilai sementara)
const chartData = ref({
  menunggu: 45,
  disetujui: 120,
  ditolak: 5,
});

const { getKRS } = krsService();
const krsList = ref([]);

// State untuk Modal Pop-up
const isModalOpen = ref(false);
const selectedKrs = ref(null);
const catatanDosen = ref("");

onMounted(async () => {
  krsList.value = await getKRS();
});

// Fungsi untuk membuka modal detail
const lihatDetail = (item) => {
  // Ditambahkan mock data mata kuliah jika dari service belum ada datanya, agar sesuai gambar mockup
  selectedKrs.value = {
    ...item,
    // Jika data matakuliah sudah dikirim dari backend, hapus array dummy di bawah ini:
    mata_kuliah: item.mata_kuliah || [
      { no: 1, nama: "Basis Data", sks: 3, kelas: "4A" },
      { no: 2, nama: "Sistem Operasi", sks: 3, kelas: "4A" },
      { no: 3, nama: "Jaringan Komputer", sks: 3, kelas: "4A" },
      { no: 4, nama: "Pemrograman Web", sks: 3, kelas: "4A" },
      { no: 5, nama: "PPLBO", sks: 3, kelas: "4A" },
      { no: 6, nama: "Kecerdasan Buatan", sks: 3, kelas: "4A" },
      { no: 7, nama: "Metode Numerik", sks: 2, kelas: "4A" },
    ],
    total_sks: item.total_sks || 20,
    batas_sks: item.batas_sks || 22,
  };
  catatanDosen.value = ""; // Reset catatan setiap buka data baru
  isModalOpen.value = true;
};

// Fungsi Aksi Tombol di dalam Modal
const handleTolak = () => {
  alert(`KRS ${selectedKrs.value.nama} ditolak dengan catatan: ${catatanDosen.value}`);
  isModalOpen.value = false;
};

const handleSetuju = () => {
  alert(`KRS ${selectedKrs.value.nama} telah disetujui!`);
  isModalOpen.value = false;
};
</script>

<template>
<adminLayout>
  <h1 class="text-[20px] font-bold">VALIDASI KRS</h1>
  <p class="text-[14px] font-medium mb-6">Kelola dan Validasi Kartu Rencana Studi Mahasiswa</p>

  <div class="flex gap-4 mb-6">
    <div class="flex-1 bg-yellow-100 p-4 rounded flex items-center gap-3">
      <Clock size="48" class="text-yellow-500" />
      <div>
        <div class="text-[14px]">Menunggu Validasi</div>
        <div class="font-bold text-[20px]">{{ chartData.menunggu }} <span class="text-[14px]">KRS</span></div>
        <div class="text-[14px]">Perlu Tindakan</div>
      </div>
    </div>

    <div class="flex-1 bg-green-100 p-4 rounded flex items-center gap-3">
      <CheckCircle size="48" class="text-green-500" />
      <div>
        <div class="text-[14px]">Sudah Disetujui</div>
        <div class="font-bold text-[20px]">{{ chartData.disetujui }} <span class="text-[14px]">KRS</span></div>
        <div class="text-[14px]">Sudah Disetujui</div>
      </div>      
    </div>

    <div class="flex-1 bg-red-100 p-4 rounded flex items-center gap-3">
      <XCircle size="48" class="text-red-500" />
      <div>
        <div class="text-[14px]">Perlu Perbaikan</div>
        <div class="font-bold text-[20px]">{{ chartData.ditolak }} <span class="tetx-[14px]">KRS</span></div>
        <div class="text-[14px]">Perlu Diperbaiki</div>
      </div>
    </div>
  </div>

  <div class="flex gap-4 mb-4 text-[13px]">
    <input type="text" placeholder="Cari NIM atau Nama Mahasisw" class="shadow rounded px-3 py-2 flex-1" />
    <input type="text" placeholder="Semua Prodi" class="shadow rounded px-3 py-2 w-[150px]" />
    <input type="text" placeholder="Semua Status" class="shadow rounded px-3 py-2 w-[150px]" />
    <button class="bg-blue-900 text-white px-4 py-2 rounded">Filter</button>
  </div>

  <div class="bg-white rounded-xl shadow-md px-5">
    <div class="px-5 py-3">
      <h4 class="font-bold text-xl">DAFTAR KRS</h4>
    </div>

    <table class="w-full table-dashboard text-sm border-b border-gray-200">
      <thead>
        <tr class="bg-blue-100 font-semibold">
          <th class="p-2 text-left w-[30px]">NO</th>
          <th class="p-2 text-left">NIM</th>
          <th class="p-2 text-left">NAMA</th>
          <th class="p-2 text-left">PRODI</th>
          <th class="p-2 text-left">TANGGAL PENGAJUAN</th>
          <th class="p-2 text-left">STATUS</th>
          <th class="p-2 text-left">AKSI</th>
        </tr>
      </thead>

      <tbody class="font-semibold">
        <tr v-for="(item, index) in krsList" :key="item.id" class="hover:bg-gray-50 border-b border-gray-200">
          <td class="p-2 font-semibold">{{ index + 1 }}</td>
          <td class="p-2">{{ item.nim }}</td>
          <td class="p-2">{{ item.nama }}</td>
          <td class="p-2">{{ item.prodi }}</td>
          <td class="p-2">{{ item.tanggal }}</td>
          <td class="p-2">
            <span 
              class="w-[110px] inline-block text-center px-4 py-2 rounded-lg text-[12px] font-semibold"
              :class="{
                'bg-yellow-200 text-yellow-700 px-2 py-1 rounded-full text-xs': item.status==='Menunggu',
                'bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs': item.status==='Disetujui',
                'bg-red-200 text-red-700 px-2 py-1 rounded-full text-xs': item.status==='Ditolak'
              }"
            >
              {{ item.status }}
            </span>
          </td>
          <td class="p-2 text-left">
            <button
              class="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition"
              @click="lihatDetail(item)"
            >
              <Eye class="w-5 h-5 text-blue-900" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 relative">
      
      <button @click="isModalOpen = false" class="absolute top-5 right-5 text-gray-500 hover:text-gray-700">
        <X class="w-6 h-6" />
      </button>

      <h3 class="font-semibold text-lg mb-4 tracking-wide uppercase">DETAIL KRS MAHASISWA</h3>

      <div class="bg-blue-50/70 p-4 rounded-xl flex items-center gap-4 mb-5 border border-blue-100">
        <img 
          src="https://via.placeholder.com/150" 
          alt="Foto Mahasiswa" 
          class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div>
          <h4 class="font-medium text-[14px]">{{ selectedKrs.nama }}</h4>
          <p class="font-medium text-[13px]">{{ selectedKrs.nim }}</p>
          <p class="font-medium text-[13px]">{{ selectedKrs.prodi }}</p>
        </div>
      </div>

      <div class="mb-4">
        <h5 class="font-semibold text-[15px]">Mata Kuliah yang Diambil</h5>
        <div class="overflow-hidden border border-gray-100 rounded-lg shadow-sm">
          <table class="w-full text-xs text-left">
            <thead class="bg-blue-100 ">
              <tr>
                <th class="p-2 text-center w-10">NO</th>
                <th class="p-2">MATA KULIAH</th>
                <th class="p-2 text-center w-14">SKS</th>
                <th class="p-2 text-center w-16">KELAS</th>
              </tr>
            </thead>
            <tbody >
              <tr v-for="mk in selectedKrs.mata_kuliah" :key="mk.no" class="hover:bg-gray-50">
                <td class="p-2 text-center font-medium t">{{ mk.no }}</td>
                <td class="p-2 font-medium">{{ mk.nama }}</td>
                <td class="p-2 text-center">{{ mk.sks }}</td>
                <td class="p-2 text-center">{{ mk.kelas }}</td>
              </tr>
              <tr class="bg-blue-100 font-semibold ">
                <td colspan="2" class="p-2 pl-4 text-left">Total</td>
                <td colspan="2" class="p-2 text-right pr-6">{{ selectedKrs.total_sks }} SKS</td>
              </tr>
              <tr class="bg-blue-100 font-semibold border-t border-blue-100">
                <td colspan="2" class="p-2 pl-4 text-left">Batas SKS</td>
                <td colspan="2" class="p-2 text-right pr-6">{{ selectedKrs.batas_sks }} SKS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-xs font-bold mb-1">
          Catatan Dosen <span class="text-gray-500 font-normal"><i>(Opsional)</i></span>
        </label>
        <div class="relative">
          <textarea 
            v-model="catatanDosen"
            placeholder="Tambahkan Catatan untuk Mahasiswa..." 
            maxLength="200"
            rows="3"
            class="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-gray-300"
          ></textarea>
          <span class="absolute bottom-3 right-3 text-[10px] text-gray-400 font-medium">
            {{ catatanDosen.length }}/200
          </span>
        </div>
      </div>

      <div class="flex justify-center gap-4">
        <button 
          @click="handleTolak"
          class="px-8 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors shadow-md shadow-red-200"
        >
          Tolak
        </button>
        <button 
          @click="handleSetuju"
          class="px-8 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-200"
        >
          Setuju
        </button>
      </div>

    </div>
  </div>

</adminLayout>
</template>