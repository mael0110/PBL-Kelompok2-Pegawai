<script setup>
import AdminLayout from "./adminLayout.vue";
import { ref, onMounted } from "vue";
import { IdCard, Mail, Phone } from "lucide-vue-next";
import { authService } from "../services/auth";
import { profileStore } from "../assets/profile";

const { getProfile, updateEmployee } = authService();

// 🟢 Menggunakan employeeId default/initial pilihanmu
const employeeId = ref("019eea91-3220-70da-820b-b7aaab9d6a13");

// state profile dengan property penampung asli dari relasi objek API Anda
const profile = ref({
  photo: "",
  name: "",
  nip: "",
  nik: "",
  email: "",
  phone: "",
  jabatan: "Dosen",
  gender: "",
  birth_place: "",
  address: "",
  village: "",
  district: "",
  city: "",
  province: "",
  citizen: ""
});

// ambil foto dari localStorage
const savedPhoto = localStorage.getItem("profile_photo");
if (savedPhoto) profile.value.photo = savedPhoto;

onMounted(async () => {
  try {
    const res = await getProfile();
    
    let data = null;

    // Menangani struktur response list array atau single object dari API Anda
    if (res && Array.isArray(res.data)) {
      if (res.data.length > 0) data = res.data[0];
    } else if (res && res.data) {
      data = res.data;
    } else if (res) {
      data = res;
    }

    if (data) {
      // Ambil ID dinamis dari API jika tersedia untuk fungsi update
      employeeId.value = data.id || data.employee_id || employeeId.value;

      // 🟢 PEMETAAN MURNI 100% DARI PROPERTY API ASLI ANDA
      profile.value.name = data.employee_name;
      profile.value.nip = data.nip;
      profile.value.nik = data.nik;
      profile.value.email = data.nip + "@dosen.com";
      profile.value.phone = data.phone_number;
      
      // Data Biodata Tambahan dari API
      profile.value.gender = data.gender === 'female' ? 'Perempuan' : 'Laki-laki';
      profile.value.birth_place = data.birth_place + ", " + (data.birth_date || "");
      
      // Data Alamat Struktural hasil relasi API Anda (village, district, city, province, citizen)
      profile.value.address = data.address;
      profile.value.village = data.village?.name || "-";
      profile.value.district = data.district?.name || "-";
      profile.value.city = data.city?.name || "-";
      profile.value.province = data.province?.name || "-";
      profile.value.citizen = data.citizen?.name || "Indonesia";

      if (!profile.value.photo && data.photo) {
        profile.value.photo = data.photo;
        localStorage.setItem("profile_photo", data.photo);
        profileStore.photo = data.photo;
      }
    }
  } catch (error) {
    console.error("Gagal ambil profile:", error.response?.data || error);
  }
});

// file input
const fileInput = ref(null);

const openFilePicker = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result;
    profile.value.photo = base64;
    profileStore.photo = base64;
    localStorage.setItem("profile_photo", base64);
  };
  reader.readAsDataURL(file);
};

// edit modal
const showEditModal = ref(false);

const editForm = ref({
  name: "",
  nip: "",
  nik: "",
});

