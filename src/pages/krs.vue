<script setup>
import adminLayout from "./adminLayout.vue";
import { ref, onMounted, computed } from "vue";
import { krsService } from "../services/krs";
import { Eye, Clock, CheckCircle, XCircle, X } from "lucide-vue-next";

// Ringkasan Counter Atas
const chartData = ref({
  menunggu: 0,
  disetujui: 0,
  ditolak: 0,
});

// Load service functions
const { getKRS, getProdi, getKRSDetail, getMataKuliah, getKRSShow, updateKRS } = krsService();
const krsList = ref([]);
const prodiList = ref([]); 
const mataKuliahList = ref([]); 

// State Filter & Search
const searchQuery = ref("");
const selectedProdiId = ref("");
const selectedStatus = ref("");

// State Interaksi UI
const isModalOpen = ref(false);
const selectedKrs = ref(null);
const catatanDosen = ref("");

// State Alert Custom
const customAlert = ref({
  show: false,
  message: ""
});

const showAlertPopup = (msg) => {
  customAlert.value.message = msg;
  customAlert.value.show = true;
  setTimeout(() => { 
    customAlert.value.show = false; 
  }, 3000);
};

// Format tanggal lokal Indonesia
const formatTanggal = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

// Merapikan nama prodi mentah
const formatNamaProdi = (teksMentah) => {
  if (!teksMentah) return "-";
  return teksMentah
    .replace(/-/g, " ") 
    .split(" ")         
    .map(kata => kata.charAt(0).toUpperCase() + kata.slice(1).toLowerCase()) 
    .join(" ");         
};

// Mengubah ID Prodi menjadi Nama Prodi teks
const getNamaProdi = (prodiId) => {
  if (!prodiId) return "-";
  const list = prodiList.value?.data || prodiList.value || [];
  const found = list.find(p => String(p.id) === String(prodiId));
  if (found) {
    const namaMentah = found.nama_prodi || found.name || "";
    return formatNamaProdi(namaMentah);
  }
  return `Prodi ID: ${prodiId}`;
};

// Logika Real-time Filtering
const filteredKrsList = computed(() => {
  return krsList.value.filter((item) => {
    const matchesSearch = 
      item.nama_mahasiswa?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.nim?.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesProdi = 
      !selectedProdiId.value || String(item.prodi_id) === String(selectedProdiId.value);
    const matchesStatus = 
      !selectedStatus.value || item.status_krs === selectedStatus.value;
    return matchesSearch && matchesProdi && matchesStatus;
  });
});

// Fungsi untuk me-load dan menghitung ulang data KRS dari API (Re-usable Fetch)
const fetchKRSData = async () => {
  try {
    const resKrs = await getKRS();
    const dataKrs = resKrs?.data || resKrs || [];
    krsList.value = dataKrs;

    let hitungMenunggu = 0;
    let hitungDisetujui = 0;
    let hitungDitolak = 0;

    dataKrs.forEach((item) => {
      if (item.status_krs === "Diajukan") hitungMenunggu++;
      else if (item.status_krs === "Divalidasi") hitungDisetujui++;
      else if (item.status_krs === "Draft") hitungDitolak++;
    });

    chartData.value = {
      menunggu: hitungMenunggu,
      disetujui: hitungDisetujui,
      ditolak: hitungDitolak,
    };
  } catch (error) {
    console.error("Gagal memuat ulang data list KRS:", error);
  }
};

// Memuat master data awal saat komponen terpasang
onMounted(async () => {
  try {
    const resProdi = await getProdi();
    prodiList.value = resProdi;

    const resMk = await getMataKuliah();
    mataKuliahList.value = resMk?.data?.items || resMk?.items || [];

    // Ambil data tabel & kounter chart awal
    await fetchKRSData();
  } catch (error) {
    console.error("Gagal menginisialisasi data halaman KRS:", error);
  }
});

