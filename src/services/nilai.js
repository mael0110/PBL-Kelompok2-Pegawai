import axios from "axios";

export const nilaiService = () => {
  
  // 1. Ambil data aturan nilai berdasarkan kode mata kuliah
  const getAturanNilai = async (courseCode) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://api-pegawai-4a.akufarish.my.id:1234/api/grade-settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      });

      const result = response.data;

      if (result.success && Array.isArray(result.data)) {
        const spesifikMatkul = result.data.find(item => item.course_code === courseCode);
        
        return {
          success: true,
          data: spesifikMatkul || null
        };
      }

      return result;
    } catch (error) {
      console.error("Error di getAturanNilai:", error.response?.data || error);
      throw error;
    }
  };

  // 2. Tambah data aturan nilai baru (POST)
  const createAturanNilai = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("https://api-pegawai-4a.akufarish.my.id:1234/api/grade-settings", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error di createAturanNilai:", error.response?.data || error);
      throw error;
    }
  };

  // 3. Edit data aturan nilai (PUT)
  const updateAturanNilai = async (gradeSettingId, payload) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`https://api-pegawai-4a.akufarish.my.id:1234/api/grade-settings/${gradeSettingId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error di updateAturanNilai:", error.response?.data || error);
      throw error;
    }
  };

  // 4. Download Template Excel (POST)
  const downloadTemplateNilai = async (payload) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/grade-exports`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          responseType: "blob", 
        }
      );

      const blob = new Blob([res.data], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Template_Nilai_${payload.class_name || 'Kelas'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return res.data;
    } catch (error) {
    console.error("❌ Axios Error Mentah:", error);

    // Cek jika error memiliki response berupa Blob JSON
    if (error.response && error.response.data instanceof Blob) {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          // Mengubah text blob menjadi JSON objek agar bisa dibaca di konsol
          const errorPesan = JSON.parse(reader.result);
          console.log("🔥 PESAN ERROR VALIDASI DARI BACKEND:", errorPesan);
          alert("Gagal: " + (errorPesan.message || "Validasi backend gagal. Cek konsol."));
        } catch (e) {
          console.log("Isi teks error (bukan JSON):", reader.result);
        }
      };
      
      reader.readAsText(error.response.data);
    } else {
      console.error("Gagal mendownload template:", error.message);
      alert("Gagal mendownload template: " + error.message);
    }
      throw error;
    }
  };

  // 5. Ambil daftar mahasiswa berdasarkan ID Kelas (Dinamis tanpa Hardcode URL)
  const getMahasiswaByKelas = async (classId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `https://be.karlearn.site/api/kelas/${classId}/mahasiswa`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("data mahasiswa", res.data)
      return res.data; 
    } catch (error) {
      console.error("Gagal ambil mahasiswa:", error.response?.data || error);
      return { success: false, data: [] };
    }
  };

  return {
    getAturanNilai,
    createAturanNilai,
    updateAturanNilai,
    downloadTemplateNilai,
    getMahasiswaByKelas
  };
};