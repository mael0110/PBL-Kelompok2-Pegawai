import axios from "axios";
import { ref } from "vue";

export function kelasService() {
  const meta = ref({});

  async function getSesiPengampu(pengampuId, classId, page = 1) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(
      `https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/pengampu/${pengampuId}`,
      {
        params: {
          page: page,
          // class_id: classId || ""  
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    console.log("sesi pengampu:", res.data);

    meta.value = res.data?.meta || {};
    return res.data?.data || [];

  } catch (error) {
    console.error("Gagal ambil sesi pengampu:", error.response?.data || error);
    return [];
  }
}

  async function getKelas() {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    try {
      const resSemuaKelas = await axios.get("https://be.karlearn.site/api/kelas", { headers });
      const listKelas = resSemuaKelas.data?.data?.items || []; 

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return [];
      const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const dosenIdDinamis = decodedPayload?.detail_id || decodedPayload?.user_id;

      if (!dosenIdDinamis) return [];

      const resDosen = await axios.get(`https://be.karlearn.site/api/pengampu/dosen/${dosenIdDinamis}`, { headers });
      const matkulDiampu = resDosen.data?.data || [];

      const hasilAkhirGabungan = [];

      await Promise.all(
        listKelas.map(async (kelas) => {
          try {
            const resPengampuKelas = await axios.get(`https://be.karlearn.site/api/pengampu/kelas/${kelas.id}`, { headers });
            const daftarPengampuDiKelasIni = resPengampuKelas.data?.data || [];

            daftarPengampuDiKelasIni.forEach((item) => {
              if (item.dosen?.id === dosenIdDinamis) {
                hasilAkhirGabungan.push({
                  ...item,
                  class_id: kelas.id, 
                  name: kelas.name    
                });
              }
            });
          } catch (err) {
            console.error(`Gagal cek pengampu untuk kelas ${kelas.name}:`, err);
          }
        })
      );

      console.log("HASIL GABUNGAN SEMPURNA UNTUK VUE:", hasilAkhirGabungan);
      return hasilAkhirGabungan;

    } catch (error) {
      console.error("Gagal total proses chaining kelas:", error);
      return [];
    }
  }

  async function getKelasByProdi() {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    try {
      console.log("Mengambil daftar master prodi...");
      const resProdi = await axios.get("https://be.karlearn.site/api/prodi", { headers });
      
      const listProdi = resProdi.data?.data?.items || resProdi.data?.data || resProdi.data || [];
      
      if (listProdi.length === 0) {
        console.warn("Daftar prodi kosong dari API pertama.");
        return [];
      }

      const semuaKelasProdiGabungan = [];

      await Promise.all(
        listProdi.map(async (prodi) => {
          const namaProdiDinamis = prodi.slug || prodi.name; 

          if (!namaProdiDinamis) return;

          try {
            // console.log(`📡 Menembak API Kelas Prodi untuk: ${namaProdiDinamis}`);
            const resKelasProdi = await axios.get(
              `https://be.karlearn.site/api/kelas/prodi/${namaProdiDinamis}`,
              { headers }
            );

            const itemsKelas = resKelasProdi.data?.data?.items || resKelasProdi.data?.data || [];
            
            if (Array.isArray(itemsKelas)) {
              semuaKelasProdiGabungan.push(...itemsKelas);
            } else if (itemsKelas && typeof itemsKelas === 'object') {
              semuaKelasProdiGabungan.push(itemsKelas);
            }
          } catch (err) {
            console.error(`Gagal mengambil kelas untuk prodi ${namaProdiDinamis}:`, err.response?.data || err.message);
          }
        })
      );

      console.log("HASIL GABUNGAN KELAS BY PRODI DINAMIS:", semuaKelasProdiGabungan);
      return semuaKelasProdiGabungan;

    } catch (error) {
      console.error("Gagal total proses chaining getKelasByProdi:", error.response?.data || error);
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
      const resKelompok1 = await axios.get(
        `https://be.karlearn.site/api/kelas/${classId}/mahasiswa`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const dataUtuhKlp1 = resKelompok1.data;
      const arrayDataKlp1 = dataUtuhKlp1?.data || [];

      if (!Array.isArray(arrayDataKlp1) || arrayDataKlp1.length === 0) {
        return dataUtuhKlp1; 
      }

      let listMasterKlp3 = [];
      try {
        const resKelompok3 = await axios.get(
          `https://api-mahasiswa-4a.akufarish.my.id:8874/api/mahasiswa`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        listMasterKlp3 = resKelompok3.data?.data || [];
      } catch (err3) {
        console.error("❌ Gagal intersep master NIM dari Kelompok 3:", err3);
      }

      const dataTerjahit = arrayDataKlp1.map((item) => {
        if (item.mahasiswa && Array.isArray(item.mahasiswa)) {
          const mahasiswaDengannim = item.mahasiswa.map((mhs) => {
            const matchKlp3 = listMasterKlp3.find(
              (m3) => String(m3.id_mahasiswa).trim() === String(mhs.mahasiswa_id).trim()
            );

            return {
              ...mhs,
              nim: matchKlp3?.nim || "-" 
            };
          });

          return {
            ...item,
            mahasiswa: mahasiswaDengannim
          };
        }
        return item;
      });

      return {
        ...dataUtuhKlp1,
        data: dataTerjahit
      };

    } catch (error) {
      console.error("Gagal ambil & jahit mahasiswa:", error.response?.data || error);
      return null;
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
    getKelasByProdi, 
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