<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed, onMounted } from "vue";
import { Search, Users } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { kelasService } from "../services/kelas";

// router
const router = useRouter();

// search input
const search = ref("");

// list kelas yang ditampilkan
const kelasList = ref([]);

// ambil service
const { getKelas } = kelasService();

// fetch kelas dari API
const fetchKelas = async () => {
  const data = await getKelas();
  kelasList.value = data;
};

// filter kelas berdasarkan search
const filteredKelas = computed(() =>
  kelasList.value.filter((item) =>
    item.nama_kelas.toLowerCase().includes(search.value.toLowerCase())
  )
);

// navigasi ke detail kelas
const detailKelas = (kelas) => {
  router.push({
    path: "/detail-kelas",
    query: { id: kelas.id },
  });
};

// panggil fetch saat mounted
onMounted(() => {
  fetchKelas();
});

const namaField = (field) => {
  const map = {
    "dasar-pemrograman" : "Dasar Pemprograman",
    "data-struktur-algoritma": "Data Stuktur Algoritma",
    "fisika-dasar": "Fisika Dasar",
    "iot": "IOT"
  };
  return map[field] || field;
};
</script>

<template>
  <adminLayout>
    <div class="flex justify-between items-center mb-5">
      <h1 class="text-[20px] font-bold">KELAS SAYA</h1>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input
          v-model="search"
          type="text"
          placeholder="Cari Kelas"
          class="w-[280px] h-[40px] border border-gray-300 rounded px-10 text-[12px] outline-none"
        />
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="kelas in filteredKelas"
        :key="kelas.id"
        class="bg-white rounded-[6px] shadow p-4"
      >
        <div class="flex justify-between">
          <div>
            <h2 class="font-bold text-[15px] mb-3">{{ namaField(kelas.nama_kelas) }}</h2>

            <div class="space-y-1 text-[12px]">
              <div class="flex">
                <span class="w-[120px]">Program Studi</span>
                <span> : {{ kelas.program_studi }}</span>
              </div>

              <div class="flex">
                <span class="w-[120px]">Semester</span>
                <span> : {{ kelas.semester }}</span>
              </div>

              <div class="flex">
                <span class="w-[120px]">SKS</span>
                <span> : {{ kelas.sks }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-between items-end">
            <button
              @click="detailKelas(kelas)"
              class="bg-blue-900 text-white px-4 py-2 rounded text-[12px] font-medium hover:bg-blue-800"
            >
              Detail Kelas
            </button>

            <div class="flex items-center gap-2 text-gray-600 text-[14px]">
              <Users class="w-5 h-5" />
              <span> {{ kelas.total_mahasiswa }} Peserta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </adminLayout>
</template>