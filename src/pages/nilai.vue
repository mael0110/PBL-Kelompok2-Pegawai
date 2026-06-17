<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed, onMounted } from "vue";
import { Upload, Download } from "lucide-vue-next";
import { nilaiService } from "../services/nilai";
import { useRoute, useRouter, RouterLink } from "vue-router";

const route = useRoute();
const router = useRouter();

// Menggunakan service getMahasiswaByKelas dari nilaiService sesuai API baru
const { downloadTemplateNilai, getMahasiswaByKelas } = nilaiService(); 

// --- PARAMETER RUTE DINAMIS ---
const classId = computed(() => route.query.class_id || route.query.classId || route.query.id || "");
const mataKuliahKode = computed(() => route.query.kode || route.query.course_code || "");
const pengampuId = computed(() => route.query.pengampuId || route.query.pengampu_id || "");

const namaMataKuliah = ref("Mata Kuliah");
const namaKelas = ref("Kelas");

const file = ref(null);
const loading = ref(false);
const nilaiData = ref([]); 

/* =========================
   1. SINKRONISASI DATA MAHASISWA (FIX SESUAI RESPON API BARU)
========================= */
const fetchMahasiswaDariKelas = async () => {
  loading.value = true;
  try {
    const res = await getMahasiswaByKelas();
    console.log("🟢 RESPONSE ASLI DARI API MAHASISWA:", res);

    // Mengantisipasi jika service langsung mengembalikan array data atau berupa object wrapper
    const dataMentah = Array.isArray(res) ? res : (res?.data || []);
    
    if (dataMentah && dataMentah.length > 0) {
      // Mapping field disesuaikan 100% dengan properti JSON baru Anda
      nilaiData.value = dataMentah.map(m => {
        console.log(`🔍 Mapping Mahasiswa -> Nama: ${m.nama_mahasiswa}, NIM: ${m.nim}, ID: ${m.id_mahasiswa}`);

        return {
          id: String(m.id_mahasiswa || ''),
          nim: String(m.nim || ''), 
          nama: String(m.nama_mahasiswa || ''),
          
          // Karena data nilai terpisah dari API daftar mahasiswa ini, 
          // kita set default ke 0 / '-' agar siap di-update saat upload nilai.
          tugas: 0,
          quiz: 0,
          uts: 0,
          uas: 0,
          nilaiAkhir: 0,
          grade: '-'
        };
      });

      console.log("🔥 HASIL MAP AKHIR UNTUK TABEL & TEMPLATE:", nilaiData.value);
    } else {
      nilaiData.value = [];
    }
  } catch (err) {
    console.error("❌ Gagal mengambil data mahasiswa:", err);
    nilaiData.value = [];
  } finally {
    loading.value = false;
  }
};

/* =========================
   2. FILE MANAGEMENT
========================= */
const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    file.value = e.target.files[0];
  }
};

const uploadNilai = async () => {
  if (!file.value) return;
  loading.value = true;
  try {
    // Tambahkan logika pengiriman file ke backend Anda di sini jika ada service upload
    alert(`File ${file.value.name} berhasil dipilih. Mengompres data...`);
    file.value = null;
    await fetchMahasiswaDariKelas();
  } catch (err) {
    console.error("❌ Gagal upload nilai:", err);
  } finally {
    loading.value = false;
  }
};

/* =========================
   3. DOWNLOAD TEMPLATE
========================= */
const handleDownloadTemplate = async () => {
  if (nilaiData.value.length === 0) {
    alert("Daftar mahasiswa kosong. Tidak bisa mendownload template.");
    return;
  }

  loading.value = true;
  try {
    let rawCode = mataKuliahKode.value || route.query.kode || "MK-001";
    if (rawCode.length > 10) {
      console.warn(`⚠️ Kode matkul "${rawCode}" dipotong karena melebihi batas maksimal 10 karakter.`);
      rawCode = rawCode.substring(0, 10);
    }

    // Payload bersih yang memetakan id, nim, dan nama ke format backend ekspor
    const payload = {
      course_code: rawCode,
      course_name: route.query.namaMatkul || namaMataKuliah.value || "Mata Kuliah",
      class_id: classId.value,
      class_name: route.query.namaKelas || namaKelas.value || "Kelas",
      students: nilaiData.value.map((m) => ({
        student_id: m.id, 
        nim: m.nim,
        name: m.nama
      }))
    };

    console.log("🚀 PAYLOAD DIKIRIM KE EXPORT API:", payload);
    await downloadTemplateNilai(payload);
    
  } catch (error) {
    console.error("❌ Gagal mendownload template:", error);
  } finally {
    loading.value = false;
  }
};

