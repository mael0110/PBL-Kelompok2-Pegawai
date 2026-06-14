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

      const result = response.data; // Memperbaiki kesalahan typo sintaksis sebelumnya

      // Sesuai format JSON: Cek field "success" dan pastikan "data" berupa Array
      if (result.success && Array.isArray(result.data)) {
        // Cari data yang course_code-nya cocok dengan parameter halaman saat ini
        const spesifikMatkul = result.data.find(item => item.course_code === courseCode);
        
        return {
          success: true,
          data: spesifikMatkul || null // Mengembalikan objek tunggal mata kuliah jika ketemu
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

  // 3. Edit data aturan nilai yang sudah ada berdasarkan ID (PUT)
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

  return {
    getAturanNilai,
    createAturanNilai,
    updateAturanNilai
  };
};