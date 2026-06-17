import axios from "axios";
import { ref } from "vue";

export function kelasService() {
  const meta = ref({});

  async function getSesiPengampu(pengampuId, page = 1) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/pengampu/${pengampuId}`,
        {
          params: { page },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      meta.value = res.data.meta;
      return res.data.data || [];
    } catch (error) {
      console.error("Gagal ambil sesi pengampu:", error.response?.data || error);
      return [];
    }
  }

  // API LAMA (Tetap Dipertahankan & Tidak Dihapus)
  async function getKelas(kelasId = "") {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://be.karlearn.site/api/pengampu/kelas/${kelasId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Response API Kelas Lama:", res.data);
      return res.data?.data || [];
    } catch (error) {
      console.error("Gagal ambil kelas lama:", error.response?.data || error);
      return [];
    }
  }

  // FUNGSI BARU: Untuk Mengambil Kelas Berdasarkan Nama Prodi
  async function getKelasByProdi(prodiName = "teknik-informatika") {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://be.karlearn.site/api/kelas/prodi/${prodiName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Response API Kelas Prodi:", res.data);
      // Mengambil properti items sesuai struktur JSON baru
      return res.data?.data?.items || [];
    } catch (error) {
      console.error("Gagal ambil kelas prodi:", error.response?.data || error);
      return [];
    }
  }

  async function getDetailKelas(classId, page = 1) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions?class_id=${classId}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error("Gagal ambil detail kelas:", error.response?.data || error);
      return null;
    }
  }

  async function getMahasiswaKelas(classId) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://be.karlearn.site/api/kelas/019e5317-fd85-7b2d-b76a-abbe59efb201/mahasiswa`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      return res.data.data || [];
    } catch (error) {
      console.error("Gagal ambil mahasiswa:", error.response?.data || error);
      return [];
    }
  }

  async function postPresensiMahasiswa(payload) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "https://be.karlearn.site/api/presensi/mahasiswa",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error("Gagal simpan presensi:", error.response?.data || error);
      throw error;
    }
  }

  async function updatePresensiMahasiswa(payload) {
    const token = localStorage.getItem("token");
    const res = await axios.put(
      "https://be.karlearn.site/api/presensi/mahasiswa",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  }

  async function getPresensiMahasiswa(sesiId) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        "https://be.karlearn.site/api/presensi/mahasiswa",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          params: { sesi_id: sesiId },
        }
      );
      return res.data.data;
    } catch (error) {
      console.log(error.response?.data);
    }
  }

  async function getJadwalById(sesiId) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/${sesiId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        params: { sesi_id: sesiId },
      });
      return res.data.data;
    } catch (error) {
      console.log("Gagal ambil detail jadwal:", error.response?.data || error);
      return null;
    }
  }

  async function updateJadwal(sesiId, payload) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(`https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/${sesiId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      return res.data;
    } catch (error) {
      console.log("Gagal update jadwal:", error.response?.data || error);
      throw error;
    }
  }

  async function getAllSesiDosen(pengampuId = null, page = 1) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions`,
        {
          params: { page },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      meta.value = res.data.meta;
      return res.data;
    } catch (error) {
      console.error(`Gagal ambil sesi kelas page ${page}:`, error.response?.data || error);
      return null;
    }
  } 

  return { 
    meta,
    getSesiPengampu, 
    getKelas, 
    getKelasByProdi, // Daftarkan fungsi baru di sini agar bisa dipanggil di .vue
    getDetailKelas, 
    getMahasiswaKelas,
    postPresensiMahasiswa,
    updatePresensiMahasiswa,
    getPresensiMahasiswa, 
    getJadwalById,
    updateJadwal,
    getAllSesiDosen
  };
}