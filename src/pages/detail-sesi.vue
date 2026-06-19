<script setup>
import adminLayout from "./adminLayout.vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { Search, UserRound, Download, Trash2, Eye, ClipboardCheck } from "lucide-vue-next";
import { ref, computed, onMounted, reactive } from "vue";
import { kelasService } from "../services/kelas";
import { materiService } from "../services/materi.js";
import axios from "axios"; 

const route = useRoute();
const router = useRouter();

const mataKuliahKode = route.query.kode;
const pengampuId = route.query.pengampuId || route.query.pengampu_id;
const classId = route.query.class_id || route.query.classId;
const sesiId = route.query.id; 

const {
  getMahasiswaKelas,
  postPresensiMahasiswa,
  updatePresensiMahasiswa,
  getPresensiMahasiswa,
} = kelasService();

const { 
  tambahMateri, 
  uploadFiles, 
  getFileUploads, 
  downloadFileApi, 
  deleteFileApi,
  getSesiPengampu,
  hapusMateri,
  tambahTugas,
  hapusTugas,
  getMahasiswaMengumpulTugas 
} = materiService();

const searchMahasiswa = ref("");
const daftarMahasiswa = ref([]);
const showQrModal = ref(false);
const sudahAdaPresensi = ref(false);
const statusSesi = ref(""); // State untuk menyimpan status dari backend (open/closed)

const isLibraryForTugas = ref(false); 

// Materi State
const materiList = ref([]);
const showMateriModal = ref(false);
const uploadedFiles = ref([]);
const loadingMateri = ref(false);
const judulMateri = ref("");
const deskripsiMateri = ref("");
const fileInput = ref(null);

// Tugas State
const tugasList = ref([]); 
const showTugasModal = ref(false);
const uploadedTugasFiles = ref([]); 

const formTugas = reactive({
  title: "",
  description: "",
  deadline: ""
});

// Submission State
const showSubmissionModal = ref(false);
const currentAssignmentTitle = ref("");
const submissionList = ref([]);
const loadingSubmission = ref(false);

// File Library State
const showFileLibraryModal = ref(false);
const filesLibrary = ref([]);
const selectedFileUuids = ref([]);
const fileUuids = ref([]);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click(); 
  }
};

const getFileExtension = (filename) => {
  if (!filename) return 'FILE';
  return filename.split('.').pop().toUpperCase();
};

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getNamaMahasiswa = (studentId) => {
  const mhs = daftarMahasiswa.value.find(m => String(m.id) === String(studentId));
  return mhs ? mhs.nama : "Nama Tidak Ditemukan";
};

// ==========================================
// SERVICE DATA FETCHER (MATERI & TUGAS)
// ==========================================
const fetchMateri = async () => {
  const idPengampu = route.query.pengampuId || route.query.pengampu_id || route.query.pengampuid;
  const currentSesiId = route.query.id; 

  if (!idPengampu) return;

  try {
    const semuaSesi = await getSesiPengampu(idPengampu);
    const dataSesiRaw = semuaSesi?.data || semuaSesi;
    const sesiAktif = Array.isArray(dataSesiRaw) 
      ? dataSesiRaw.find(sesi => String(sesi.id) === String(currentSesiId))
      : dataSesiRaw;

    if (sesiAktif) {
      // Simpan status sesi aktif ke reactive state
      statusSesi.value = sesiAktif.status || "";

      if (sesiAktif.learning_materials) {
        materiList.value = sesiAktif.learning_materials.map(material => ({
          id: material.id,
          title: "Dokumen Materi", 
          description: `Diunggah pada: ${new Date(material.uploaded_at).toLocaleDateString('id-ID')}`,
          files: [
            {
              uuid: material.id,
              name: material.original_file_name || "File Materi"
            }
          ]
        }));
      } else {
        materiList.value = [];
      }
    } else {
      materiList.value = [];
    }
  } catch (err) {
    console.error(err);
  }
};

