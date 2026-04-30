import axios from "axios";
import { ref } from "vue";

export function KategoriService() {
  // buat variabel dengan state untuk menyimpan data hasil response api
  const kategori = ref([]);

  async function getKategori() {
    try {
      // hit api
      const res = await axios.get("http://localhost:3000/kategori");
      console.log(res.data);
      // ambil response api dan masukkan ke variabel kategori
      kategori.value = res.data;
    } catch (error) {
      console.log(error);
    }
  }

  // buat function yang nerima satu parameter
  async function createKategori(payload) {
    try {
      // hit api
      const res = await axios.post(
        "http://localhost:3000/kategori",
        // tambahkan variabel payload dimana payload ini merupakan data yang ingin kita kirim ke api
        payload,
      );
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  }

  return {
    getKategori,
    kategori,
    createKategori,
  };
}
