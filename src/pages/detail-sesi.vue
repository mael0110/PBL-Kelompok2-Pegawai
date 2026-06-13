<script setup>
import adminLayout from "./adminLayout.vue";
import { useRoute } from "vue-router";
import { Search, UserRound, Download, Trash2 } from "lucide-vue-next";
import { ref, computed, onMounted } from "vue";
import { kelasService } from "../services/kelas";
import { materiService } from "../services/materi.js";

const route = useRoute();

const mataKuliahKode = route.query.kode;
const pengampuId = route.query.pengampuId;
const classId = route.query.class_id;

const {
  getMahasiswaKelas,
  postPresensiMahasiswa,
  updatePresensiMahasiswa,
  getPresensiMahasiswa,
} = kelasService();

const{ tambahMateri, uploadFiles, getFileUploads, downloadFileApi, deleteFileApi} = materiService();

//get file


const searchMahasiswa = ref("");
const daftarMahasiswa = ref([]);
const showQrModal = ref(false);

//materi
const materiList = ref([]);
const showMateriModal = ref(false);
const uploadedFiles = ref([]);
const loadingMateri = ref(false);
const judulMateri = ref("");
const deskripsiMateri = ref("");

const fileInput = ref(null);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click(); 
  }
};

const fetchMateri = async () => {
  const classSessionId = route.query.id;

  const res = await getMateri(classSessionId);

  materiList.value = res?.data || [];
};

onMounted(() => {
  fetchMateri();
});

const submitMateri = async () => {
  try {
    const classSessionId = route.query.id;

    if (!fileUuids.value.length) {
      alert("Pilih file dulu!");
      return;
    }

    const res = await tambahMateri(
      classSessionId,
      fileUuids.value
    );

    console.log("MATERI SUCCESS:", res);

    showMateriModal.value = false;

    fileUuids.value = [];
    selectedFileUuids.value = [];

  } catch (err) {
    console.error(err);
  }
};

//file upload
const handleFileUpload = async (e) => {
  const files = e.target.files;
  if (!files.length) return;

  try {
    const res = await uploadFiles(files);
    console.log("UPLOAD OK:", res);

    res.forEach((file) => {
      fileUuids.value.push(file.id);
      uploadedFiles.value.push({ name: file.original_file_name }); 
    });
  } catch (err) {
    console.error(err);
  }
};

//upload file
const handleUploadFile = async (event) => {
  const files = event.target.files;
  if (!files.length) return;

  try {
    const res = await uploadFiles(files); 
    console.log("Upload sukses:", res);

    res.forEach((file) => {
      filesLibrary.value.push({
        uuid: file.id, 
        name: file.original_file_name,
      });
    });

  } catch (err) {
    console.error("Upload gagal:", err);
  }
};

// Pop-up File Library
const showFileLibraryModal = ref(false);
const filesLibrary = ref([]);
const selectedFileUuids = ref([]);
const fileUuids = ref([]);

// buka pop-up file library
const openFileLibrary = async () => {
  showFileLibraryModal.value = true; 
  
  try {
    const res = await getFileUploads(); 
    
    filesLibrary.value = res.map((file) => ({
      uuid: file.id,
      name: file.original_file_name,
    }));
  } catch (err) {
    console.error("Gagal memuat file library:", err);
  }
};
// pilih file dari library
const pilihFileLibrary = () => {
  fileUuids.value = [...selectedFileUuids.value];

  console.log("FILE TERPILIH:", fileUuids.value);

  showFileLibraryModal.value = false;
};

//dw file
const downloadFile = async (file) => {
  if (!file?.uuid) {
    console.warn("ID file tidak tersedia");
    return;
  }

  try {
    const blobData = await downloadFileApi(file.uuid);

    const blobUrl = window.URL.createObjectURL(new Blob([blobData]));
    
    const link = document.createElement("a");
    link.href = blobUrl;
    
    link.setAttribute("download", file.name || "downloaded-file");
    
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    console.log(`Berhasil mengunduh: ${file.name}`);
  } catch (err) {
    console.error("Proses unduh file gagal:", err);
    alert("Gagal mengunduh file, pastikan Anda memiliki akses.");
  }
};

