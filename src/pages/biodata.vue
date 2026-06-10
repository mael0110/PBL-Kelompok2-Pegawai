<script setup>
import AdminLayout from "./adminLayout.vue";
import { ref, onMounted } from "vue";
import { IdCard, Mail, Phone } from "lucide-vue-next";
import { authService } from "../services/auth";
import { profileStore } from "../assets/profile";

const { getProfile, updateEmployee } = authService();
const employeeId = "019e4314-e2b6-729a-aced-f5cf529a1cee";

// state profile
const profile = ref({
  photo: "",
  name: "",
  nip: "",
  nik: "",
  email: "",
  phone: "",
  jabatan: "Dosen",
});

// ambil foto dari localStorage (tetap stay walau refresh/logout)
const savedPhoto = localStorage.getItem("profile_photo");
if (savedPhoto) profile.value.photo = savedPhoto;

onMounted(async () => {
  try {
    const res = await getProfile(employeeId);
    const data = res.data;

    profile.value.name = data.employee_name;
    profile.value.nip = data.nip;
    profile.value.nik = data.nik;
    profile.value.email = data.nip + "@dosen.com";
    profile.value.phone = data.phone_number;

    if (!profile.value.photo && data.photo) {
      profile.value.photo = data.photo;
      localStorage.setItem("profile_photo", data.photo);
      profileStore.photo = data.photo;
    }
  } catch (error) {
    console.error("Gagal ambil profile:", error.response?.data || error);
  }
});

// file input untuk upload foto
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
  };

  reader.readAsDataURL(file);
};

// edit modal
const showEditModal = ref(false);

const editForm = ref({
  name: "",
  nip: "",
  nik: "",
  email: "",
  phone: "",
});

const openEditModal = () => {
  editForm.value = {
    name: profile.value.name,
    nip: profile.value.nip,
    nik: profile.value.nik,
  };

  showEditModal.value = true;
};

const closeEditModal = () => { showEditModal.value = false; };

const saveProfile = async () => {
  try {
    const payload = {
      employee_name: editForm.value.name,
      nip: editForm.value.nip,
      nik: editForm.value.nik,
    };

    const res = await updateEmployee(employeeId, payload);

    profile.value.name = editForm.value.name;
    profile.value.nip = editForm.value.nip;
    profile.value.nik = editForm.value.nik;

    showEditModal.value = false;

    console.log("Update sukses:", res);
  } catch (error) {
    console.error("Gagal update profile:", error.response?.data || error);
  }
};
</script>

<template>
<admin-layout>
  <h1 class="text-[20px] font-bold mb-5">PROFIL</h1>

  <div class="p-6 bg-gray-100 min-h-screen">
    <div class="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-10">
      <!-- Left -->
      <div class="w-full md:w-[350px] flex flex-col items-center text-center">
        <div class="w-[200px] h-[200px] rounded-full overflow-hidden border">
          <img :src="profile.photo" class="w-full h-full object-cover"/>
        </div>
        <h2 class="mt-4 font-bold text-[15px]">{{ profile.name }}</h2>
        <p class="text-[15px] text-gray-500">Politeknik Negeri Banjarmasin</p>
        <span class="mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{{ profile.jabatan }}</span>

        <input type="file" ref="fileInput" @change="handleFileChange" class="hidden"/>
        <button @click="openFilePicker" class="text-[13px] mt-4 flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
          Ubah Foto
        </button>
      </div>

      <!-- Right -->
      <div class="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 py-[60px]">
        <div class="flex items-center font-semibold gap-2 text-[15px]"><IdCard size="28" /> NIP</div>
        <div class="flex items-center font-semibold text-[15px]">: {{ profile.nip }}</div>

        <div class="flex items-center font-semibold gap-2 text-[15px]"><IdCard size="28" /> NIK</div>
        <div class="flex items-center font-semibold text-[15px]">: {{ profile.nik }}</div>

        <div class="flex items-center font-semibold gap-2 text-[15px]"><Mail size="24" /> Email</div>
        <div class="flex items-center font-semibold text-[15px]">: {{ profile.email }}</div>

        <div class="flex items-center font-semibold gap-2 text-[15px]"><Phone size="24" /> No. HP</div>
        <div class="flex items-center font-semibold text-[15px]">: {{ profile.phone }}</div>
      </div>
    </div>

    <div class="flex justify-end mt-4">
      <button @click="openEditModal" class="bg-blue-900 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-[14px] hover:bg-blue-800">
        Edit Profil
      </button>
    </div>

    <!-- Modal Edit Profil -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-[420px] rounded-xl shadow-lg p-6 relative">
        <button @click="closeEditModal" class="absolute top-3 right-3 text-xl">×</button>
        <h2 class="text-lg font-bold mb-4">Edit Profil</h2>
        <div class="space-y-3">
          <div>
            <label class="text-xs">Nama</label>
            <input v-model="profile.name" class="w-full border p-2 rounded text-sm" />
          </div>
          <div>
            <label class="text-xs">NIP</label>
            <input v-model="profile.nip" class="w-full border p-2 rounded text-sm" />
          </div>
          <div>
            <label class="text-xs">NIK</label>
            <input v-model="profile.nik" class="w-full border p-2 rounded text-sm" />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-5">
          <button @click="closeEditModal" class="px-4 py-2 border rounded text-sm">Batal</button>
          <button @click="saveProfile" class="px-4 py-2 bg-blue-900 text-white rounded text-sm">Simpan</button>
        </div>
      </div>
    </div>
  </div>
</admin-layout>
</template>