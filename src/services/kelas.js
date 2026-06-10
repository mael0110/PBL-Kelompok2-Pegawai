import axios from "axios";

export function kelasService() {
  
  async function getSesiPengampu(pengampuId) {
    const token = localStorage.getItem("token");

    const res = await axios.get(`https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/pengampu/${pengampuId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    return res.data.data; // array sesi
  }

  return { getSesiPengampu };
}