const deleteFile = async (uuid) => {
  const konfirmasi = confirm("Apakah Anda yakin ingin menghapus file ini secara permanen?");
  if (!konfirmasi) return;

  try {
    const res = await deleteFileApi([uuid]);
    
    if (res.success) {
      filesLibrary.value = filesLibrary.value.filter(
        (file) => file.uuid !== uuid
      );

      selectedFileUuids.value = selectedFileUuids.value.filter(
        (id) => id !== uuid
      );

      console.log("File berhasil dihapus dari server dan lokal:", uuid);
      alert("File berhasil dihapus.");
    }
  } catch (err) {
    console.error("Proses hapus file gagal:", err);
    alert("Gagal menghapus file dari server.");
  }
};

//load mahasiswa
const loadMahasiswa = async () => {
  try {
    const res = await getMahasiswaKelas(classId);

    daftarMahasiswa.value = res.map((item) => ({
      id: item.mahasiswa?.[0]?.mahasiswa_id,
      nama: item.mahasiswa?.[0]?.name,
      email: item.mahasiswa?.[0]?.email,
      status: "",
    }));

    console.log("Mahasiswa:", daftarMahasiswa.value);
  } catch (error) {
    console.error("Gagal load mahasiswa:", error);
  }
};


//load presensi
const loadPresensi = async () => {
  try {
    const sesiId = route.query.id;

    console.log("Sesi ID:", sesiId);

    const res = await getPresensiMahasiswa(sesiId);

    console.log("Data Presensi:", res);

    if (!res) {
      console.log("Belum ada presensi");

      const hadir = data.filter(m =>
        m.status?.toLowerCase() === "hadir"
      ).length;

      const izin = data.filter(m =>
        m.status?.toLowerCase() === "izin"
      ).length;

      const sakit = data.filter(m =>
        m.status?.toLowerCase() === "sakit"
      ).length;

      const alpha = data.filter(m =>
        m.status?.toLowerCase() === "alpha"
      ).length;

      totalMahasiswa.value = daftarMahasiswa.value.length;

    ringkasanPresensi.value = [
          {
            label: "Hadir",
            jumlah: hadir,
            persen: `${Math.round((hadir / total) * 100)}%`,
            color: "bg-green-500",
          },
          {
            label: "Izin",
            jumlah: izin,
            persen: `${Math.round((izin / total) * 100)}%`,
            color: "bg-yellow-400",
          },
          {
            label: "Sakit",
            jumlah: sakit,
            persen: `${Math.round((sakit / total) * 100)}%`,
            color: "bg-blue-300",
          },
          {
            label: "Alpha",
            jumlah: alpha,
            persen: `${Math.round((alpha / total) * 100)}%`,
            color: "bg-red-500",
          },
        ];

      return;
    }

    const statusMap = {
      hadir: "H",
      izin: "I",
      sakit: "S",
      alpha: "A",
    };

    res.mahasiswa.forEach((item) => {
      const mahasiswa = daftarMahasiswa.value.find(
        (m) => m.id === item.detail_id
      );

      if (mahasiswa) {
        mahasiswa.status =
          statusMap[item.status?.toLowerCase()] || null;
      }
    });

    console.log(
      "Mahasiswa setelah merge presensi:",
      daftarMahasiswa.value
    );

  } catch (error) {
    console.error(
      "Gagal load presensi:",
      error.response?.data || error
    );
  }
};

onMounted(async () => {
  await loadMahasiswa();
  await loadPresensi();
});

const totalMahasiswa = ref(0);
const ringkasanPresensi = ref([
  {
    label: "Hadir",
    jumlah: 0,
    persen: "0%",
    color: "bg-green-500",
  },
  {
    label: "Izin",
    jumlah: 0,
    persen: "0%",
    color: "bg-yellow-400",
  },
  {
    label: "Sakit",
    jumlah: 0,
    persen: "0%",
    color: "bg-blue-300",
  },
  {
    label: "Alpha",
    jumlah: 0,
    persen: "0%",
    color: "bg-red-500",
  },
]);


