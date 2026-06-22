<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, computed, onMounted } from "vue";
import { Upload, Download } from "lucide-vue-next";
import { nilaiService } from "../services/nilai";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { kelasService } from "../services/kelas";
import axios from "axios";

const route = useRoute();
const router = useRouter();

const { downloadTemplateNilai, uploadTemplateNilai, getAllNilai } = nilaiService(); 
const { getKelasByProdi, getMahasiswaKelas } = kelasService();

const mataKuliahKode = computed(() => route.query.kode || route.params.kode || "");
const pengampuId = computed(() => route.query.pengampuId || route.query.pengampu_id || "");
const classId = computed(() => route.query.class_id || route.query.classId || "");

const namaMataKuliah = ref("Mata Kuliah");
const namaKelas = ref("Kelas");

const file = ref(null);
const loading = ref(false);
const nilaiData = ref([]); 

// --- STATE & FUNGSI POP-UP REPLACEMENT UNTUK ALERT ---
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("error");

const pemicuToast = (message, type = "error") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const fetchInfoKelasMaster = async () => {
  try {
    const prodiParam = "teknik-informatika";
    const responseProdi = await getKelasByProdi(prodiParam);
    let semuaKelasProdi = [];

    if (Array.isArray(responseProdi)) {
      semuaKelasProdi = responseProdi;
    } else if (responseProdi?.data) {
      semuaKelasProdi = responseProdi.data;
    }

    if (semuaKelasProdi && classId.value) {
      const kelasCocok = semuaKelasProdi.find(k => 
        String(k.id).trim().toLowerCase() === String(classId.value).trim().toLowerCase()
      );
      
      if (kelasCocok) {
        namaKelas.value = kelasCocok.name || "-";
        
        const daftarMatkul = kelasCocok.kurikulum?.kurikulum_mk;
        if (Array.isArray(daftarMatkul) && mataKuliahKode.value) {
          const matkulCocok = daftarMatkul.find(m => 
            String(m.mata_kuliah?.kode).trim().toLowerCase() === String(mataKuliahKode.value).trim().toLowerCase()
          );
          
          if (matkulCocok) {
            namaMataKuliah.value = matkulCocok.mata_kuliah?.name || "";
          }
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat info kelas dari master prodi:", err);
  }
};

const fetchMahasiswaDariKelas = async () => {
  if (!classId.value || !mataKuliahKode.value) return;
  loading.value = true;
  try {
    const token = localStorage.getItem("token");

    const [resMahasiswa, resNilai] = await Promise.all([
      getMahasiswaKelas(classId.value),
      getAllNilai(classId.value, mataKuliahKode.value).catch(err => {
        console.error("⚠️ Gagal mengambil data nilai Kelompok 1:", err);
        return null;
      })
    ]);

    let listKHSReal = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const resKHS = await axios.get(`https://be.karlearn.site/api/khs?page=${currentPage}&per_page=10`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        });

        const dataHalamanIni = resKHS?.data?.data || [];
        const infoPagination = resKHS?.data?.pagination || resKHS?.data?.data?.pagination;

        if (Array.isArray(dataHalamanIni) && dataHalamanIni.length > 0) {
          listKHSReal = [...listKHSReal, ...dataHalamanIni];
          const totalPages = infoPagination?.total_pages || infoPagination?.total_page || 10; 
          
          if (currentPage >= totalPages) {
            hasNextPage = false;
          } else {
            currentPage++;
          }
        } else {
          hasNextPage = false; 
        }
      } catch (errKHS) {
        console.error(`⚠️ Gagal mengambil KHS Halaman ${currentPage}:`, errKHS);
        hasNextPage = false; 
      }
    }

    const dataMahasiswaMentah = Array.isArray(resMahasiswa) ? resMahasiswa : (resMahasiswa?.data || []);
    const dataNilaiReal = resNilai?.data || [];

    if (dataMahasiswaMentah && dataMahasiswaMentah.length > 0) {
      nilaiData.value = dataMahasiswaMentah.map(m => {
        let studentObj = {};
        
        if (m.mahasiswa && Array.isArray(m.mahasiswa) && m.mahasiswa.length > 0) {
          studentObj = m.mahasiswa[0];
        } else if (m.mahasiswa) {
          studentObj = m.mahasiswa;
        } else {
          studentObj = m;
        }

        const currentStudentId = String(studentObj.mahasiswa_id || studentObj.id || m.id || '');
        const currentStudentName = String(studentObj.name || studentObj.nama || m.nama || '').trim().toLowerCase();

        const nilaiCocok = dataNilaiReal.find(n => String(n.student_id || n.id) === currentStudentId);
        const khsMahasiswa = listKHSReal.find(k => 
          String(k.mahasiswa_name || '').trim().toLowerCase() === currentStudentName
        );
        
        let gradeResmiBackend = "-";
        
        if (khsMahasiswa && Array.isArray(khsMahasiswa.nilai)) {
          const matkulCocok = khsMahasiswa.nilai.find(n => 
            String(n.kode_mk || n.kode_course || '').trim().toLowerCase() === String(mataKuliahKode.value).trim().toLowerCase()
          );
          if (matkulCocok) {
            gradeResmiBackend = matkulCocok.grade || "-";
          }
        }

        const assignmentScore = nilaiCocok?.assignment_score ?? nilaiCocok?.assignment ?? 0;
        const utsScore = nilaiCocok?.uts_score ?? nilaiCocok?.uts ?? 0;
        const uasScore = nilaiCocok?.uas_score ?? nilaiCocok?.uas ?? 0;

        const nilaiAkhirSistem = nilaiCocok?.final_score ?? nilaiCocok?.final_grade;
        const hitungNilaiAkhir = nilaiAkhirSistem ? Number(nilaiAkhirSistem) : Math.round((Number(assignmentScore) + Number(utsScore) + Number(uasScore)) / 3);

        return {
          id: currentStudentId,
          nim: String(studentObj.nim || ''), 
          nama: String(studentObj.name || studentObj.nama || ''),
          tugas: Number(assignmentScore),
          uts: Number(utsScore),
          uas: Number(uasScore),
          nilaiAkhir: hitungNilaiAkhir,
          grade: gradeResmiBackend
        };
      });
    } else {
      nilaiData.value = [];
    }
  } catch (err) {
    console.error("❌ Gagal merangkai data gabungan:", err);
    nilaiData.value = [];
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    file.value = e.target.files[0];
  }
};

