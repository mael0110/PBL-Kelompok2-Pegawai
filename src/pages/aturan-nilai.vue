<script setup>
import adminLayout from "./adminLayout.vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { ref, computed, onMounted } from "vue";
// Import dari file nilai.js Anda
import { nilaiService } from "../services/nilai.js"; 

const route = useRoute();
const router = useRouter();

const { getAturanNilai, createAturanNilai, updateAturanNilai } = nilaiService();

// --- PARAMETER RUTE DINAMIS ---
const mataKuliahKode = computed(() => route.query.kode || route.params.kode || "");
const pengampuId = computed(() => route.query.pengampuId || route.query.pengampu_id || "");
const classId = computed(() => route.query.class_id || route.query.classId || "");

// State ID khusus database untuk keperluan UPDATE data lama (PUT)
const gradeSettingId = ref(null);

// Data Reaktif untuk Tampilan UI UX (namaMataKuliah sekarang diikat ke input)
const namaMataKuliah = ref("Administrasi Database"); 
const namaKelas = ref("4A");

// --- STATE MANAGEMENT ---
const listPenilaian = ref([]);
const loading = ref(false);
const isModalOpen = ref(false); 

// Form Input Pop-up (Default awal 0)
const inputTugas = ref(0);
const inputQuiz = ref(0);
const inputUts = ref(0);
const inputUas = ref(0);

// Hitung live total input di dalam modal pop-up
const liveTotalInput = computed(() => {
  return Number(inputTugas.value) + Number(inputQuiz.value) + Number(inputUts.value) + Number(inputUas.value);
});

// Cek apakah data di tabel utama sudah ada
const isDataExist = computed(() => listPenilaian.value.length > 0);

// --- AMBIL DATA ATURAN NILAI ---
const fetchAturanNilai = async () => {
  if (!mataKuliahKode.value) return;
  loading.value = true;
  try {
    const res = await getAturanNilai(mataKuliahKode.value);
    
    if (res && res.success && res.data) {
      const data = res.data;
      
      gradeSettingId.value = data.id;
      namaMataKuliah.value = data.course_name || namaMataKuliah.value;
      
      listPenilaian.value = [
        { nama: "Tugas", bobot: Math.round(parseFloat(data.assignment)) || 0 },
        { nama: "Quiz", bobot: 0 }, 
        { nama: "UTS", bobot: Math.round(parseFloat(data.uts)) || 0 },
        { nama: "UAS", bobot: Math.round(parseFloat(data.uas)) || 0 },
      ];
      
      inputTugas.value = Math.round(parseFloat(data.assignment)) || 0;
      inputQuiz.value = 0;
      inputUts.value = Math.round(parseFloat(data.uts)) || 0;
      inputUas.value = Math.round(parseFloat(data.uas)) || 0;
    } else {
      listPenilaian.value = [];
      gradeSettingId.value = null;
    }
  } catch (err) {
    console.error("Gagal memuat data lewat service nilai:", err);
    listPenilaian.value = [];
  } finally {
    loading.value = false;
  }
};

const bukaModal = () => { isModalOpen.value = true; };
const tutupModal = () => { isModalOpen.value = false; };

// --- SIMPAN / UPDATE DATA NILAI MENGGUNAKAN SERVICE ---
const simpanAturanNilai = async () => {
  if (liveTotalInput.value !== 100) {
    alert(`Total akumulasi bobot harus tepat 100%. Saat ini: ${liveTotalInput.value}%`);
    return;
  }

  loading.value = true;
  try {
    const payload = {
      course_code: mataKuliahKode.value,
      course_name: namaMataKuliah.value, // Nilai ini akan dinamis mengikuti apa yang diketik di input
      assignment: Number(inputTugas.value) + Number(inputQuiz.value), 
      uts: Number(inputUts.value),
      uas: Number(inputUas.value),
      lecturer_id: pengampuId.value || "019e4314-e2b6-729a-aced-f5cf529a1cee"
    };

    let res;
    if (gradeSettingId.value) {
      res = await updateAturanNilai(gradeSettingId.value, payload);
    } else {
      res = await createAturanNilai(payload);
    }

    if (res && (res.success || res.code === 200)) {
      alert("Aturan nilai berhasil disimpan!");
      tutupModal();
      await fetchAturanNilai(); 
    } else {
      alert(res?.message || "Gagal memproses aturan nilai.");
    }
  } catch (err) {
    console.error("Kesalahan sistem simpan aturan nilai:", err);
    alert("Terjadi gangguan jaringan saat menyimpan aturan nilai.");
  } finally {
    loading.value = false;
  }
};

