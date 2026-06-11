<script setup>
import adminLayout from "./adminLayout.vue";
import { useRoute } from "vue-router";
import { Search, UserRound } from "lucide-vue-next";
import { ref, computed, onMounted } from "vue";
import { kelasService } from "../services/kelas";

const route = useRoute();

const {
  getMahasiswaKelas,
  postPresensiMahasiswa,
  updatePresensiMahasiswa,
  getPresensiMahasiswa
} = kelasService();

const classId = route.query.class_id;

const searchMahasiswa = ref("");
const daftarMahasiswa = ref([]);
const showQrModal = ref(false);

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

//dummy
const informasiSesi = {
  mataKuliah: "Administrasi Database",
  kelas: "4A",
  dosen: "Aqsal Habibi",
  tanggal: "Jumat, 30 Mei 2025",
  waktu: "13:30 - 17:00",
  ruangan: "Lab Komputer",
  durasi: "240 menit",
};

const ringkasanPresensi = [
  {
    label: "Hadir",
    jumlah: 21,
    persen: "75%",
    color: "bg-green-500",
  },
  {
    label: "Izin",
    jumlah: 3,
    persen: "11%",
    color: "bg-yellow-400",
  },
  {
    label: "Sakit",
    jumlah: 2,
    persen: "7%",
    color: "bg-blue-300",
  },
  {
    label: "Alpha",
    jumlah: 2,
    persen: "7%",
    color: "bg-red-500",
  },
];
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
                <RouterLink to="/detail-kelas" class="hover:underline">
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
            <button @click="tutupSesi" class="bg-red-500 text-white px-4 py-2 rounded-[4px] text-[12px] font-semibold" >
                Tutup Sesi
            </button>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-5 mb-5">
        <!-- info sesi -->
        <div class="bg-white rounded-[6px] shadow">
            <h2 class="text-center font-semibold text-[15px] py-3 border-b border-gray-300">
            Informasi Sesi
            </h2>

            <div class="p-4 space-y-4 text-[12px]">
                <div class="grid grid-cols-2">
                    <p>Mata Kuliah</p>
                    <p>{{ informasiSesi.mataKuliah }}</p>
                </div>

                <div class="grid grid-cols-2">
                    <p>Kelas</p>
                    <p>{{ informasiSesi.kelas }}</p>
                </div>

                <div class="grid grid-cols-2">
                    <p>Dosen</p>
                    <p>{{ informasiSesi.dosen }}</p>
                </div>

                <div class="grid grid-cols-2">
                    <p>Tanggal</p>
                    <p>{{ informasiSesi.tanggal }}</p>
                </div>

                <div class="grid grid-cols-2">
                    <p>Waktu</p>
                    <p>{{ informasiSesi.waktu }}</p>
                </div>

                <div class="grid grid-cols-2">
                    <p>Ruangan</p>
                    <p>{{ informasiSesi.ruangan }}</p>
                </div>

                <div class="grid grid-cols-2">
                    <p>Durasi Presensi</p>
                    <p>{{ informasiSesi.durasi }}</p>
                </div>
            </div>
        </div>

        <!-- RINGKASAN PRESENSI -->
        <div class="bg-white rounded-[6px] shadow">
            <h2 class="text-center font-semibold text-[15px] py-3 border-b border-gray-300">
            Ringkasan Presensi
            </h2>

            <div class="p-6 space-y-5 text-[12px]">
                <div v-for="item in ringkasanPresensi" :key="item.label" class="grid grid-cols-[40px_1fr_40px_50px] items-center">
                    <span class="w-4 h-4 rounded-full" :class="item.color"></span>
                    <p>{{ item.label }}</p>
                    <p>{{ item.jumlah }}</p>
                    <p>{{ item.persen }}</p>
                </div>

                <div class="grid grid-cols-[1fr_60px] pt-5 text-[13px] font-semibold">
                    <p>Total Mahasiswa</p>
                    <p>28</p>
                </div>
            </div>
        </div>
    </div>

    <!-- presensi mahasiswa -->
    <div class="mt-3">
        <h2 class="text-[15px] font-semibold mb-3">
            Daftar Presensi Mahasiswa
        </h2>

        <button
        @click="simpanPresensi"
        class="bg-green-600 text-white text-[12px] px-4 py-2 rounded-md mb-4"
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

    <div v-if="showQrModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div class="bg-white w-[520px] h-[360px] rounded-[5px] border border-blue-900 shadow-md relative flex flex-col">
            <button @click="closeQrModal" class="absolute top-3 right-5 text-[36px] leading-none">
            ×
            </button>

            <h1 class="text-center text-[24px] font-bold mt-5">PRESENSI</h1>

            <div class="flex-1 flex items-center justify-center">
            <!-- nanti QR dari API taruh di sini -->
            </div>

            <p class="text-center text-[11px] mb-6">pastikan QR code terlihat jelas oleh mahasiswa</p>
        </div>
    </div>
  </adminLayout>
</template>