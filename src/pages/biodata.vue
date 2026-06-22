<script setup>
import AdminLayout from "./adminLayout.vue";
import { ref, onMounted, reactive } from "vue";
import { IdCard, Mail, Phone, X } from "lucide-vue-next";
import { authService } from "../services/auth";
import { profileStore } from "../assets/profile";
import { wilayahService } from "../services/wilayah"; // 🟢 Import service wilayah yang sama

const { getProfile, updateEmployee } = authService();

// Gunakan wilayahService bawaan kamu
const {
  provinces,
  cities,
  districts,
  villages,
  getProvinces,
  getCities,
  getDistricts,
  getVillages,
} = wilayahService();

const employeeId = ref("019eea91-3220-70da-820b-b7aaab9d6a13");

// State profile utama untuk penampilan halaman biodata
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

// State untuk Pop-up Kustom Pengganti Alert
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

// Ambil foto dari localStorage
const savedPhoto = localStorage.getItem("profile_photo");
if (savedPhoto) profile.value.photo = savedPhoto;

onMounted(async () => {
  try {
    // Load data provinsi awal
    await getProvinces();

    const res = await getProfile();
    let data = null;

    if (res && Array.isArray(res.data)) {
      if (res.data.length > 0) data = res.data[0];
    } else if (res && res.data) {
      data = res.data;
    } else if (res) {
      data = res;
    }

    if (data) {
      employeeId.value = data.id || data.employee_id || employeeId.value;

      profile.value.name = data.employee_name;
      profile.value.nip = data.nip;
      profile.value.nik = data.nik;
      profile.value.email = data.nip + "@dosen.com";
      profile.value.phone = data.phone_number;
      
      profile.value.gender = data.gender === 'female' ? 'Perempuan' : 'Laki-laki';
      profile.value.birth_place = data.birth_place + ", " + (data.birth_date || "");
      
      profile.value.address = data.address;
      profile.value.village = data.village?.name || "-";
      profile.value.district = data.district?.name || "-";
      profile.value.city = data.city?.name || "-";
      profile.value.province = data.province?.name || "-";
      profile.value.citizen = data.citizen?.name || "Indonesia";

      // Simpan data kode wilayah awal ke editForm reactive saat data masuk
      editForm.province_code = data.province_code || "";
      editForm.city_code = data.city_code || "";
      editForm.district_code = data.district_code || "";
      editForm.village_code = data.village_code || "";

      // Panggil dependensi wilayah berantai agar pilihan awal muncul di edit modal
      if (data.province_code) await getCities(data.province_code);
      if (data.city_code) await getDistricts(data.city_code);
      if (data.district_code) await getVillages(data.district_code);

      if (!profile.value.photo && data.photo) {
        profile.value.photo = data.photo;
        localStorage.setItem("profile_photo", data.photo);
        profileStore.photo = data.photo;
      }
    }
  } catch (error) {
    console.error("Gagal ambil profile:", error.response?.data || error);
    showAlertPopup("Gagal mengambil data profil dari server.");
  }
});

// File input handle
const fileInput = ref(null);
const openFilePicker = () => { fileInput.value.click(); };
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result;
    profile.value.photo = base64;
    profileStore.photo = base64;
    localStorage.setItem("profile_photo", base64);
    showAlertPopup("Foto profil berhasil diperbarui!");
  };
  reader.readAsDataURL(file);
};

// Edit modal state & form reactive disesuaikan penamaan kodenya
const showEditModal = ref(false);

const editForm = reactive({
  name: "",
  nip: "",
  nik: "",
  gender: "",
  birth_place: "",
  birth_date: "",
  phone: "",
  address: "",
  province_code: "",
  city_code: "",
  district_code: "",
  village_code: "",
  citizen_code: "ID"
});