//post presensi
const simpanPresensi = async () => {
  try {
    const payload = {
      pengampu_id:
        "019eb0e3-ef81-7ade-b1bf-43fcc47ea03f",
      sesi_id: route.query.id,
      mahasiswa: daftarMahasiswa.value,
    };

    console.log("Payload Presensi:", payload);

    const res = await postPresensiMahasiswa(payload);

    console.log("Presensi berhasil:", res);

    alert("Presensi berhasil disimpan");
  } catch (error) {
    console.error(
      "Gagal simpan presensi:",
      error.response?.data || error
    );
  }
};


//put presensi
const ubahStatus = async (mahasiswa, statusBaru) => {
  try {
    mahasiswa.status = statusBaru;

    const statusMap = {
      H: "hadir",
      I: "izin",
      S: "sakit",
      A: "alpha",
    };

    const payload = {
      sesi_id: route.query.id,
      detail: [
        {
          detail_id: mahasiswa.id,
          status: statusMap[statusBaru],
        },
      ],
    };

    console.log("Payload Update:", payload);

    const res = await updatePresensiMahasiswa(payload);

    console.log("Update berhasil:", res);
    await loadPresensi();
  } catch (error) {
    console.error(
      "Gagal update presensi:",
      error.response?.data || error
    );

    alert("Gagal update presensi");
  }
};


//filter
const filteredMahasiswa = computed(() => {
  if (!searchMahasiswa.value) {
    return daftarMahasiswa.value;
  }

  return daftarMahasiswa.value.filter((item) =>
    item.nama
      ?.toLowerCase()
      .includes(searchMahasiswa.value.toLowerCase())
  );
});

//tutup sesi
const tutupSesi = () => {
  console.log("Tutup sesi");
};


</script>

