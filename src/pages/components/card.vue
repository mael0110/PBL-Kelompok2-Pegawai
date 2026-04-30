<template>
  <div class="w-[266px] h-[150px] bg-blue-500 rounded-md">
    {{ props.nama }}
  </div>
</template>

<script setup>
const props = defineProps(["nama"]);
</script>