const openEditModal = async () => {
  const bpParts = profile.value.birth_place.split(", ");
  
  editForm.name = profile.value.name;
  editForm.nip = profile.value.nip;
  editForm.nik = profile.value.nik;
  editForm.gender = profile.value.gender === 'Perempuan' ? 'female' : 'male';
  editForm.birth_place = bpParts[0] || "";
  editForm.birth_date = bpParts[1] || "";
  editForm.phone = profile.value.phone;
  editForm.address = profile.value.address;
  
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

// Fungsi Handle Perubahan Wilayah (Sama persis dengan logic referensimu)
const handleProvinceChange = async () => {
  editForm.city_code = "";
  editForm.district_code = "";
  editForm.village_code = "";
  await getCities(editForm.province_code);
};

const handleCityChange = async () => {
  editForm.district_code = "";
  editForm.village_code = "";
  await getDistricts(editForm.city_code);
};

const handleDistrictChange = async () => {
  editForm.village_code = "";
  await getVillages(editForm.district_code);
};

const saveProfile = async () => {
  try {
    const payload = {
      employee_name: editForm.name,
      nip: editForm.nip,
      nik: editForm.nik,
      gender: editForm.gender,
      birth_place: editForm.birth_place,
      birth_date: editForm.birth_date,
      phone_number: editForm.phone,
      address: editForm.address,
      province_code: editForm.province_code,
      city_code: editForm.city_code,
      district_code: editForm.district_code,
      village_code: editForm.village_code,
      citizen_code: "ID"
    };

    await updateEmployee(employeeId.value, payload);

    // Update tampilan data setelah sukses submit
    profile.value.name = editForm.name;
    profile.value.nip = editForm.nip;
    profile.value.nik = editForm.nik;
    profile.value.gender = editForm.gender === 'female' ? 'Perempuan' : 'Laki-laki';
    profile.value.birth_place = editForm.birth_place + ", " + editForm.birth_date;
    profile.value.phone = editForm.phone;
    profile.value.address = editForm.address;

    // Menarik nama text dari list array wilayah terpilih untuk view halaman utama
    profile.value.province = provinces.value.find(p => p.code === editForm.province_code)?.name || "-";
    profile.value.city = cities.value.find(c => c.code === editForm.city_code)?.name || "-";
    profile.value.district = districts.value.find(d => d.code === editForm.district_code)?.name || "-";
    profile.value.village = villages.value.find(v => v.code === editForm.village_code)?.name || "-";

    showEditModal.value = false;
    showAlertPopup("Profil berhasil diperbarui!");
  } catch (error) {
    console.error("Gagal update profile:", error.response?.data || error);
    showAlertPopup("Gagal memperbarui profil.");
  }
};
</script>

<template>
<admin-layout>
  <div v-if="customAlert.show" class="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded shadow-lg text-[11px] z-[9999] transition-all duration-300">
    {{ customAlert.message }}
  </div>

  <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="hidden" style="display: none;" />

  <h1 class="text-[16px] font-bold mb-4">PROFIL</h1>

  <div class="bg-gray-100 min-h-screen">

    <div class="bg-white rounded-xl shadow-sm p-4 flex justify-between items-end">

      <div class="flex items-start gap-4">

        <div class="flex flex-col items-center">

          <img
            :src="profile.photo || 'https://placehold.co/150'"
            class="w-[75px] h-[75px] rounded-full object-cover border"
          />

          <button
            @click="openFilePicker"
            class="mt-2 bg-blue-900 text-white px-2.5 py-1 rounded text-[10px]"
          >
            Ubah Foto
          </button>

        </div>

        <div>
          <h2 class="font-bold text-[14px]">
            {{ profile.name }}
          </h2>

          <span class="inline-block mt-1 px-2 py-[1px] bg-blue-100 text-blue-700 text-[10px] rounded">
            {{ profile.jabatan }}
          </span>

          <p class="text-[11px] text-gray-500 mt-1">
            Fakultas Teknik - Program Studi Teknik Informatika
          </p>
        </div>

      </div>

      <div>
        <button
          @click="openEditModal"
          class="border border-blue-900 px-2.5 hover:bg-gray-100 py-1 rounded text-[11px]"
        >
          Edit Profil
        </button>
      </div>

    </div>

    <div class="grid grid-cols-2 gap-4 mt-4">

      <div class="bg-white p-4 rounded-xl shadow-sm">

        <h3 class="font-semibold text-[12px] mb-3">INFORMASI PRIBADI</h3>

        <div class="space-y-2.5 text-[11px]">

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>NIP</span>
            <span class="text-center">:</span>
            <span>{{ profile.nip }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>NIK</span>
            <span class="text-center">:</span>
            <span>{{ profile.nik }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Nama Lengkap</span>
            <span class="text-center">:</span>
            <span>{{ profile.name }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Jenis Kelamin</span>
            <span class="text-center">:</span>
            <span>{{ profile.gender }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Tempat, Tgl Lahir</span>
            <span class="text-center">:</span>
            <span>{{ profile.birth_place }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>No Telepon</span>
            <span class="text-center">:</span>
            <span>{{ profile.phone }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Kewarganegaraan</span>
            <span class="text-center">:</span>
            <span>{{ profile.citizen }}</span>
          </div>

        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm">

        <h3 class="font-semibold text-[12px] mb-3">ALAMAT</h3>

        <div class="space-y-2.5 text-[11px]">

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Alamat</span>
            <span class="text-center">:</span>
            <span>{{ profile.address }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Kelurahan</span>
            <span class="text-center">:</span>
            <span>{{ profile.village }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Kecamatan</span>
            <span class="text-center">:</span>
            <span>{{ profile.district }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Kabupaten/Kota</span>
            <span class="text-center">:</span>
            <span>{{ profile.city }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Provinsi</span>
            <span class="text-center">:</span>
            <span>{{ profile.province }}</span>
          </div>

          <div class="grid grid-cols-[140px_20px_1fr]">
            <span>Negara</span>
            <span class="text-center">:</span>
            <span>{{ profile.citizen }}</span>
          </div>

        </div>
      </div>

    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 rounded-xl text-[11px] relative shadow-xl">
        
        <button @click="closeEditModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X class="w-4 h-4" />
        </button>

        <h2 class="font-bold text-[13px] mb-4 tracking-wide">EDIT PROFIL</h2>

        <div class="space-y-3">
          <div>
            <label class="block text-gray-600 mb-1">Nama Lengkap</label>
            <input v-model="editForm.name" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="Nama Lengkap" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-600 mb-1">NIP</label>
              <input v-model="editForm.nip" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="NIP" />
            </div>
            <div>
              <label class="block text-gray-600 mb-1">NIK</label>
              <input v-model="editForm.nik" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="NIK" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-600 mb-1">Jenis Kelamin</label>
              <select v-model="editForm.gender" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900 bg-white">
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-600 mb-1">Tempat Lahir</label>
              <input v-model="editForm.birth_place" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="Tempat Lahir" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-600 mb-1">Tanggal Lahir</label>
              <input type="date" v-model="editForm.birth_date" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" />
            </div>
            <div>
              <label class="block text-gray-600 mb-1">Nomor Telepon</label>
              <input v-model="editForm.phone" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="Nomor Telepon" />
            </div>
          </div>

          <div>
            <label class="block text-gray-600 mb-1">Alamat</label>
            <input v-model="editForm.address" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="Alamat" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-600 mb-1">Provinsi</label>
              <select v-model="editForm.province_code" @change="handleProvinceChange" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900 bg-white">
                <option value="">Pilih Provinsi</option>
                <option v-for="item in provinces" :key="item.id" :value="item.code">
                  {{ item.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-gray-600 mb-1">Kabupaten/Kota</label>
              <select v-model="editForm.city_code" @change="handleCityChange" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900 bg-white">
                <option value="">Pilih Kota</option>
                <option v-for="item in cities" :key="item.id" :value="item.code">
                  {{ item.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-600 mb-1">Kecamatan</label>
              <select v-model="editForm.district_code" @change="handleDistrictChange" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900 bg-white">
                <option value="">Pilih Kecamatan</option>
                <option v-for="item in districts" :key="item.id" :value="item.code">
                  {{ item.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-gray-600 mb-1">Kelurahan</label>
              <select v-model="editForm.village_code" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900 bg-white">
                <option value="">Pilih Desa/Kelurahan</option>
                <option v-for="item in villages" :key="item.id" :value="item.code">
                  {{ item.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-gray-600 mb-1">Kewarganegaraan</label>
            <input v-model="editForm.citizen" class="border w-full p-2 rounded focus:outline-none focus:border-blue-900" placeholder="Kewarganegaraan" disabled />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-5">
          <button type="button" @click="closeEditModal" class="px-4 py-1.5 border rounded text-white bg-red-500 border-red-500 rounded-md">Batal</button>
          <button type="button" @click="saveProfile" class="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 rounded-md">Simpan</button>
        </div>
      </div>
    </div>

  </div>
</admin-layout>
</template>