<template>
  <adminLayout>
    <div class="flex justify-between items-start mb-6">
        <!-- kiri -->
        <div>
            <p class="text-[12px] mb-2">
                <RouterLink to="/Dashboard" class="hover:underline">
                    Dashboard
                </RouterLink>
                <span class="mx-2 text-gr">&gt;</span>
                <RouterLink to="/Kelas" class="hover:underline">
                    Kelas
                </RouterLink>
                <span class="mx-2 text-gr">&gt;</span>
                <RouterLink
                  :to="{
                    path: '/detail-kelas',
                    query: {
                      class_id: route.query.class_id,
                      kode: route.query.kode,
                      pengampuId: route.query.pengampuId
                    }
                  }"
                  class="hover:underline"
                >
                  Detail Kelas
                </RouterLink>
                <span class="mx-2 text-gr">&gt;</span>Detail Sesi
            </p>

            <h1 class="text-[20px] font-semibold mb-3">Detail Sesi</h1>
        </div>

        <!-- kanan -->
        <div class="flex items-center gap-4 mt-4">
            <!-- search -->
            <div class="bg-white shadow-md rounded-[4px] px-3 py-2 flex items-center gap-2 w-[220px]">
                <Search class="w-5 h-5 text-gray-400" />
                <input v-model="searchMahasiswa" type="text" placeholder="Cari Mahasiswa..." class="w-full outline-none text-[12px]"/>
            </div>

            <!-- tutup sesi -->
            <button @click="tutupSesi" class="hover:bg-red-400 bg-red-500 text-white px-4 py-2 rounded-[4px] text-[12px] font-semibold" >
                Tutup Sesi
            </button>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-5 mb-5">
                <!-- materi -->
        <div class="bg-white rounded-[10px] shadow p-5 ">

          <h2 class="text-center font-semibold mb-4 border-b border-gray-300">
            Materi Kuliah
          </h2>

          <div v-if="materiList.length === 0" class="text-center text-gray-400 text-[12px]">
            Belum ada materi
          </div>

          <div v-else class="space-y-3">

            <div
              v-for="(m, i) in materiList"
              :key="i"
              class="border rounded p-3 text-[12px]"
            >

              <p class="font-semibold">
                {{ m.title || "Tanpa Judul" }}
              </p>

              <p class="text-gray-500">
                {{ m.description || "-" }}
              </p>

              <div v-if="m.files.length">
                📎 {{ m.files[0].name }}
              </div>

            </div>

          </div>

          <!-- tombol tambah materi (BUKA POPUP) -->
          <button
            @click="showMateriModal = true"
            class="mt-4 bg-green-600 text-white px-3 py-2 rounded text-[12px] hover:bg-green-500"
          >
            Tambah Materi
          </button>

        </div>

        <!-- tugas -->
        <div class="bg-white rounded-[10px] shadow p-5">
            <h2 class="text-center font-semibold mb-4 border-b border-gray-300">
            Tugas Kuliah
            </h2>

            <div v-if="materiList.length === 0" class="text-center text-gray-400 text-[12px]">
            Belum ada tugas
          </div>

          <div v-else class="space-y-3">

            <div
              v-for="(m, i) in materiList"
              :key="i"
              class="border rounded p-3 text-[12px]"
            >

              <p class="font-semibold">
                {{ m.title || "Tanpa Judul" }}
              </p>

              <p class="text-gray-500">
                {{ m.description || "-" }}
              </p>

              <div v-if="m.files.length">
                📎 {{ m.files[0].name }}
              </div>

            </div>

          </div>

          <!-- tombol tambah materi (BUKA POPUP) -->
          <button
            @click="showMateriModal = true"
            class="mt-4 bg-green-600 text-white px-3 py-2 rounded text-[12px] hover:bg-green-500"
          >
            Tambah Materi
          </button>

        </div>
    </div>

    <!-- presensi mahasiswa -->
    <div class="mt-3">
        <h2 class="text-[15px] font-semibold mb-3">
            Daftar Presensi Mahasiswa
        </h2>

        <button
        @click="simpanPresensi"
        class="bg-blue-900 text-white text-[12px] px-4 py-2 rounded-md mb-4 hover:bg-blue-800"
        >
        Simpan Presensi
        </button>

        <div v-for="mahasiswa in filteredMahasiswa" :key="mahasiswa.id" class="bg-white shadow rounded-[4px] px-3 py-2 flex items-center justify-between mb-1">
            <!-- kiri -->
            <div class="flex items-center gap-4 w-[45%]">
            <UserRound class="w-4 h-4 text-blue-900" />
            <p class="text-[12px]">{{ mahasiswa.nama }}</p>
            </div>

            <!-- <div class="w-[20%] text-[12px]">
            {{ mahasiswa.email }}
            </div> -->

            <div class="flex gap-4">
            <button
                @click="ubahStatus(mahasiswa, 'A')"
                type="button"
                class="w-9 h-9 rounded-full border text-[12px]"
                :class="mahasiswa.status === 'A'
                ? 'bg-red-500 text-white border-red-500'
                : 'border-gray-300'"
            >
                A
            </button>

            <button
                @click="ubahStatus(mahasiswa, 'H')"
                type="button"
                class="w-9 h-9 rounded-full border text-[12px]"
                :class="mahasiswa.status === 'H'
                ? 'bg-green-500 text-white border-green-500'
                : 'border-gray-300'"
            >
                H
            </button>

            <button
                @click="ubahStatus(mahasiswa, 'I')"
                type="button"
                class="w-9 h-9 rounded-full border text-[12px]"
                :class="mahasiswa.status === 'I'
                ? 'bg-yellow-500 text-white border-yellow-500'
                : 'border-gray-300'"
            >
                I
            </button>

            <button
                @click="ubahStatus(mahasiswa, 'S')"
                type="button"
                class="w-9 h-9 rounded-full border text-[12px]"
                :class="mahasiswa.status === 'S'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300'"
            >
                S
            </button>
            </div>
        </div>
    </div>

    <!-- pop up tambah materi -->
    <div
    v-if="showMateriModal"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white w-[420px] rounded-[10px] p-6 relative shadow-lg">

      <!-- CLOSE -->
      <button
        @click="showMateriModal = false"
        class="absolute top-3 right-4 text-[22px]"
      >
        ×
      </button>

      <h2 class="text-center text-[18px] font-semibold mb-4">
        Tambah Materi
      </h2>
      <!-- DESKRIPSI -->
      <label class="text-[13px]">Deskripsi Materi</label>
      <textarea
        v-model="deskripsiMateri"
        class="w-full border rounded px-3 py-2 mb-3 text-[13px]"
      />

      <!-- FILE -->
      <button
        @click="openFileLibrary"
          class=" text-[12px] px-6 py-2 bg-green-600 text-white rounded mb-2 hover:bg-green-500"
        >
          Tambah File
      </button>
      <label class="text-[13px]"></label>
      <input
        type="file"
        class="w-full border rounded px-3 py-2 text-[12px]"
        @change="handleFileUpload"
      />

      <!-- BUTTON -->
      <div class="flex justify-between mt-6">
        <button
          @click="showMateriModal = false"
          class="text-[12px] px-6 py-2 bg-red-700 text-white rounded hover:bg-red-500"
        >
          Batal
        </button>

        <button
          @click="submitMateri"
          class="text-[12px] px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
        >
          Simpan
        </button>
      </div>

    </div>
  </div>

  <div v-if="uploadedFiles && uploadedFiles.length > 0">
    <p class="text-[12px] font-semibold mb-2">File terupload:</p>

    <div
      v-for="(f, i) in uploadedFiles"
      :key="i"
      class="text-[12px] text-gray-600"
    >
       {{ f.name }}
    </div>
  </div>

  <!-- FILE LIBRARY POP-UP -->
