import axios from "axios";

export function kelasService() {

  async function getSesiPengampu(pengampuId) {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/pengampu/${pengampuId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log("Response API sesi pengampu:", res.data);
      return res.data.data || [];

    } catch (error) {
      console.error("Gagal ambil sesi pengampu:", error.response?.data || error);
      return [];
    }
  }

  async function getKelas() {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(
        `https://be.karlearn.site/api/pengampu/kelas/019e5317-fd85-7b2d-b76a-abbe59efb201`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const mappedData = await Promise.all(res.data.data.map(async (item) => {
        // ambil jumlah mahasiswa
        let total_mahasiswa = 0;
        try {
          const mahasiswaRes = await axios.get(
            `https://be.karlearn.site/api/kelas/019e5317-fd85-7b2d-b76a-abbe59efb201/mahasiswa`,
            { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
          );
          total_mahasiswa = mahasiswaRes.data.data?.length || 0;
        } catch (err) {
          console.error("Gagal ambil jumlah mahasiswa:", err);
        }

        return {
          id: item.mata_kuliah.id,
          nama_kelas: item.mata_kuliah.name,
          program_studi: item.program_studi?.name || "Teknik Informatika",
          semester: item.semester || "4 (Empat)",
          sks: item.mata_kuliah.sks,
          total_mahasiswa,
        };
      }));

      return mappedData;

    } catch (error) {
      console.error("Gagal ambil kelas:", error.response?.data || error);
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
    console.log("sesi kelas", res.data.data)

    // Pastikan response sesuai: data array + meta
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
    console.error(
      "Gagal ambil mahasiswa:",
      error.response?.data || error
    );

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
    console.error(
      "Gagal simpan presensi:",
      error.response?.data || error
    );
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
        params: {
          id: sesiId,
        },
      }
    );

    console.log("Presensi Mahasiswa:", res.data);

    return res.data.data;
  } catch (error) {
    console.error(
      "Gagal ambil presensi:",
      error.response?.data || error
    );

    return null;
  }
}

  return { 
    getSesiPengampu, 
    getKelas, 
    getDetailKelas, 
    getMahasiswaKelas,
    postPresensiMahasiswa,
    updatePresensiMahasiswa,
    getPresensiMahasiswa
  };
}