// AKSI TOMBOL LIHAT DETAIL (MENGGUNAKAN DUA API SEKALIGUS)
const lihatDetail = async (item) => {
  try {
    const [resDetail, resShow] = await Promise.all([
      getKRSDetail(item.nim, item.id_krs),
      getKRSShow(item.nim, item.id_krs)
    ]);

    const krsDetailsRaw = resDetail?.data || [];
    const krsShowData = resShow?.data || {};

    let totalSksDihitung = 0;

    const mataKuliahMapped = krsDetailsRaw.map((detail, index) => {
      const matkulAsli = mataKuliahList.value.find(
        (mk) => String(mk.kode).trim().toLowerCase() === String(detail.mk_kode).trim().toLowerCase()
      );

      const sksMatkul = matkulAsli ? Number(matkulAsli.sks) : 0;
      totalSksDihitung += sksMatkul;

      return {
        no: index + 1,
        nama: matkulAsli ? matkulAsli.name : `Kode: ${detail.mk_kode}`,
        sks: sksMatkul || "-",
        kelas: item.kelas || "4A" 
      };
    });

    selectedKrs.value = {
      ...item, 
      ...krsShowData, 
      mata_kuliah: mataKuliahMapped,
      total_sks: totalSksDihitung
    };

    catatanDosen.value = selectedKrs.value.catatan_pembimbing || ""; 
    isModalOpen.value = true;
  } catch (error) {
    showAlertPopup("Gagal memuat rincian informasi dan mata kuliah mahasiswa.");
  }
};

// AKSI PROSES TOLAK KRS (UPDATE PUT -> "Draft")
const handleTolak = async () => {
  try {
    const payload = {
      tahunakademik_id: Number(selectedKrs.value.tahunakademik_id) || 0,
      semester_saat_ini: Number(selectedKrs.value.semester_saat_ini) || 1,
      batas_total_sks: Number(selectedKrs.value.batas_total_sks) || 0,
      status_krs: "Draft", // Mengubah status menjadi Draft (Perlu Perbaikan / Ditolak)
      catatan_pembimbing: catatanDosen.value
    };

    await updateKRS(selectedKrs.value.nim, selectedKrs.value.id_krs, payload);
    
    showAlertPopup(`KRS ${selectedKrs.value.nama_mahasiswa} ditolak dengan catatan: ${catatanDosen.value}`);
    isModalOpen.value = false;
    
    // Refresh isi tabel dan counter statistik
    await fetchKRSData();
  } catch (error) {
    showAlertPopup("Gagal memperbarui status penolakan KRS.");
  }
};

// AKSI PROSES SETUJU KRS (UPDATE PUT -> "Divalidasi")
const handleSetuju = async () => {
  try {
    const payload = {
      tahunakademik_id: Number(selectedKrs.value.tahunakademik_id) || 0,
      semester_saat_ini: Number(selectedKrs.value.semester_saat_ini) || 1,
      batas_total_sks: Number(selectedKrs.value.batas_total_sks) || 0,
      status_krs: "Divalidasi", // Mengubah status menjadi Divalidasi (Sudah Disetujui)
      catatan_pembimbing: catatanDosen.value
    };

    await updateKRS(selectedKrs.value.nim, selectedKrs.value.id_krs, payload);

    showAlertPopup(`KRS ${selectedKrs.value.nama_mahasiswa} telah disetujui!`);
    isModalOpen.value = false;
    
    // Refresh isi tabel dan counter statistik
    await fetchKRSData();
  } catch (error) {
    showAlertPopup("Gagal memperbarui status persetujuan KRS.");
  }
};

const namaField = (field) => {
  const map = { Draft: "Ditolak" };
  return map[field] || field;
};
</script>

