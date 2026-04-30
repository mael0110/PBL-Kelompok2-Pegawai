<template>
  <form @submit.prevent="tambahData">
    <input type="text" v-model="data.nama_pelanggan" />
    <button type="submit">Tambah</button>
  </form>
  {{ data.nama_pelanggan }}
</template>

<script setup>
import axios from "axios";
import { reactive, ref } from "vue";

const data = reactive({
  nama_pelanggan: "",
});

async function tambahData() {
  const res = await axios.put(
    "http://localhost:1234/api/pelanggan.php?id=23",
    data,
  );
  console.log(res.data);
}
</script>
