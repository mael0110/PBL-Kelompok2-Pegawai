<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed, onMounted } from "vue";
import { Search, Users } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { kelasService } from "../services/kelas";

const router = useRouter();
const search = ref("");
const kelasDiampu = ref([]); 
const kelasProdi = ref([]);   
const jumlahPesertaMap = ref({}); 

// --- STATE: NOTIFIKASI POP-UP (TOAST) ---
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("error");

const pemicuToast = (message, type = "error") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const { getKelas, getKelasByProdi, getMahasiswaKelas } = kelasService();

const fetchKelas = async () => {
  try {
    const dataPengampu = await getKelas();
    kelasDiampu.value = dataPengampu || [];
    const prodiParam = "teknik-informatika";
    const dataProdi = await getKelasByProdi(prodiParam);
    kelasProdi.value = dataProdi;

    if (Array.isArray(kelasDiampu.value)) {
      for (const kelas of kelasDiampu.value) {
        const targetId = kelas.class_id || kelas.id || kelas.mata_kuliah?.id;
        if (targetId) {
          try {
            const resUtuh = await getMahasiswaKelas(targetId);
            const arrayData = resUtuh?.data || [];
            let totalMhs = 0;
            if (Array.isArray(arrayData) && arrayData.length > 0) {
              totalMhs = arrayData.flatMap(item => item.mahasiswa || []).length;
            }
            jumlahPesertaMap.value[targetId] = totalMhs;
          } catch (err) {
            jumlahPesertaMap.value[targetId] = 0;
          }
        }
      }
    }
  } catch (err) {
    pemicuToast("Gagal memuat data kelas.", "error");
  }
};

const filteredKelas = computed(() => {
  return kelasDiampu.value.filter((item) => {
    const namaMatkul = item?.mata_kuliah?.name || "";
    return namaMatkul.toLowerCase().includes(search.value.toLowerCase());
  });
});

const dapatkanDetailKelas = (namaKelas) => {
  const cocok = kelasProdi.value.find(k => k?.name?.toLowerCase() === namaKelas?.toLowerCase());
  return { prodi: cocok?.prodi?.name || "Teknik Informatika", semester: cocok?.semester || "-" };
};

const detailKelas = (kelas) => {
  const classId = kelas.class_id || kelas.id || kelas.mata_kuliah?.id;
  const pengampuId = kelas.pengampu_id;
  router.push({
    path: "/detail-kelas",
    query: { classId: classId, pengampuId: pengampuId, kode: kelas.mata_kuliah?.kode || kelas.kode }
  });
};

onMounted(fetchKelas);

const formatSemester = (smt) => {
  const map = { 1: "1 (Satu)", 2: "2 (Dua)", 3: "3 (Tiga)", 4: "4 (Empat)", 5: "5 (Lima)", 6: "6 (Enam)", 7: "7 (Tujuh)", 8: "8 (Delapan)" };
  return map[smt] || smt;
};

const formatProdi = (prodi) => {
  if (!prodi) return "Teknik Informatika";
  return prodi.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const namaField = (field) => {
  const map = { "dasar-pemrograman" : "Dasar Pemprograman", "data-struktur-algoritma": "Data Stuktur Algoritma", "fisika-dasar": "Fisika Dasar", "iot": "IOT" };
  return map[field] || field;
};
</script>

<template>
  <adminLayout>
    <!-- 🟢 TOAST NOTIFICATION TANPA BORDER HITAM -->
    <transition enter-active-class="transform ease-out duration-300 transition" enter-from-class="translate-y-[-20px] opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showToast" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center min-w-[280px] justify-center">
        <div :class="[toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : toastType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800']" class="w-full h-full flex items-center justify-center px-4 py-2.5 rounded-lg border shadow-md text-[11px] font-semibold">
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </transition>

    <div class="flex justify-between items-center mb-5">
      <h1 class="text-[18px] font-bold">KELAS SAYA</h1> <!-- Ukuran sedikit disesuaikan -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input v-model="search" type="text" placeholder="Cari Kelas" class="w-[260px] h-[36px] border border-gray-300 rounded px-10 text-[11px] outline-none"/>
      </div>
    </div>

    <div class="space-y-3">
      <div v-if="filteredKelas.length === 0" class="text-center p-8 bg-white rounded shadow text-gray-500 text-[12px]">
        Tidak ada data kelas yang diampu.
      </div>
      <div v-else v-for="(kelas, index) in filteredKelas" :key="kelas.pengampu_id || index" class="bg-white rounded-[6px] shadow p-4">
        <span v-show="false">{{ detail = dapatkanDetailKelas(kelas.name || "TI-1A") }}</span>
        <div class="flex justify-between">
          <div>
            <h2 class="font-bold text-[14px] mb-3">
              {{ namaField(kelas.mata_kuliah.name) }} <span>({{ kelas.name || 'TI-1A' }})</span>
            </h2>
            <div class="space-y-1 text-[11px]">
              <div class="flex"><span class="w-[100px]">Program Studi</span><span> : {{ formatProdi(detail.prodi) }}</span></div>
              <div class="flex"><span class="w-[100px]">Semester</span><span> : {{ formatSemester(detail.semester) }}</span></div>
              <div class="flex"><span class="w-[100px]">SKS</span><span> : {{ kelas.mata_kuliah.sks || 0 }}</span></div>
            </div>
          </div>
          <div class="flex flex-col justify-between items-end">
            <button @click="detailKelas(kelas)" class="bg-blue-900 text-white px-4 py-1.5 rounded text-[11px] font-medium hover:bg-blue-800">
              Detail Kelas
            </button>
            <div class="flex items-center gap-2 text-gray-600 text-[12px]">
              <Users class="w-4 h-4" />
              <span> {{ jumlahPesertaMap[kelas.class_id || kelas.id || kelas.mata_kuliah.id] || 0 }} Peserta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </adminLayout>
</template>