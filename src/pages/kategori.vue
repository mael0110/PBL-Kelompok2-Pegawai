<template>
  <h1>Kategori</h1>
  <table>
    <tr>
      <th class="text-red-500">No</th>
      <th>Nama</th>
    </tr>
    <tr v-for="(item, index) in kategori">
      <td>{{ index + 1 }}</td>
      <td>{{ item.nama_kategori }}</td>
    </tr>
  </table>
  <br />
  <!-- gunakan @submit untuk memanggil fungsi doCreate ketika form disubmit -->
  <!-- .prevent digunakan supaya ketika form disubmit halaman tidak te-refresh -->
  <!-- @submit.prevent akan banyak kita gunakan untuk proses yang memerlukan form, seperti buat, edit, login, register data -->
  <form @submit.prevent="doCreate">
    <!-- gunakan v-model untuk menghbunugkan input dengan variabel payload -->
    <!-- dalam kasus ini input dibawah terhubung dengan variabel payload dengan key nama_kategori -->
    <!-- yang berari nilai dari input ini akan tersimpan ke key nama_kategori -->
    <!-- v-model nanti banyak kita gunakan biar menghubungkan input dengan variabel -->
    <input type="text" v-model="payload.nama_kategori" />
    <button type="submit">Tambah</button>
  </form>
  <RouterLink :to="{ name: 'halaman-login' }"></RouterLink>
</template>

<script setup>
import { onMounted, reactive } from "vue";
import { KategoriService } from "../services/kategori";

// destructering function untuk mengambil fungsi dan variabel
const { getKategori, kategori, createKategori } = KategoriService();

// onMounted merupakan fungsi yang akan berjalan ketika aplikasi pertama kali di render
// semua fungsi yang ada didalam onMounted akan dijalankan ketika aplikasi atau component dirender
// ini akan sering kita gunakan karena kita mau ketika aplikasi pertama kali di render, hit api untuk get data
onMounted(async () => {
  await getKategori();
});

// variabel payload merupakan state yang dibuat dengan reactive bukan ref
// karena reactive digunakan untuk tipe data kompleks
// ini akan banyak kita gunakan untuk menyimpan nilai dari input
const payload = reactive({
  nama_kategori: "",
});

async function doCreate() {
  try {
    await createKategori(payload);
    await getKategori();
    payload.nama_kategori = "";
  } catch (error) {
    console.log(error);
  }
}
</script>
