<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed, onMounted } from "vue";
import { Upload, Download } from "lucide-vue-next";
import { nilaiService } from "../services/nilai";
import { kelasService } from "../services/kelas"; 
import { useRoute, useRouter, RouterLink } from "vue-router";

const route = useRoute();
const router = useRouter();

const { downloadTemplateNilai } = nilaiService();
const { getMahasiswaKelas } = kelasService(); 

// --- PARAMETER RUTE ASLI DARI URL ---
const classId = computed(() => route.query.id || route.query.class_id || "");
const mataKuliahKode = computed(() => route.query.kode || route.query.course_code || "");
const pengampuId = computed(() => route.query.pengampuId || "");

// State penampung metadata murni dari backend (Bukan dummy lagi)
const namaMataKuliah = ref("");
const namaKelas = ref("");

const file = ref(null);
const loading = ref(false);
const nilaiData = ref([]); 

/* =========================
   1. AMBIL DATA MAHASISWA & METADATA KELAS ASLI
========================= */
const fetchMahasiswaDariKelas = async () => {
  if (!classId.value) {
    console.warn("⚠️ Class ID tidak ditemukan di parameter URL.");
    return;
  }
  
  loading.value = true;
  try {
    const res = await getMahasiswaKelas(classId.value);
    console.log("🟢 RESPONSE MENTAH GET MAHASISWA KELAS:", res);

    // Pastikan dataMentah berupa array pembungkus pivot
    const dataMentah = Array.isArray(res) ? res : (res?.data || []);
    
    if (dataMentah && dataMentah.length > 0) {
      // 📝 CARI METADATA KELAS DAN MATKUL ASLI DARI HASIL RESPONSE API KELAS
      // Biasanya ada di objek item pertama (index 0) di dalam properti kelas/matkul bawaan backend
      const contohItem = dataMentah[0];
      
      // Ambil nama kelas murni dari database (sesuaikan alternatif key dari backend kamu)
      namaKelas.value = contohItem?.kelas?.nama_kelas || contohItem?.class_name || route.query.namaKelas || "4A";
      
      // Ambil nama matkul murni dari database
      namaMataKuliah.value = contohItem?.kelas?.mata_kuliah?.nama_matkul || contohItem?.course_name || route.query.namaMatkul || "Administrasi Database";

      // Ekstraksi data array mahasiswa pivot tanpa dummy
      nilaiData.value = dataMentah.flatMap(item => {
        if (item.mahasiswa && Array.isArray(item.mahasiswa)) {
          return item.mahasiswa.map(m => ({
            id: String(m.id || ''),
            nim: String(m.nim || ''), 
            nama: String(m.name || m.nama || ''),
            tugas: Number(item.tugas ?? 0),
            quiz: Number(item.quiz ?? 0),
            uts: Number(item.uts ?? 0),
            uas: Number(item.uas ?? 0),
            nilaiAkhir: Number(item.final_score || item.nilai_akhir || 0),
            grade: String(item.grade || '-')
          }));
        }
        return [];
      });

      console.log("🔥 DATA NILAI MAHASISWA SINKRON:", nilaiData.value);
    } else {
      console.warn("⚠️ Data mahasiswa kosong pada kelas ini.");
      nilaiData.value = [];
    }
  } catch (err) {
    console.error("❌ Gagal memuat list mahasiswa via getMahasiswaKelas:", err);
    nilaiData.value = [];
  } finally {
    loading.value = false;
  }
};

/* =========================
   DOWNLOAD TEMPLATE (100% VALUE REAL DATABASE)
========================= */
const handleDownloadTemplate = async () => {
  if (nilaiData.value.length === 0) {
    alert("Daftar mahasiswa kosong. Tidak bisa mendownload template untuk kelas ini.");
    return;
  }

  loading.value = true;
  try {
    // Potong kode matkul maksimal 10 karakter sesuai aturan validator backend
    let validCourseCode = mataKuliahKode.value;
    if (validCourseCode.length > 10) {
      validCourseCode = validCourseCode.substring(0, 10);
    }

    // Susun payload dinamis menggunakan nama kelas & matkul asli yang didapat dari database
    const payload = {
      course_code: validCourseCode,
      course_name: namaMataKuliah.value, 
      class_id: classId.value,
      class_name: namaKelas.value, 
      students: nilaiData.value.map((m) => ({
        student_id: m.id, 
        nim: m.nim,
        name: m.nama
      }))
    };

    console.log("🚀 PAYLOAD DINAMIS DIKIRIM KE BACKEND:", payload);
    
    // Kirim request unduh berkas ke API
    await downloadTemplateNilai(payload);
    
  } catch (error) {
    console.error("❌ Gagal mendownload template:", error);
    
    // Bongkar pesan error blob jika validator backend menolak kembali
    if (error.response && error.response.data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorPesan = JSON.parse(reader.result);
          console.log("🔥 DETAIL KESALAHAN VALIDASI BACKEND:", errorPesan);
          alert("Gagal download: " + JSON.stringify(errorPesan.errors || errorPesan.message));
        } catch (e) {
          console.log("Error teks biasa:", reader.result);
        }
      };
      reader.readAsText(error.response.data);
    } else {
      alert("Terjadi kesalahan sistem: " + error.message);
    }
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (e) => {
  file.value = e.target.files[0];
};

const uploadNilai = async () => {
  if (!file.value) return;
  loading.value = true;
  try {
    file.value = null;
    await fetchMahasiswaDariKelas();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const kembaliKeDetailKelas = () => {
  router.push({
    path: "/detail-kelas",
    query: { id: classId.value, kode: mataKuliahKode.value, pengampuId: pengampuId.value }
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
              <h1 class="text-[20px] font-bold text-slate-800 uppercase mb-1">NILAI MAHASISWA</h1>
              <p class="text-[13px] text-slate-600 font-medium">
                {{ namaMataKuliah }} — {{ namaKelas }} ({{ mataKuliahKode }})
              </p>
          </div>
          <button @click="kembaliKeDetailKelas" class="bg-gray-200 text-slate-700 px-4 py-2 rounded text-[12px] font-semibold mt-2 hover:bg-gray-300">
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
        <div v-if="loading" class="p-8 text-center text-gray-400 text-[13px]">Memuat data mahasiswa murni dari database...</div>
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
                    Tidak ada data mahasiswa terdaftar di dalam kelas ini.
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