const kembaliKeDetailKelas = () => {
  router.push({
    path: "/detail-kelas",
    query: { id: classId.value, pengampuId: pengampuId.value, kode: mataKuliahKode.value }
  });
};

onMounted(() => {
  fetchMahasiswaDariKelas();
});
</script>

<template>
  <adminLayout>
    <div class="p-6 min-h-screen">
      
      <div class="flex justify-between items-start mb-6">
          <div>
              <p class="text-[12px] mb-2 text-gray-500">
                  <RouterLink to="/Kelas" class="hover:underline">Kelas</RouterLink> 
                  <span class="mx-2 text-gray-400">&gt;</span>
                  <span @click="kembaliKeDetailKelas" class="cursor-pointer hover:underline">Detail Kelas</span> 
                  <span class="mx-2 text-gray-400">&gt;</span> 
                  <span class="text-gray-400">Nilai Mahasiswa</span>
              </p>
              <h1 class="text-[20px] font-bold text-slate-800 uppercase mb-3">NILAI MAHASISWA</h1>
          </div>
          <button @click="kembaliKeDetailKelas" class="bg-gray-200 text-slate-700 px-4 py-2 rounded text-[12px] font-semibold mt-4 hover:bg-gray-300">
              Kembali
          </button>
      </div>

      <div class="bg-white p-5 rounded-lg shadow mb-6 border border-gray-200">
        <p class="font-semibold mb-3 text-[14px]">Upload Section</p>
        <label class="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-lg h-[160px] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100/50 transition">
          <input type="file" class="hidden" @change="handleFileChange" />
          <Upload class="w-10 h-10 text-blue-700 mb-2" />
          <p class="text-[13px] font-medium text-slate-700">
            {{ file ? `File: ${file.name}` : 'Tarik & Jatuhkan File atau Klik untuk Upload' }}
          </p>
        </label>
        <div class="flex gap-3 mt-4">
          <button @click="handleDownloadTemplate" :disabled="loading || nilaiData.length === 0" class="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-800 rounded text-[13px] font-medium hover:bg-blue-50 disabled:opacity-50">
            <Download class="w-4 h-4" /> Download Template
          </button>
          <button @click="file = null" class="px-4 py-2 bg-gray-200 rounded text-[13px] text-slate-700 hover:bg-gray-300">Batal</button>
          <button @click="uploadNilai" :disabled="loading || !file" class="px-4 py-2 bg-blue-900 text-white rounded text-[13px] hover:bg-blue-800 disabled:opacity-50">Upload</button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div v-if="loading" class="p-8 text-center text-gray-400 text-[13px]">Memuat data mahasiswa...</div>
        <table v-else class="w-full text-[13px]">
          <thead class="bg-blue-50 text-slate-800 border-b border-gray-200 font-semibold">
            <tr>
              <th class="p-3 text-left w-32">NIM</th>
              <th class="p-3 text-left">Nama</th>
              <th class="p-3 text-center">Tugas</th>
              <th class="p-3 text-center">Quiz</th>
              <th class="p-3 text-center">UTS</th>
              <th class="p-3 text-center">UAS</th>
              <th class="p-3 text-center">Nilai Akhir</th>
              <th class="p-3 text-center">Grade</th>
            </tr>
          </thead>
          <tbody class="text-slate-900">
            <tr v-if="nilaiData.length === 0">
                <td colspan="8" class="p-8 text-center text-gray-400 italic bg-gray-50/20">
                    Tidak ada data mahasiswa pada kelas ini atau database kosong.
                </td>
            </tr>
            <tr v-else v-for="(item, i) in nilaiData" :key="i" class="border-b border-gray-100 hover:bg-gray-50/50">
              <td class="p-3 text-left font-medium">{{ item.nim }}</td>
              <td class="p-3 text-left">{{ item.nama }}</td>
              <td class="p-3 text-center">{{ item.tugas }}</td>
              <td class="p-3 text-center">{{ item.quiz }}</td>
              <td class="p-3 text-center">{{ item.uts }}</td>
              <td class="p-3 text-center">{{ item.uas }}</td>
              <td class="p-3 text-center font-semibold text-blue-900">{{ item.nilaiAkhir }}</td>
              <td class="p-3 text-center font-bold text-emerald-700">{{ item.grade }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </adminLayout>
</template>