const uploadNilai = async () => {
  if (!file.value) return;

  const maxSizeInBytes = 2048 * 1024;
  if (file.value.size > maxSizeInBytes) {
    pemicuToast("Gagal: Ukuran file tidak boleh lebih dari 2048 KB (2 MB).", "error");
    return;
  }

  loading.value = true;
  try {
    const baseCode = String(mataKuliahKode.value || route.query.kode || route.params.kode || "MK").trim();
    const strictCleanCode = baseCode.replace(/\s+/g, '');
    const finalCourseCode = strictCleanCode.substring(0, 10);

    const cleanCourseName = String(route.query.namaMatkul || namaMataKuliah.value || "Mata Kuliah").trim();
    const cleanClassName = String(route.query.namaKelas || namaKelas.value || "Kelas").trim();
    const cleanClassId = String(classId.value || "").trim();

    const formData = new FormData();
    formData.append("file", file.value);
    formData.append("class_id", cleanClassId);
    formData.append("class_name", cleanClassName);
    formData.append("course_code", finalCourseCode); 
    formData.append("course_name", cleanCourseName);

    const res = await uploadTemplateNilai(formData);

    if (res && (res.success || res.code === 200)) {
      pemicuToast("File excel nilai berhasil di-upload ke sistem utama!", "success");
      file.value = null; 
      
      await fetchMahasiswaDariKelas(); 

      if (nilaiData.value && nilaiData.value.length > 0) {
        const token = localStorage.getItem("token");

        const promisesKHS = nilaiData.value.map((mhs) => {
          const payloadKHS = {
            mahasiswa_id: mhs.id,
            pengampu_id: pengampuId.value,
            total_nilai: Number(mhs.nilaiAkhir || 0)
          };

          return axios.post(
            "https://be.karlearn.site/api/khs/nilai",
            payloadKHS,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json"
              }
            }
          ).catch(err => {
            console.error(`⚠️ Gagal mengirim data KHS mahasiswa ${mhs.nama}:`, err.response?.data || err.message);
            return null;
          });
        });

        await Promise.all(promisesKHS);
        pemicuToast("Sinkronisasi berkas nilai ke KHS Mahasiswa berhasil diselesaikan!", "success");
      }

    } else {
      pemicuToast(res?.message || "Gagal mengunggah template excel nilai.", "error");
    }
  } catch (err) {
    console.error("Gagal upload nilai:", err);
    const errorData = err.response?.data;
    const pesanError = errorData?.message || "Terjadi kesalahan jaringan atau validasi sistem.";
    pemicuToast("Gagal Upload: " + pesanError, "error");
  } finally {
    loading.value = false;
  }
};

const handleDownloadTemplate = async () => {
  if (nilaiData.value.length === 0) {
    pemicuToast("Daftar mahasiswa kosong. Tidak bisa mendownload template.", "warning");
    return;
  }

  loading.value = true;
  try {
    let rawCode = mataKuliahKode.value || route.query.kode || "MK-001";
    if (rawCode.length > 10) {
      rawCode = rawCode.substring(0, 10);
    }

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

    await downloadTemplateNilai(payload);
    pemicuToast("Template nilai berhasil diunduh!", "success");
  } catch (error) {
    console.error("Gagal mendownload template:", error);
    pemicuToast("Gagal mengunduh template.", "error");
  } finally {
    loading.value = false;
  }
};

const kembaliKeDetailKelas = () => {
  router.push({
    path: "/detail-kelas",
    query: { id: classId.value, classId: classId.value, pengampuId: pengampuId.value, kode: mataKuliahKode.value }
  });
};

onMounted(async () => {
  await fetchMahasiswaDariKelas();
  await fetchInfoKelasMaster();
});
</script>