const kembaliKeDetailKelas = () => {
  router.push({
    path: "/detail-kelas",
    query: { 
      id: classId.value,
      classId: classId.value,
      pengampuId: pengampuId.value,
      kode: mataKuliahKode.value
    }
  });
};

onMounted(() => { fetchAturanNilai(); });
</script>

<template>
  <adminLayout>
    <div class="flex justify-between items-start mb-6">
        <div>
            <p class="text-[12px] mb-2 text-gray-500">
                <RouterLink to="/Kelas" class="hover:underline">Kelas</RouterLink> 
                <span class="mx-2 ">&gt;</span>
                <span @click="kembaliKeDetailKelas" class="cursor-pointer hover:underline transition">Detail Kelas</span> 
                <span class="mx-2 ">&gt;</span> 
                <span>Aturan Nilai</span>
            </p>
            <h1 class="text-[20px] font-bold mb-3">ATURAN NILAI</h1>
        </div>
        <div class="flex items-center gap-4 mt-4">
            <button @click="kembaliKeDetailKelas" class="bg-gray-200 text-slate-700 px-4 py-2 rounded-[4px] text-[12px] font-semibold hover:bg-gray-300 transition">
                Kembali
            </button>
        </div>
    </div>

    <div class="bg-white rounded-[4px] shadow border border-gray-200 overflow-hidden max-w-4xl relative">
        <div v-if="loading" class="p-8 text-center text-gray-400 text-[12px]">
            Memproses data...
        </div>
        
        <div v-else>
            <table class="w-full text-center border-collapse text-[13px]">
                <thead>
                    <tr class="bg-blue-200  font-semibold border-b border-gray-200">
                        <th class="py-3 border-r border-gray-200 w-1/2">Komponen Penilaian</th>
                        <th class="py-3">Bobot (%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="!isDataExist">
                        <td colspan="2" class="py-8 text-gray-400 italic bg-gray-50/30">
                            Belum ada aturan nilai. Silakan klik tombol Tambah Penilaian di bawah.
                        </td>
                    </tr>
                    <tr v-else v-for="(item, idx) in listPenilaian" :key="idx" class="border-b border-gray-200">
                        <td class="py-3 border-r border-gray-200">{{ item.nama }}</td>
                        <td class="py-3">{{ item.bobot }}%</td>
                    </tr>
                    <tr v-if="isDataExist" class="font-bold bg-gray-50/50">
                        <td class="py-3 border-r border-gray-200">Total</td>
                        <td class="py-3">100%</td>
                    </tr>
                </tbody>
            </table>

            <div class="flex justify-end p-4 bg-gray-50/50 border-t border-gray-200">
                <button v-if="!isDataExist" @click="bukaModal" type="button" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded text-[13px] font-medium transition shadow-sm">
                    Tambah Penilaian
                </button>
                <button v-else @click="bukaModal" type="button" class="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded text-[13px] font-medium transition shadow-sm">
                    Edit Aturan Nilai
                </button>
            </div>
        </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div class="bg-white rounded-[4px] shadow-2xl w-full max-w-sm border border-gray-300 p-6 relative text-[13px] text-black pointer-events-auto">
            
            <button type="button" @click="tutupModal" class="absolute top-4 right-5 text-black hover:opacity-70 text-[20px] font-light">&times;</button>

            <div class="text-center mb-6">
                <h3 class="font-bold text-[13px] uppercase tracking-wide text-black">
                    {{ isDataExist ? 'EDIT ATURAN NILAI' : 'TAMBAH ATURAN NILAI' }}
                </h3>
            </div>
            
            <form @submit.prevent="simpanAturanNilai" class="space-y-4">
                <div class="text-left px-4">
                    <label class="text-black font-semibold text-[12px] mb-1 block">Mata Kuliah</label>
                    <div class="border-b border-black w-full">
                        <input v-model="namaMataKuliah" type="text" class="w-full py-1 bg-transparent outline-none text-black font-normal" required placeholder="Masukkan Nama Mata Kuliah" />
                    </div>
                </div>

                <div class="text-left px-4">
                    <p class="text-black font-semibold text-[12px] mb-0.5">Kelas</p>
                    <p class="font-normal text-black text-[13px] pl-2">{{ namaKelas }}</p>
                </div>

                <div class="grid grid-cols-2 gap-4 px-4 pt-2">
                    <div class="flex flex-col items-start">
                        <label class="text-black font-medium mb-1">Tugas</label>
                        <div class="relative w-full border-b border-black">
                            <input v-model.number="inputTugas" type="number" min="0" max="100" class="w-full text-center py-1 bg-transparent outline-none text-black font-medium" required />
                            <span class="absolute right-1 bottom-1 text-[11px] text-black">%</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-start">
                        <label class="text-black font-medium mb-1">Quiz</label>
                        <div class="relative w-full border-b border-black">
                            <input v-model.number="inputQuiz" type="number" min="0" max="100" class="w-full text-center py-1 bg-transparent outline-none text-black font-medium" required />
                            <span class="absolute right-1 bottom-1 text-[11px] text-black">%</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 px-4 pt-2">
                    <div class="flex flex-col items-start">
                        <label class="text-black font-medium mb-1">UTS</label>
                        <div class="relative w-full border-b border-black">
                            <input v-model.number="inputUts" type="number" min="0" max="100" class="w-full text-center py-1 bg-transparent outline-none text-black font-medium" required />
                            <span class="absolute right-1 bottom-1 text-[11px] text-black">%</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-start">
                        <label class="text-black font-medium mb-1">UAS</label>
                        <div class="relative w-full border-b border-black">
                            <input v-model.number="inputUas" type="number" min="0" max="100" class="w-full text-center py-1 bg-transparent outline-none text-black font-medium" required />
                            <span class="absolute right-1 bottom-1 text-[11px] text-black">%</span>
                        </div>
                    </div>
                </div>

                <div class="px-4 pt-2">
                    <div :class="liveTotalInput === 100 ? 'bg-green-100 border-green-300 text-black' : 'bg-red-50 border-red-200 text-black'" class="border rounded p-2 flex items-start gap-2.5 transition-all">
                        <div class="mt-0.5">
                            <svg :class="liveTotalInput === 100 ? 'text-green-700' : 'text-red-600'" class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 0a10 10 0 1010 10A10 10 0 0010 0zm4.3 7.3l-5.3 5.3a1 1 0 01-1.4 0L5.3 10a1 1 0 111.4-1.4l1.6 1.6 4.6-4.6a1 1 0 111.4 1.4z"/></svg>
                        </div>
                        <div>
                            <p class="font-bold text-[12px] leading-tight">Total {{ liveTotalInput }}%</p>
                            <p class="text-[11px] leading-normal font-medium">Total Bobot harus 100%</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 px-4 pt-4">
                    <button type="button" @click="tutupModal" class="px-4 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[12px] font-medium transition shadow-sm">
                        Batal
                    </button>
                    <button type="submit" class="px-4 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[12px] font-medium transition shadow-sm">
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>
  </adminLayout>
</template>