<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed } from "vue";
import { Search, Users } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

const search = ref("");

const kelasList = ref([
  {
    id: 1,
    nama_kelas: "Administrasi Database (4A)",
    program_studi: "Teknik Informatika",
    semester: "4 (Empat)",
    sks: 3,
    total_mahasiswa: 28,
  },
  {
    id: 2,
    nama_kelas: "Basis Data (2B)",
    program_studi: "Sistem Informasi",
    semester: "2 (Dua)",
    sks: 3,
    total_mahasiswa: 25,
  },
  {
    id: 3,
    nama_kelas: "Pemrograman Web (4B)",
    program_studi: "Teknik Informatika",
    semester: "4 (Empat)",
    sks: 3,
    total_mahasiswa: 26,
  },
]);

const filteredKelas = computed(() => {
  return kelasList.value.filter((item) =>
    item.nama_kelas.toLowerCase().includes(search.value.toLowerCase())
  );
});

const detailKelas = (kelas) => {
  router.push({
    path: "/detail-kelas",
    query: {
      id: kelas.id,
    },
  });
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
            <h2 class="font-bold text-[15px] mb-3">{{ kelas.nama_kelas }}</h2>

            <div class="space-y-1 text-[12px]">
              <div class="flex">
                <span class="w-[120px]">Program Studi</span>
                <span>  : {{ kelas.program_studi }}</span>
              </div>

              <div class="flex">
                <span class="w-[120px]">Semester</span>
                <span>  : {{ kelas.semester }}</span>
              </div>

              <div class="flex">
                <span class="w-[120px]">SKS</span>
                <span>  : {{ kelas.sks }}</span>
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

            <div
              class="flex items-center gap-2 text-gray-600 text-[14px]">
              <Users class="w-5 h-5" />
              <span>  {{ kelas.total_mahasiswa }} Peserta</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="mt-4 flex justify-between items-center">
      <p class="text-[12px] text-gray-500">
        Menampilkan dari 1 - {{ filteredKelas.length }}
        dari {{ kelasList.length }} kelas
      </p>
    </div> -->

  </adminLayout>
</template>