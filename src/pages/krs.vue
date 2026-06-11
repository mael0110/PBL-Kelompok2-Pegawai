<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted } from "vue";
import { krsService } from "../services/krs";
import { Eye, Clock, CheckCircle, XCircle } from "lucide-vue-next";

// Chart dummy (nilai sementara)
const chartData = ref({
  menunggu: 45,
  disetujui: 120,
  ditolak: 5,
});

const { getKRS } = krsService();
const krsList = ref([]);

onMounted(async () => {
  krsList.value = await getKRS();
});
</script>

<template>
<adminLayout>
  <h1 class="text-[20px] font-bold mb-5">VALIDASI KRS</h1>

  <!-- Charts -->
  <div class="flex gap-4 mb-6">
    <div class="flex-1 bg-yellow-100 p-4 rounded flex items-center gap-3">
      <Clock size="28" class="text-yellow-500" />
      <div>
        <div class="font-bold text-lg">{{ chartData.menunggu }} KRS</div>
        <div class="text-sm text-gray-700">Menunggu Validasi</div>
      </div>
    </div>

    <div class="flex-1 bg-green-100 p-4 rounded flex items-center gap-3">
      <CheckCircle size="28" class="text-green-500" />
      <div>
        <div class="font-bold text-lg">{{ chartData.disetujui }} KRS</div>
        <div class="text-sm text-gray-700">Sudah Disetujui</div>
      </div>      
    </div>

    <div class="flex-1 bg-red-100 p-4 rounded flex items-center gap-3">
      <XCircle size="28" class="text-red-500" />
      <div>
        <div class="font-bold text-lg">{{ chartData.ditolak }} KRS</div>
        <div class="text-sm text-gray-700">Perlu Perbaikan</div>
      </div>
    </div>
  </div>

  <!-- Search -->
  <div class="flex gap-4 mb-4">
    <input type="text" placeholder="Cari NIM atau Nama" class="shadow rounded px-3 py-2 flex-1" />
    <input type="text" placeholder="Semua Prodi" class="shadow rounded px-3 py-2 w-[150px]" />
    <input type="text" placeholder="Semua Status" class="shadow rounded px-3 py-2 w-[150px]" />
    <button class="bg-blue-900 text-white px-4 py-2 rounded">Filter</button>
  </div>

  <!-- Daftar KRS -->
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
          <th class="p-2 text-left">TANGGAL</th>
          <th class="p-2 text-left">STATUS</th>
          <th class="p-2 text-left">AKSI</th>
        </tr>
      </thead>

      <tbody>
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
</adminLayout>
</template>