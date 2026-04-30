import { ref } from "vue";
// import axios from "./axios";

export default function JurusanService() {
  const allJurusan = ref([]);

  async function getAllJurusan() {
    try {
      // const res = await axios.get("/jurusan");
      // console.log(res.data);
      // allJurusan.value = res.data;
      return allJurusan;
    } catch (e) {
      console.log(e);
    }
  }

  async function createJurusan(payload) {
    try {
      allJurusan.value.push(payload);
      await getAllJurusan();
    } catch (e) {
      console.log(e);
    }
  }

  return {
    getAllJurusan,
    allJurusan,
    createJurusan,
  };
}