<template>
<adminLayout>
  <div v-if="customAlert.show" class="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded shadow-lg text-[11px] z-[9999] transition-all duration-300">
    {{ customAlert.message }}
  </div>

  <h1 class="text-[16px] font-bold">VALIDASI KRS</h1>
  <p class="text-[12px] font-medium mb-4">Kelola dan Validasi Kartu Rencana Studi Mahasiswa</p>

  <div class="flex gap-4 mb-4">
    <div class="flex-1 bg-yellow-100 p-3 rounded flex items-center gap-3">
      <Clock size="36" class="text-yellow-500" />
      <div>
        <div class="text-[12px]">Menunggu Validasi</div>
        <div class="font-bold text-[16px]">{{ chartData.menunggu }} <span class="text-[12px]">KRS</span></div>
        <div class="text-[11px]">Perlu Tindakan</div>
      </div>
    </div>

    <div class="flex-1 bg-green-100 p-3 rounded flex items-center gap-3">
      <CheckCircle size="36" class="text-green-500" />
      <div>
        <div class="text-[12px]">Sudah Disetujui</div>
        <div class="font-bold text-[16px]">{{ chartData.disetujui }} <span class="text-[12px]">KRS</span></div>
        <div class="text-[11px]">Sudah Disetujui</div>
      </div>      
    </div>

    <div class="flex-1 bg-red-100 p-3 rounded flex items-center gap-3">
      <XCircle size="36" class="text-red-500" />
      <div>
        <div class="text-[12px]">Perlu Perbaikan</div>
        <div class="font-bold text-[16px]">{{ chartData.ditolak }} <span class="text-[12px]">KRS</span></div>
        <div class="text-[11px]">Perlu Diperbaiki</div>
      </div>
    </div>
  </div>

  <div class="flex gap-4 mb-4 text-[11px]">
    <input 
      v-model="searchQuery"
      type="text" 
      placeholder="Cari NIM atau Nama Mahasiswa" 
      class="shadow rounded px-3 py-1.5 flex-1 outline-none focus:ring-1 focus:ring-blue-900" 
    />
    
    <select 
      v-model="selectedProdiId"
      class="shadow rounded px-3 py-1.5 w-[150px] outline-none bg-white font-medium"
    >
      <option value="">Semua Prodi</option>
      <option 
        v-for="prodi in (prodiList.data || prodiList || [])" 
        :key="prodi.id" 
        :value="prodi.id"
      >
        {{ formatNamaProdi(prodi.nama_prodi || prodi.name) }}
      </option>
    </select>

    <select 
      v-model="selectedStatus"
      class="shadow rounded px-3 py-1.5 w-[130px] outline-none bg-white font-medium"
    >
      <option value="">Semua Status</option>
      <option value="Diajukan">Diajukan (Menunggu)</option>
      <option value="Divalidasi">Divalidasi (Setuju)</option>
      <option value="Draft">Draft (Ditolak)</option>
    </select>
  </div>

  <div class="bg-white rounded-xl shadow-md px-5">
    <div class="px-5 py-2.5"></div>

    <table class="w-full table-dashboard border-b border-gray-200">
      <thead>
        <tr class="bg-blue-100 font-semibold text-[13px]">
          <th class="p-2 text-left w-[30px]">NO</th>
          <th class="p-2 text-left">NIM</th>
          <th class="p-2 text-left">NAMA</th>
          <th class="p-2 text-left">PRODI</th>
          <th class="p-2 text-left">TANGGAL PENGAJUAN</th>
          <th class="p-2 text-left">STATUS</th>
          <th class="p-2 text-left">AKSI</th>
        </tr>
      </thead>

      <tbody class="font-medium text-[12px]">
        <tr v-for="(item, index) in filteredKrsList" :key="item.id_krs" class="hover:bg-gray-50 border-b border-gray-200">
          <td class="p-2">{{ index + 1 }}</td>
          <td class="p-2">{{ item.nim }}</td>
          <td class="p-2">{{ item.nama_mahasiswa }}</td>
          <td class="p-2">{{ getNamaProdi(item.prodi_id) }}</td>
          <td class="p-2">{{ formatTanggal(item.created_at) }}</td>
          <td class="p-2">
            <span 
              class="w-[90px] inline-block text-center py-1 rounded-lg text-[10px] font-semibold"
              :class="{
                'bg-yellow-200 text-yellow-700': item.status_krs === 'Diajukan',
                'bg-green-200 text-green-700': item.status_krs === 'Divalidasi',
                'bg-red-200 text-red-700': item.status_krs === 'Draft'
              }"
            >
              {{ namaField(item.status_krs) }}
            </span>
          </td>
          <td class="p-2 text-left">
            <button
              class="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition"
              @click="lihatDetail(item)"
            >
              <Eye class="w-4 h-4 text-blue-900" />
            </button>
          </td>
        </tr>
        <tr v-if="filteredKrsList.length === 0">
          <td colspan="7" class="p-4 text-center text-gray-400 italic text-[11px]">
            Data tidak ditemukan berdasarkan kriteria pencarian/filter.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 relative">
      
      <button @click="isModalOpen = false" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <X class="w-5 h-5" />
      </button>

      <h3 class="font-semibold text-[13px] mb-3 tracking-wide uppercase">DETAIL KRS MAHASISWA</h3>

      <div class="bg-blue-50/70 p-3 rounded-xl flex items-center gap-3 mb-4 border border-blue-100">
        <img 
          src="https://via.placeholder.com/150" 
          alt="Foto Mahasiswa" 
          class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div>
          <h4 class="font-medium text-[12px]">{{ selectedKrs.nama_mahasiswa }}</h4>
          <p class="font-medium text-[11px] text-gray-600">NIM: {{ selectedKrs.nim }}</p>
          <p class="font-bold text-[11px] text-blue-900">{{ getNamaProdi(selectedKrs.prodi_id) }}</p>
          <p class="font-medium text-[11px] text-gray-600">Semester: {{ selectedKrs.semester_saat_ini }} | TA ID: {{ selectedKrs.tahunakademik_id }}</p>
        </div>
      </div>

      <div class="mb-3">
        <h5 class="font-semibold text-[12px] mb-1">Mata Kuliah yang Diambil</h5>
        <div class="overflow-hidden border border-gray-100 rounded-lg shadow-sm">
          <table class="w-full text-[10px] text-left">
            <thead class="bg-blue-100">
              <tr>
                <th class="p-1.5 text-center w-8">NO</th>
                <th class="p-1.5">MATA KULIAH</th>
                <th class="p-1.5 text-center w-12">SKS</th>
                <th class="p-1.5 text-center w-14">KELAS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mk in selectedKrs.mata_kuliah" :key="mk.no" class="hover:bg-gray-50">
                <td class="p-1.5 text-center font-medium">{{ mk.no }}</td>
                <td class="p-1.5 font-medium">{{ mk.nama }}</td>
                <td class="p-1.5 text-center">{{ mk.sks }}</td>
                <td class="p-1.5 text-center">{{ mk.kelas }}</td>
              </tr>
              <tr class="bg-blue-100 font-semibold">
                <td colspan="2" class="p-1.5 pl-3 text-left">Total Dihitung</td>
                <td colspan="2" class="p-1.5 text-right pr-4">{{ selectedKrs.total_sks }} SKS</td>
              </tr>
              <tr class="bg-blue-100 font-semibold border-t border-blue-100">
                <td colspan="2" class="p-1.5 pl-3 text-left">Batas SKS Maksimal</td>
                <td colspan="2" class="p-1.5 text-right pr-4">{{ selectedKrs.batas_total_sks }} SKS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-[10px] font-bold mb-1">
          Catatan Dosen <span class="text-gray-500 font-normal"><i>(Opsional)</i></span>
        </label>
        <div class="relative">
          <textarea 
            v-model="catatanDosen"
            placeholder="Tambahkan Catatan untuk Mahasiswa..." 
            maxLength="200"
            rows="2"
            class="w-full p-2 border border-gray-200 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-gray-300"
          ></textarea>
          <span class="absolute bottom-2 right-3 text-[9px] text-gray-400 font-medium">
            {{ catatanDosen.length }}/200
          </span>
        </div>
      </div>

      <div class="flex justify-center gap-3">
        <button 
          @click="handleTolak"
          class="px-6 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] transition-colors shadow-md shadow-red-200"
        >
          Tolak
        </button>
        <button 
          @click="handleSetuju"
          class="px-6 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] transition-colors shadow-md shadow-emerald-200"
        >
          Setuju
        </button>
      </div>

    </div>
  </div>

</adminLayout>
</template>