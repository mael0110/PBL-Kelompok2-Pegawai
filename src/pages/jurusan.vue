<template>
  <h1>Jurusan</h1>
  <table>
    <tr class="">
      <th>No</th>
      <th>Nama</th>
    </tr>
    <tr v-for="(data, index) in allJurusan">
      <td>{{ index + 1 }}</td>
      <td>{{ data.email }}</td>
    </tr>
  </table>
  <br />
  <form @submit.prevent="createJurusan(payload)">
    <input placeholder="email" type="email" v-model="payload.email" />
    <input placeholder="password" type="password" v-model="payload.password" />
    <button type="submit">Tambah Data</button>
  </form>
</template>

<script setup>
import JurusanService from "@/services/jurusan";
import { onMounted, reactive } from "vue";

const { allJurusan, getAllJurusan, createJurusan } = JurusanService();

onMounted(async () => {
  await getAllJurusan();
});

const payload = reactive({
  email: "",
  password: "",
});
</script>
