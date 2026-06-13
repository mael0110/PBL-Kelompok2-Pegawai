import axios from "axios";

export function presensiService() {
  const BASE_URL = "https://be.karlearn.site/api";

  // ✅ FIX: sekarang menerima payload dari frontend
  async function presensiDosen(payload) {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${BASE_URL}/presensi/pegawai`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Response presensi:", res.data);
      return res.data;

    } catch (error) {
      console.log("❌ Gagal presensi API:", error.response?.data || error);
      throw error;
    }
  }

  return { presensiDosen };
}