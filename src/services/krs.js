import axios from "axios";

export function krsService() {
  // 1. Ambil data list pengajuan KRS Mahasiswa
  async function getKRS() {
    try {
      const response = await axios.get("https://api-mahasiswa-4a.akufarish.my.id:8874/api/krs-detail", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Gagal memuat data KRS dari API:", error.response?.data || error.message);
      throw error;
    }
  }

  // 2. Ambil master data daftar prodi
  async function getProdi() {
    try {
      const response = await axios.get("https://be.karlearn.site/api/prodi", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Gagal memuat data prodi:", error.response?.data || error.message);
      throw error;
    }
  }

  // 3. Ambil detail KRS (Mata Kuliah) berdasarkan NIM dan ID KRS
  async function getKRSDetail(nim, idKrs) {
    try {
      const response = await axios.get(`https://api-mahasiswa-4a.akufarish.my.id:8874/api/mahasiswa/${nim}/krs/${idKrs}/detail`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Gagal memuat detail KRS:", error.response?.data || error.message);
      throw error;
    }
  }

  // 4. Ambil master data Mata Kuliah
  async function getMataKuliah() {
    try {
      const response = await axios.get("https://be.karlearn.site/api/mata-kuliah", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Gagal memuat data mata kuliah:", error.response?.data || error.message);
      throw error;
    }
  }

  // 5. Ambil data KRS Show (Informasi Umum/Utama KRS)
  async function getKRSShow(nim, idKrs) {
    try {
      const response = await axios.get(`https://api-mahasiswa-4a.akufarish.my.id:8874/api/mahasiswa/${nim}/krs/${idKrs}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Gagal memuat data KRS Show:", error.response?.data || error.message);
      throw error;
    }
  }

  // 6. API BARU: Update status dan catatan pembimbing KRS (PUT)
  async function updateKRS(nim, idKrs, payload) {
    try {
      const response = await axios.put(`https://api-mahasiswa-4a.akufarish.my.id:8874/api/mahasiswa/${nim}/krs/${idKrs}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
      });
      console.log("berhasi up krs", response.data)
      return response.data;
    } catch (error) {
      console.error("Gagal melakukan update data KRS:", error.response?.data || error.message);
      throw error;
    }
  }

  return { 
    getKRS,
    getProdi,
    getKRSDetail,
    getMataKuliah,
    getKRSShow,
    updateKRS // Export fungsi baru
  };
}