const openEditModal = () => {
  editForm.value = {
    name: profile.value.name,
    nip: profile.value.nip,
    nik: profile.value.nik,
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const saveProfile = async () => {
  try {
    const payload = {
      employee_name: editForm.value.name,
      nip: editForm.value.nip,
      nik: editForm.value.nik,
    };

    await updateEmployee(employeeId.value, payload);

    profile.value.name = editForm.value.name;
    profile.value.nip = editForm.value.nip;
    profile.value.nik = editForm.value.nik;

    showEditModal.value = false;
  } catch (error) {
    console.error("Gagal update profile:", error.response?.data || error);
  }
};
</script>

<template>
<admin-layout>
  <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="hidden" style="display: none;" />

  <h1 class="text-[22px] font-bold mb-5">PROFIL</h1>

  <div class="bg-gray-100 min-h-screen">

    <div class="bg-white rounded-xl shadow-sm p-5 flex justify-between items-end">

      <div class="flex items-start gap-4">

        <div class="flex flex-col items-center">

          <img
            :src="profile.photo || 'https://placehold.co/150'"
            class="w-[90px] h-[90px] rounded-full object-cover border"
          />

          <button
            @click="openFilePicker"
            class="mt-2 bg-blue-900 text-white px-3 py-1 rounded text-[12px]"
          >
            Ubah Foto
          </button>

        </div>

        <div>
          <h2 class="font-bold text-[16px]">
            {{ profile.name }}
          </h2>

          <span class="inline-block mt-1 px-2 py-[2px] bg-blue-100 text-blue-700 text-xs rounded">
            {{ profile.jabatan }}
          </span>

          <p class="text-[12px] text-gray-500 mt-1">
            Fakultas Teknik - Program Studi Teknik Informatika
          </p>
        </div>

      </div>

      <div>
        <button
          @click="openEditModal"
          class="border border-blue-900 px-3 hover:bg-gray-100 py-1 rounded text-[13px]"
        >
          Edit Profil
        </button>
      </div>

    </div>

    <div class="grid grid-cols-2 gap-4 mt-5">

      <div class="bg-white p-5 rounded-xl shadow-sm">

        <h3 class="font-semibold mb-4">INFORMASI PRIBADI</h3>

        <div class="space-y-3 text-[14px]">

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>NIP</span>
            <span class="text-center">:</span>
            <span>{{ profile.nip }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>NIK</span>
            <span class="text-center">:</span>
            <span>{{ profile.nik }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Nama Lengkap</span>
            <span class="text-center">:</span>
            <span>{{ profile.name }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Jenis Kelamin</span>
            <span class="text-center">:</span>
            <span>{{ profile.gender }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Tempat, Tgl Lahir</span>
            <span class="text-center">:</span>
            <span>{{ profile.birth_place }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>No Telepon</span>
            <span class="text-center">:</span>
            <span>{{ profile.phone }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Kewarganegaraan</span>
            <span class="text-center">:</span>
            <span>{{ profile.citizen }}</span>
          </div>

        </div>
      </div>

      <div class="bg-white p-5 rounded-xl shadow-sm">

        <h3 class="font-semibold mb-4">ALAMAT</h3>

        <div class="space-y-3 text-[14px]">

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Alamat</span>
            <span class="text-center">:</span>
            <span>{{ profile.address }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Kelurahan</span>
            <span class="text-center">:</span>
            <span>{{ profile.village }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Kecamatan</span>
            <span class="text-center">:</span>
            <span>{{ profile.district }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Kabupaten/Kota</span>
            <span class="text-center">:</span>
            <span>{{ profile.city }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Provinsi</span>
            <span class="text-center">:</span>
            <span>{{ profile.province }}</span>
          </div>

          <div class="grid grid-cols-[160px_20px_1fr]">
            <span>Negara</span>
            <span class="text-center">:</span>
            <span>{{ profile.citizen }}</span>
          </div>

        </div>
      </div>

    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div class="bg-white w-[420px] p-5 rounded-xl">
        <h2 class="font-bold mb-3">Edit Profil</h2>

        <input v-model="editForm.name" class="border w-full p-2 mb-2 rounded" />
        <input v-model="editForm.nip" class="border w-full p-2 mb-2 rounded" />
        <input v-model="editForm.nik" class="border w-full p-2 mb-2 rounded" />

        <div class="flex justify-end gap-2 mt-3">
          <button @click="closeEditModal" class="px-3 py-1 border rounded">Batal</button>
          <button @click="saveProfile" class="px-3 py-1 bg-blue-900 text-white rounded">Simpan</button>
        </div>
      </div>
    </div>

  </div>
</admin-layout>
</template>