const fetchTugas = async () => {
  const idPengampu = route.query.pengampuId || route.query.pengampu_id || route.query.pengampuid;
  const currentSesiId = route.query.id;

  if (!idPengampu) return;

  try {
    const semuaSesi = await getSesiPengampu(idPengampu);
    const dataSesiRaw = semuaSesi?.data || semuaSesi;
    const sesiAktif = Array.isArray(dataSesiRaw) 
      ? dataSesiRaw.find(sesi => String(sesi.id) === String(currentSesiId))
      : dataSesiRaw;

    if (sesiAktif && sesiAktif.assignments) {
      tugasList.value = sesiAktif.assignments.map(tugas => {
        let taskFiles = [];
        if (tugas.attachment) {
          taskFiles = tugas.attachment.map(m => ({ uuid: m.id, name: m.original_file_name }));
        } else if (tugas.files) {
          taskFiles = tugas.files.map(m => ({ uuid: m.id, name: m.original_file_name }));
        }
        return {
          id: tugas.id,
          title: tugas.title,
          description: tugas.description,
          deadline: tugas.deadline,
          files: taskFiles
        };
      });
    } else {
      tugasList.value = [];
    }
  } catch (err) {
    console.error(err);
  }
};

const bukaPopupSubmission = async (tugas) => {
  currentAssignmentTitle.value = tugas.title;
  showSubmissionModal.value = true;
  loadingSubmission.value = true;
  submissionList.value = [];
  
  try {
    const res = await getMahasiswaMengumpulTugas(tugas.id);
    if (res?.success || res?.code === 200) {
      submissionList.value = res.data || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingSubmission.value = false;
  }
};

// ==========================================
// ACTIONS (POST MATERI & TUGAS)
// ==========================================
const onHapusMateri = async (materialId) => {
  if (!materialId || typeof materialId !== 'string') return;
  const konfirmasi = confirm("Apakah Anda yakin ingin menghapus dokumen materi ini?");
  if (!konfirmasi) return;

  try {
    const classSessionId = route.query.id;
    const res = await hapusMateri(classSessionId, [materialId]);
    if (res?.success || res?.code === 200) {
      alert("Materi berhasil dihapus!");
      await fetchMateri();
    }
  } catch (error) {
    console.error(error);
  }
};

const submitMateri = async () => {
  try {
    const classSessionId = route.query.id;
    if (!fileUuids.value.length) {
      alert("Pilih file dulu!");
      return;
    }
    await tambahMateri(classSessionId, fileUuids.value);
    alert("Materi berhasil disimpan!");
    showMateriModal.value = false;
    uploadedFiles.value = [];     
    fileUuids.value = [];         
    selectedFileUuids.value = []; 
    await fetchMateri();
  } catch (err) {
    console.error(err);
  }
};

const submitTugas = async () => {
  if (!formTugas.title || !formTugas.description || !formTugas.deadline) {
    alert("Semua field tugas wajib diisi!");
    return;
  }
  try {
    const deadlineDiformat = formTugas.deadline.replace('T', ' ');
    const payload = {
      title: formTugas.title,
      description: formTugas.description,
      deadline: deadlineDiformat,
      file_uuids: fileUuids.value 
    };
    const idSesiTarget = route.query.id || sesiId;
    const res = await tambahTugas(idSesiTarget, payload);

    if (res?.success || res?.code === 200 || res?.status === 201 || res?.status === 200) {
      alert("Tugas baru berhasil ditambahkan!");
      formTugas.title = "";
      formTugas.description = "";
      formTugas.deadline = "";
      uploadedTugasFiles.value = [];
      fileUuids.value = [];
      selectedFileUuids.value = [];
      showTugasModal.value = false;
      await fetchTugas();
    }
  } catch (error) {
    console.error(error);
  }
};

const onHapusTugas = async (assignmentId) => {
  if (!assignmentId || typeof assignmentId !== 'string') return;
  const konfirmasi = confirm("Apakah Anda yakin ingin menghapus tugas kuliah ini?");
  if (!konfirmasi) return;

  try {
    const classSessionId = route.query.id; 
    const res = await hapusTugas(classSessionId, [assignmentId]);
    if (res?.success || res?.code === 200) {
      alert("Tugas berhasil dihapus!");
      await fetchTugas(); 
    }
  } catch (error) {
    console.error(error);
  }
};

const handleUploadFile = async (event) => {
  const files = event.target.files;
  if (!files.length) return;
  try {
    const res = await uploadFiles(files); 
    res.forEach((file) => {
      filesLibrary.value.push({ uuid: file.id, name: file.original_file_name });
    });
  } catch (err) {
    console.error(err);
  }
};

const openFileLibrary = async (untukTugas = false) => {
  isLibraryForTugas.value = untukTugas; 
  showFileLibraryModal.value = true; 
  try {
    const res = await getFileUploads(); 
    filesLibrary.value = res.map((file) => ({ uuid: file.id, name: file.original_file_name }));
  } catch (err) {
    console.error(err);
  }
};

const pilihFileLibrary = () => {
  fileUuids.value = [...selectedFileUuids.value];
  const fileTerpilih = filesLibrary.value.filter((file) => 
    selectedFileUuids.value.includes(file.uuid)
  ).map((file) => ({ uuid: file.uuid, name: file.name }));

  if (isLibraryForTugas.value) {
    uploadedTugasFiles.value = fileTerpilih;
  } else {
    uploadedFiles.value = fileTerpilih;
  }
  showFileLibraryModal.value = false;
};

const downloadFile = async (file) => {
  const fileUuid = file.uuid || file.id;
  if (!fileUuid) return;
  try {
    const blobData = await downloadFileApi(fileUuid);
    const blobUrl = window.URL.createObjectURL(new Blob([blobData]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", file.name || file.original_file_name || "download-file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error(err);
  }
};

const deleteFile = async (uuid) => {
  if (!confirm("Hapus file permanen?")) return;
  try {
    const res = await deleteFileApi([uuid]);
    if (res.success) {
      filesLibrary.value = filesLibrary.value.filter((file) => file.uuid !== uuid);
      selectedFileUuids.value = selectedFileUuids.value.filter((id) => id !== uuid);
    }
  } catch (err) {
    console.error(err);
  }
};

const loadMahasiswa = async () => {
  try {
    const resUtuh = await getMahasiswaKelas(classId);
    const arrayData = resUtuh?.data || resUtuh || [];

    if (Array.isArray(arrayData)) {
      daftarMahasiswa.value = arrayData.flatMap((item) => {
        if (item.mahasiswa && Array.isArray(item.mahasiswa)) {
          return item.mahasiswa.map((m) => {
            const staticId = m.id || m.mahasiswa_id || item.id || item.mahasiswa_id || m.student_id;
            return {
              id: staticId,
              nama: m.name || item.name || "Nama Kosong",
              nim: m.nim || "-", 
              email: m.email || "-",
              status: "A"
            };
          });
        }
        const fallbackId = item.id || item.mahasiswa_id || item.student_id;
        return [{
          id: fallbackId,
          nama: item.name,
          nim: item.nim || "-",
          email: item.email || "-",
          status: "A"
        }];
      });
    }
  } catch (error) {
    console.error("Gagal load mahasiswa:", error);
  }
};

const loadPresensi = async () => {
  try {
    const sesiId = route.query.id;
    const res = await getPresensiMahasiswa(sesiId);
    
    if (res && res.mahasiswa && res.mahasiswa.length > 0) {
      sudahAdaPresensi.value = true; 
      const statusMap = { hadir: "H", izin: "I", sakit: "S", alpha: "A" };
      
      res.mahasiswa.forEach((item) => {
        const mahasiswa = daftarMahasiswa.value.find((m) => 
          String(m.id) === String(item.detail_id) || 
          String(m.id) === String(item.mahasiswa_id) || 
          String(m.id) === String(item.student_id)
        );
        if (mahasiswa) {
          mahasiswa.status = statusMap[item.status?.toLowerCase()] || "A";
        }
      });
    } else {
      sudahAdaPresensi.value = false; 
    }
  } catch (error) {
    console.error("Gagal sinkronisasi data presensi:", error);
  }
};

onMounted(async () => {
  await loadMahasiswa();
  await loadPresensi();
  await fetchMateri(); // Mengambil data materi sekaligus set statusSesi
  await fetchTugas();
});

const filteredMahasiswa = computed(() => {
  if (!searchMahasiswa.value) return daftarMahasiswa.value;
  return daftarMahasiswa.value.filter((item) =>
    item.nama?.toLowerCase().includes(searchMahasiswa.value.toLowerCase()) ||
    item.nim?.toLowerCase().includes(searchMahasiswa.value.toLowerCase())
  );
});

const ubahStatus = (mahasiswa, statusBaru) => {
  // Cegah perubahan presensi jika sesi sudah ditutup
  if (statusSesi.value.toLowerCase() === 'closed' || statusSesi.value.toLowerCase() === 'selesai') {
    alert("Sesi sudah selesai, data presensi tidak dapat diubah.");
    return;
  }
  mahasiswa.status = statusBaru;
};

const simpanPresensi = async () => {
  try {
    const statusMap = { H: "hadir", I: "izin", S: "sakit", A: "alpha" };

    if (!sudahAdaPresensi.value) {
      console.log("=== ISI PRESENSI PERTAMA KALI (POST KEMUDIAN UPDATE) ===");
      const payloadTambah = {
        pengampu_id: pengampuId || "019eb0e3-ef81-7ade-b1bf-43fcc47ea03f",
        sesi_id: route.query.id,
      };
      await postPresensiMahasiswa(payloadTambah);
      sudahAdaPresensi.value = true;
    }

    const detailPayload = daftarMahasiswa.value.map(m => ({
      detail_id: m.id,
      status: statusMap[m.status] || "alpha"
    }));

    const payloadUpdate = {
      sesi_id: route.query.id,
      detail: detailPayload
    };

    await updatePresensiMahasiswa(payloadUpdate);
    alert("Data presensi mahasiswa berhasil disimpan ke database!");
    await loadPresensi();

  } catch (error) {
    console.error("Gagal memproses presensi:", error);
    alert("Terjadi masalah sewaktu menyimpan presensi.");
  }
};

const tutupSesi = async () => {
  const konfirmasi = confirm("Apakah Anda yakin ingin menutup sesi ini?");
  if (!konfirmasi) return;
  try {
    const idSesiTarget = route.query.id; 
    const token = localStorage.getItem("token");
    const payload = { status: "closed" };
    
    const res = await axios.put(`https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/${idSesiTarget}`, payload, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });

    if (res.status === 200 || res.data?.success) {
      alert("Sesi perkuliahan berhasil ditutup!");
      statusSesi.value = "closed"; // Perbarui local state agar UI langsung berubah tanpa pindah halaman
      router.push({
        path: "/detail-kelas",
        query: { 
          classId: route.query.classId || route.query.class_id,
          pengampuId: route.query.pengampuId,
          kode: route.query.kode
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <adminLayout>
    <div class="flex justify-between items-start mb-6">
        <div>
            <p class="text-[12px] mb-2">
                <RouterLink to="/Kelas" class="hover:underline">Kelas</RouterLink>
                <span class="mx-2 text-gr">&gt;</span>
                <RouterLink :to="{ path: '/detail-kelas', query: { classId: route.query.class_id || route.query.classId, kode: route.query.kode, pengampuId: route.query.pengampuId || route.query.pengampu_id} }" class="hover:underline">Detail Kelas</RouterLink>
                <span class="mx-2 text-gr">&gt;</span>Detail Sesi
            </p>
            <h1 class="text-[20px] font-semibold mb-3">Detail Sesi</h1>
        </div>

        <div class="flex items-center gap-4 mt-4">
            <div class="bg-white shadow-md rounded-[4px] px-3 py-2 flex items-center gap-2 w-[220px]">
                <Search class="w-5 h-5 text-gray-400" />
                <input v-model="searchMahasiswa" type="text" placeholder="Cari Mahasiswa..." class="w-full outline-none text-[12px]"/>
            </div>
            
            <!-- KONDISI TOMBOL AKHIRI SESI -->
            <button 
              v-if="statusSesi.toLowerCase() === 'closed' || statusSesi.toLowerCase() === 'selesai'" 
              disabled
              class="bg-gray-400 text-white px-4 py-2 rounded-[4px] text-[12px] font-semibold cursor-not-allowed"
            >
              Sesi Selesai
            </button>
            <button 
              v-else 
              @click="tutupSesi" 
              class="hover:bg-red-400 bg-red-500 text-white px-4 py-2 rounded-[4px] text-[12px] font-semibold"
            >
              Tutup Sesi
            </button>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-5 mb-5">
        <div class="bg-white rounded-[10px] shadow p-5">
          <h2 class="text-center font-semibold mb-4 border-b border-gray-300 pb-2">Materi Kuliah</h2>
          <div v-if="materiList.length === 0" class="text-center text-gray-400 text-[12px]">Belum ada materi</div>
          <div v-else class="space-y-3">
            <div v-for="(m, i) in materiList" :key="i" class="border border-gray-300 rounded p-3 text-[12px] bg-white mb-2">
              <p class="font-semibold text-slate-800">{{ m.title || "Tanpa Judul" }}</p>
              <p class="text-gray-500">{{ m.description || "-" }}</p>
              
              <div v-if="m.files && m.files.length" class="flex justify-between items-center bg-gray-50 p-2 border border-solid border-gray-300 rounded mt-2">
                <div class="flex items-center gap-2 truncate max-w-[200px]">
                  <span class="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0">
                    {{ getFileExtension(m.files[0].name) }}
                  </span>
                  <span class="truncate text-gray-600 font-medium">{{ m.files[0].name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="downloadFile(m.files[0])" type="button" class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition shrink-0" title="Download File">
                    <Download class="w-4 h-4" />
                  </button>
                  <button @click="onHapusMateri(m.id)" type="button" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition shrink-0" title="Hapus Materi">
                    <Trash2 class="w-4 h-4" /> 
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button @click="showMateriModal = true" class="mt-8 bg-blue-900 text-white px-3 py-2 rounded text-[12px] hover:bg-blue-800">
            Tambah Materi
          </button>
        </div>

        <div class="bg-white rounded-[10px] shadow p-5">
          <h2 class="text-center font-semibold mb-4 border-b border-gray-300 pb-2">Tugas Kuliah</h2>
          <div v-if="tugasList.length === 0" class="text-center text-gray-400 text-[12px] py-2">Belum ada tugas</div>
          <div v-else class="space-y-3">
            <div v-for="(t, i) in tugasList" :key="i" class="border border-gray-300 rounded p-3 text-[12px] bg-white mb-2">
              <div class="flex justify-between items-start gap-4">
                <div class="space-y-1 flex-1">
                  <p class="font-semibold text-slate-800">{{ t.title || "Tanpa Judul" }}</p>
                  <p class="text-gray-500">{{ t.description || "-" }}</p>
                  <p class="text-amber-600 font-medium text-[11px] mt-1">Deadline: {{ t.deadline }}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button @click="bukaPopupSubmission(t)" type="button" class="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 p-1.5 rounded hover:bg-emerald-50 border border-emerald-200 transition" title="Lihat Berkas Mahasiswa">
                    <Eye class="w-3.5 h-3.5" />
                    <span class="font-bold text-[10px]">Pengumpulan</span>
                  </button>
                  <button @click="onHapusTugas(t.id)" type="button" class="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition" title="Hapus Tugas">
                    <Trash2 class="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div v-if="t.files && t.files.length" class="mt-2 space-y-2">
                <div v-for="(file, fIdx) in t.files" :key="fIdx" class="flex justify-between items-center bg-gray-50 p-2 border border-solid border-gray-300 rounded mt-2">
                  <div class="flex items-center gap-2 truncate max-w-[200px]">
                    <span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0">
                      {{ getFileExtension(file.name) }}
                    </span>
                    <span class="truncate text-gray-600 font-medium">{{ file.name }}</span>
                  </div>
                  <button @click="downloadFile(file)" type="button" class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition shrink-0" title="Download Lampiran Tugas">
                    <Download class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button @click="showTugasModal = true" type="button" class="mt-4 bg-blue-900 text-white px-3 py-2 rounded text-[12px] hover:bg-blue-800">
            Tambah Tugas
          </button>
        </div>
    </div>

    <!-- Submission Modal -->
    <div v-if="showSubmissionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-[10px] p-5 w-full max-w-2xl shadow-xl space-y-4 text-[12px]">
        <div class="flex justify-between items-center border-b pb-3">
          <div class="flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5 text-emerald-600" />
            <h3 class="text-sm font-bold text-slate-800">Pengumpulan: {{ currentAssignmentTitle }}</h3>
          </div>
          <button @click="showSubmissionModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-lg">&times;</button>
        </div>

        <div v-if="loadingSubmission" class="text-center py-8 text-gray-400">
          Mengambil berkas mahasiswa...
        </div>

        <div v-else-if="submissionList.length === 0" class="text-center py-8 text-gray-400">
          Belum ada mahasiswa yang mengumpulkan tugas ini.
        </div>

        <div v-else class="max-h-[350px] overflow-y-auto border rounded-lg">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-semibold border-b text-[11px]">
                <th class="p-3 w-[40%]">Nama Mahasiswa</th>
                <th class="p-3 w-[30%]">Tanggal Kumpul</th>
                <th class="p-3 w-[30%]">File Lampiran</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in submissionList" :key="sub.id" class="border-b hover:bg-slate-50 transition text-slate-600">
                <td class="p-3 font-medium text-slate-800">
                  {{ getNamaMahasiswa(sub.student_id) }}
                </td>
                <td class="p-3 text-[11px]">
                  {{ sub.submitted_at }}
                </td>
                <td class="p-3">
                  <div v-if="sub.attachment && sub.attachment.length" class="space-y-1.5">
                    <div v-for="file in sub.attachment" :key="file.id" class="flex items-center justify-between bg-white border border-solid border-gray-300 p-2 rounded text-[11px] max-w-xs gap-3 shadow-sm">
                      <div class="truncate flex items-center gap-2">
                        <span class="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0">
                          {{ getFileExtension(file.original_file_name) }}
                        </span>
                        <div class="truncate flex flex-col">
                          <span class="font-medium text-blue-900 truncate" :title="file.original_file_name">
                            {{ file.original_file_name }}
                          </span>
                          <span class="text-[9px] text-gray-400">{{ formatBytes(file.file_size) }}</span>
                        </div>
                      </div>
                      <button @click="downloadFile(file)" type="button" class="text-blue-600 hover:text-white p-1.5 rounded hover:bg-blue-600 border border-blue-200 transition shrink-0" title="Unduh Tugas">
                        <Download class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <span v-else class="text-red-400 italic text-[11px]">Tidak ada file</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="showSubmissionModal = false" type="button" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold transition">
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- Presensi Section -->
    <div class="mt-3">
        <h2 class="text-[15px] font-semibold mb-3">Daftar Presensi Mahasiswa</h2>
        
        <!-- Sembunyikan Tombol Simpan Presensi jika status sesi closed / selesai -->
        <button 
          v-if="statusSesi.toLowerCase() !== 'closed' && statusSesi.toLowerCase() !== 'selesai'"
          @click="simpanPresensi" 
          class="bg-green-600 text-white text-[12px] px-4 py-2 rounded-md mb-4 hover:bg-green-500"
        >
          Simpan Presensi
        </button>
        
        <div v-for="mahasiswa in filteredMahasiswa" :key="mahasiswa.id" class="bg-white shadow rounded-[4px] px-4 py-3 flex items-center justify-between mb-1.5 hover:bg-gray-50 transition">
            <div class="flex items-center gap-4 w-[40%]">
              <div class="p-2 bg-blue-50 rounded-full shrink-0">
                <UserRound class="w-4 h-4 text-blue-900" />
              </div>
              <p class="text-[13px]">{{ mahasiswa.nama }}</p>
            </div>
            
            <div class="w-[25%] flex justify-start items-center">
              <span class="text-[13px] ">{{ mahasiswa.nim }}</span>
            </div>
            
            <div class="flex gap-4">
              <button @click="ubahStatus(mahasiswa, 'H')" type="button" class="w-9 h-9 rounded-full border text-[12px] font-bold transition duration-200" :class="mahasiswa.status === 'H' ? 'bg-green-500 text-white border-green-500 shadow-md' : 'border-gray-300 text-gray-600 hover:bg-gray-100'">H</button>
              <button @click="ubahStatus(mahasiswa, 'I')" type="button" class="w-9 h-9 rounded-full border text-[12px] font-bold transition duration-200" :class="mahasiswa.status === 'I' ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' : 'border-gray-300 text-gray-600 hover:bg-gray-100'">I</button>
              <button @click="ubahStatus(mahasiswa, 'S')" type="button" class="w-9 h-9 rounded-full border text-[12px] font-bold transition duration-200" :class="mahasiswa.status === 'S' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'border-gray-300 text-gray-600 hover:bg-gray-100'">S</button>
              <button @click="ubahStatus(mahasiswa, 'A')" type="button" class="w-9 h-9 rounded-full border text-[12px] font-bold transition duration-200" :class="mahasiswa.status === 'A' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'border-gray-300 text-gray-600 hover:bg-gray-100'">A</button>
            </div>
        </div>
    </div>

    <!-- Tugas Modal -->
    <div v-if="showTugasModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-[10px] p-5 w-full max-w-md shadow-lg space-y-4 text-[12px]">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="text-sm font-bold text-slate-800">Tambah Tugas Baru</h3>
          <button @click="showTugasModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-sm">&times;</button>
        </div>
        <div class="space-y-1">
          <label class="font-semibold block">Judul Tugas</label>
          <input v-model="formTugas.title" type="text" placeholder="Masukkan judul tugas" class="w-full px-3 py-2 border rounded text-[12px] focus:outline-none focus:border-blue-500"/>
        </div>
        <div class="space-y-1">
          <label class="font-semibold block">Deskripsi Tugas</label>
          <textarea v-model="formTugas.description" rows="3" placeholder="Masukkan deskripsi tugas" class="w-full px-3 py-2 border rounded text-[12px] focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div class="space-y-1">
          <label class="font-semibold block">Tanggal Deadline</label>
          <input v-model="formTugas.deadline" type="datetime-local" class="w-full px-3 py-2 border rounded text-[12px] focus:outline-none focus:border-blue-500"/>
        </div>
        <div class="space-y-2">
          <label class="font-semibold block">Dokumen Pendukung</label>
          <button @click="openFileLibrary(true)" type="button" class="bg-green-600 text-white px-3 py-1.5 rounded font-medium hover:bg-green-500 block">
            Pilih dari Media Library
          </button>
          
          <div v-if="uploadedTugasFiles && uploadedTugasFiles.length > 0" class="mt-2">
            <div v-for="(file, idx) in uploadedTugasFiles" :key="idx" class="border border-dashed border-gray-400 rounded p-2 bg-gray-50 flex justify-between items-center mb-1">
              <span class="text-gray-600 truncate max-w-[250px]">{{ file.name }}</span>
              <button @click="uploadedTugasFiles.splice(idx, 1); fileUuids.splice(idx, 1);" type="button" class="text-red-500 font-bold">&times;</button>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button @click="showTugasModal = false" type="button" class="px-3 py-1.5 border rounded text-white hover:bg-red-600 bg-red-700">Batal</button>
          <button @click="submitTugas" type="button" class="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Materi Modal -->
    <div v-if="showMateriModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-[420px] rounded-[10px] p-6 relative shadow-lg">
        <button @click="showMateriModal = false" class="absolute top-3 right-4 text-[22px]">×</button>
        <h2 class="text-center text-[18px] font-semibold mb-4">Tambah Materi</h2>
        <div class="flex flex-col mb-4">
          <label class="text-[13px] mb-1 font-medium">Dokumen Pendukung</label>
          <button @click="openFileLibrary(false)" type="button" class="text-[12px] px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-medium transition w-max">
            Pilih dari Media Library
          </button>
        </div>
        <div v-if="uploadedFiles.length > 0" class="mb-4">
          <p class="text-[12px] font-semibold text-gray-700 mb-1.5">File Terpilih:</p>
          <div class="max-h-[100px] overflow-y-auto space-y-1.5 border border-dashed rounded-lg p-2 bg-gray-50">
            <div v-for="(f, i) in uploadedFiles" :key="i" class="flex items-center justify-between bg-white px-2 py-1 rounded border text-[12px]">
              <span class="truncate max-w-[280px] text-gray-600">{{ f.name }}</span>
              <button type="button" @click="uploadedFiles.splice(i, 1); selectedFileUuids = selectedFileUuids.filter(id => id !== f.uuid); fileUuids = fileUuids.filter(id => id !== f.uuid);" class="text-red-500 font-bold hover:text-red-700 px-1">×</button>
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-6 border-t pt-4">
          <button @click="showMateriModal = false" class="text-[12px] px-6 py-2 bg-red-700 text-white rounded hover:bg-red-500">Batal</button>
          <button @click="submitMateri" class="text-[12px] px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Media Library Modal -->
    <div v-if="showFileLibraryModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white w-[520px] rounded-[10px] p-6 relative shadow-lg">
        <button @click="showFileLibraryModal = false" class="absolute top-3 right-4 text-[22px]">×</button>
        <h2 class="text-center text-[18px] font-semibold mb-4">Media Library</h2>
        <div class="flex justify-end mb-4">
          <button @click="triggerFileInput" type="button" class="bg-green-600 text-white px-4 py-2 rounded text-[12px] font-medium hover:bg-green-500">Upload Baru</button>
          <input type="file" ref="fileInput" class="hidden" multiple @change="handleUploadFile">
        </div>
        <div class="max-h-[300px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
          <div v-for="file in filesLibrary" :key="file.uuid" class="flex items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 hover:shadow-sm transition">
            <div class="flex items-center gap-3">
              <input type="checkbox" :value="file.uuid" v-model="selectedFileUuids" class="w-4 h-4"/>
              <span class="text-[13px] truncate max-w-[250px]">{{ file.name }}</span>
            </div>
            <div class="flex items-center gap-3">
              <button @click="downloadFile(file)" type="button" class="text-blue-600 hover:text-blue-800 transition"><Download class="w-4 h-4" /></button>
              <button @click="deleteFile(file.uuid)" type="button" class="text-red-600 hover:text-red-800 transition"><Trash2 class="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4 gap-3">
          <button @click="showFileLibraryModal = false" class="text-[12px] px-6 py-2 bg-red-700 text-white rounded hover:bg-red-600">Batal</button>
          <button @click="pilihFileLibrary" class="text-[12px] px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Pilih</button>
        </div>
      </div>
    </div>
  </adminLayout>
</template>