<template>
  <adminLayout>      
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-[-20px] opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showToast" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center min-w-[280px] justify-center">
        <div 
          :class="[
            toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
            toastType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
            'bg-red-50 border-red-200 text-red-800'
          ]"
          class="w-full h-full flex items-center justify-center px-4 py-2.5 rounded-lg border shadow-md text-[11px] font-semibold"
        >
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </transition>

      <div class="flex justify-between items-start mb-6">
          <div>
              <p class="text-[11px] text-gray-500">
                  <RouterLink to="/Kelas" class="hover:underline">Kelas</RouterLink> 
                  <span class="mx-2 text-gray-400">&gt;</span>
                  <span @click="kembaliKeDetailKelas" class="cursor-pointer hover:underline">Detail Kelas</span> 
                  <span class="mx-2 text-gray-400">&gt;</span> 
                  <span class="text-gray-400">Nilai Mahasiswa</span>
              </p>
              
              <div>
                <h1 class="text-[18px] font-bold mb-6 mt-6">NILAI</h1>
                <div class="space-y-3 text-[14px]">
                    <div class="flex">
                        <span class="w-[140px] text-[12px] font-medium">Mata Kuliah</span>
                        <span class="text-[12px] font-medium">
                            : {{ namaMataKuliah }}
                        </span>
                    </div>
                    <div class="flex">
                        <span class="w-[140px] text-[12px] font-medium">Kelas</span>
                        <span class="font-medium text-[12px]">
                            : {{ namaKelas }}
                        </span>
                    </div>
                </div>
            </div>
          </div>
          <button @click="kembaliKeDetailKelas" :disabled="loading" class="bg-gray-200 text-slate-700 px-4 py-2 rounded text-[12px] font-semibold mt-4 hover:bg-gray-300 disabled:opacity-50">
              Kembali
          </button>
      </div>

      <div class="bg-white p-5 rounded-lg shadow mb-6 border border-gray-200">
        <p class="font-semibold mb-3 text-[14px]">Upload Section</p>
        <label class="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-lg h-[160px] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100/50 transition">
          <input type="file" class="hidden" @change="handleFileChange" accept=".xlsx, .xls, .csv" :disabled="loading" />
          <Upload class="w-10 h-10 text-blue-700 mb-2" />
          <p class="text-[13px] font-medium text-slate-700">
            {{ file ? `File terpilih: ${file.name}` : 'Tarik dan Jatuhkan File Nilai di Sini atau Klik untuk Menjelajah (Format File yang didukung: xlsx, csv)' }}
          </p>
        </label>
        <div class="flex gap-3 mt-4">
          <button @click="handleDownloadTemplate" :disabled="loading || nilaiData.length === 0" class="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-800 rounded text-[12px] font-medium hover:bg-blue-50 disabled:opacity-50">
            <Download class="w-4 h-4" /> Download Template
          </button>
          <button @click="file = null" :disabled="loading || !file" class="px-4 py-2 bg-red-500 rounded text-[12px] text-white hover:bg-red-400 disabled:opacity-50">Batal</button>
          <button @click="uploadNilai" :disabled="loading || !file" class="px-4 py-2 bg-blue-900 text-white rounded text-[12px] hover:bg-blue-800 disabled:opacity-50">
            {{ loading ? 'Mengupload...' : 'Upload' }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div v-if="loading && nilaiData.length === 0" class="p-8 text-center text-gray-400 text-[13px]">Memuat data mahasiswa...</div>
        <table v-else class="w-full text-[13px]">
          <thead class="bg-blue-100 text-slate-800 border-b border-gray-200 font-semibold">
            <tr>
              <th class="p-3 text-left w-32">NIM</th>
              <th class="p-3 text-left">Nama</th>
              <th class="p-3 text-center">Tugas</th>
              <th class="p-3 text-center">UTS</th>
              <th class="p-3 text-center">UAS</th>
              <th class="p-3 text-center">Nilai Akhir</th>
              <th class="p-3 text-center">Grade</th>
            </tr>
          </thead>
          <tbody class="text-slate-900">
            <tr v-if="nilaiData.length === 0">
                <td colspan="7" class="p-8 text-center text-gray-400 italic bg-gray-50/20">
                    Tidak ada data mahasiswa pada kelas ini atau database kosong.
                </td>
            </tr>
            <tr v-else v-for="(item, i) in nilaiData" :key="i" class="border-b border-gray-100 hover:bg-gray-50/50">
              <td class="p-3 text-left ">{{ item.nim }}</td>
              <td class="p-3 text-left">{{ item.nama }}</td>
              <td class="p-3 text-center">{{ item.tugas }}</td>
              <td class="p-3 text-center">{{ item.uts }}</td>
              <td class="p-3 text-center">{{ item.uas }}</td>
              <td class="p-3 text-center ">{{ item.nilaiAkhir }}</td>
              <td class="p-3 text-center ">{{ item.grade }}</td>
            </tr>
          </tbody>
        </table>
      </div>
  </adminLayout>
</template>