<div
  v-if="showFileLibraryModal"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
>
  <div class="bg-white w-[520px] rounded-[10px] p-6 relative shadow-lg">

    <!-- CLOSE -->
    <button
      @click="showFileLibraryModal = false"
      class="absolute top-3 right-4 text-[22px]"
    >
      ×
    </button>

    <h2 class="text-center text-[18px] font-semibold mb-4">
      Media Library
    </h2>

    <!-- UPLOAD BAR -->
    <div class="flex justify-end mb-4">
      <button
        @click="triggerFileInput" type="button"
        class="bg-green-600 text-white px-4 py-2 rounded text-[12px] font-medium hover:bg-green-500"
      >
        Upload Baru
      </button>
      <input 
        type="file"
        ref="fileInput"
        class="hidden"
        multiple
        @change="handleUploadFile"
        >
    </div>

    <!-- FILE LIST -->
    <div class="max-h-[300px] overflow-y-auto border rounded-lg p-3 bg-gray-50">

      <div
        v-for="file in filesLibrary"
        :key="file.uuid"
        class="flex items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 hover:shadow-sm transition"
      >

        <!-- LEFT: checkbox + file name -->
        <div class="flex items-center gap-3">

          <input
            type="checkbox"
            :value="file.uuid"
            v-model="selectedFileUuids"
            class="w-4 h-4"
          />
          
          <!-- file name -->
          <span class="text-[13px] truncate max-w-[250px]">
            {{ file.name }}
          </span>

        </div>

        <!-- RIGHT: actions -->
        <div class="flex items-center gap-3">

          <!-- DOWNLOAD -->
          <button
            @click="downloadFile(file)"
            class="text-blue-600 hover:text-blue-800 transition"
          >
            <Download class="w-4 h-4" />
          </button>

          <!-- DELETE -->
          <button
            @click="deleteFile(file.uuid)"
            class="text-red-600 hover:text-red-800 transition"
          >
            <Trash2 class="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>

    <!-- BUTTON PILIH -->
    <div class="flex justify-end mt-4 gap-3">
      <button
        @click="showFileLibraryModal = false"
        class="text-[12px] px-6 py-2 bg-red-700 text-white rounded hover:bg-red-600"
      >
        Batal
      </button>
      <button
        @click="pilihFileLibrary"
        class="text-[12px] px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
      >
        Pilih
      </button>
    </div>

  </div>
</div>


  </adminLayout>
</template>