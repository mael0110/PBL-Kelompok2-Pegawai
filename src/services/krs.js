// Dummy API KRS
export function krsService() {

  const dummyKRS = [
    { id: 1, nim: "C030324009", nama: "Edo Putra", prodi: "Informatika", tanggal: "18 Mei 2024", status: "Menunggu" },
    { id: 2, nim: "C030324010", nama: "Lexyan", prodi: "Informatika", tanggal: "19 Mei 2024", status: "Disetujui" },
    { id: 3, nim: "C030324011", nama: "Sinto Putri", prodi: "SI", tanggal: "20 Mei 2024", status: "Menunggu" },
    { id: 4, nim: "C030324012", nama: "Nabila", prodi: "SI", tanggal: "22 Mei 2024", status: "Ditolak" },
    { id: 5, nim: "C030324013", nama: "Sindy", prodi: "Informatika", tanggal: "21 Mei 2024", status: "Ditolak" },
    { id: 6, nim: "C030324014", nama: "Sena", prodi: "Informatika", tanggal: "21 Mei 2024", status: "Disetujui" },
  ];

  async function getKRS() {
    // nanti bisa diganti dengan fetch dari API
    return dummyKRS;
  }

  return { getKRS };
}