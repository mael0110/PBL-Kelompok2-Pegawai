<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed, onMounted } from "vue";
import { Search, Users } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { kelasService } from "../services/kelas";

const router = useRouter();

const search = ref("");

const kelasDiampu = ref([]);  // Menampung hasil API getKelas (Pengampu)
const kelasProdi = ref([]);   // Menampung hasil API prodi (Detail admin kelas)

const { getKelas, getKelasByProdi } = kelasService();

const fetchKelas = async () => {
  // Mengambil data secara dinamis dari gabungan dua API di dalam getKelas()
  const dataPengampu = await getKelas();
  kelasDiampu.value = dataPengampu;

  const prodiParam = "teknik-informatika";
  const dataProdi = await getKelasByProdi(prodiParam);
  kelasProdi.value = dataProdi;
};

const filteredKelas = computed(() => {
  return kelasDiampu.value.filter((item) => {
    const namaMatkul = item?.mata_kuliah?.name || "";
    return namaMatkul.toLowerCase().includes(search.value.toLowerCase());
  });
});

const dapatkanDetailKelas = (namaKelas) => {
  const cocok = kelasProdi.value.find(
    (k) => k?.name?.toLowerCase() === namaKelas?.toLowerCase()
  );

  const totalSemuaMhs = cocok?.mahasiswa?.length || 0;
  
  const pesertaPerKelas = totalSemuaMhs > 40 ? Math.ceil(totalSemuaMhs / 3) : totalSemuaMhs;

  return {
    prodi: cocok?.prodi?.name || "Teknik Informatika",
    semester: cocok?.semester || "-",
    peserta: pesertaPerKelas
  };
};

const detailKelas = (kelas) => {
  console.log("CLICK DATA:", kelas);

  // Sesuai dengan response API: menggunakan kelasIdOtomatis hulu, 
  // di detail ini kita bawa id dari mata kuliah atau disesuaikan dengan parameter detail-kelas Anda
  const classId = kelas.id || kelas.mata_kuliah?.id;
  const pengampuId = kelas.pengampu_id;

  router.push({
    path: "/detail-kelas",
    query: {
      classId: classId,          
      pengampuId: pengampuId,    
      kode: kelas.mata_kuliah?.kode || kelas.kode
    }
  });
};

onMounted(() => {
  fetchKelas();
});

const formatSemester = (smt) => {
  const map = {
    1: "1 (Satu)", 2: "2 (Dua)", 3: "3 (Tiga)", 4: "4 (Empat)",
    5: "5 (Lima)", 6: "6 (Enam)", 7: "7 (Tujuh)", 8: "8 (Delapan)"
  };
  return map[smt] || smt;
};

const formatProdi = (prodi) => {
  if (!prodi) return "Teknik Informatika";
  return prodi.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

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
      <div v-if="filteredKelas.length === 0" class="text-center p-8 bg-white rounded shadow text-gray-500 text-[14px]">
        Tidak ada data kelas yang diampu.
      </div>

      <div
        v-else
        v-for="(kelas, index) in filteredKelas"
        :key="kelas.pengampu_id || index"
        class="bg-white rounded-[6px] shadow p-4"
      >
        <span v-show="false">{{ detail = dapatkanDetailKelas(kelas.name || "TI-1A") }}</span>

        <div class="flex justify-between">
          <div>
            <h2 class="font-bold text-[15px] mb-3">
              {{ namaField(kelas.mata_kuliah.name) }} <span>({{ kelas.name || 'TI-1A' }})</span>
            </h2>

            <div class="space-y-1 text-[12px]">
              <div class="flex">
                <span class="w-[120px]">Program Studi</span>
                <span> : {{ formatProdi(detail.prodi) }}</span>
              </div>

              <div class="flex">
                <span class="w-[120px]">Semester</span>
                <span> : {{ formatSemester(detail.semester) }}</span>
              </div>

              <div class="flex">
                <span class="w-[120px]">SKS</span>
                <span> : {{ kelas.mata_kuliah.sks || 0 }}</span>
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
              <span> {{ detail.peserta }} Peserta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </adminLayout>
</template>