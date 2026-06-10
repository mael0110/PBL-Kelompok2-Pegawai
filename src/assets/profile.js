import { reactive, watch } from "vue";

// ambil dari localStorage saat awal load
const savedPhoto = localStorage.getItem("profile_photo");

export const profileStore = reactive({
  photo: savedPhoto || "", // tidak pakai avatar lagi
});

// setiap berubah → langsung simpan ke localStorage
watch(
  () => profileStore.photo,
  (newVal) => {
    if (newVal) {
      localStorage.setItem("profile_photo", newVal);
    }
  }
);