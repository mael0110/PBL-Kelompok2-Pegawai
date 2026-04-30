import Jurusan from "@/pages/jurusan.vue";
import { createRouter, createWebHistory } from "vue-router";
import Kategori from "../pages/kategori.vue";
import Test from "../pages/test.vue";
import Dashboard from "../pages/dashboard.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "halaman-login",
      component: Jurusan,
    },
    {
      path: "/dashboard",
      component: Kategori,
    },
    {
      path: "/test",
      component: Test,
    },
    {
      path: "/",
      component: Kategori,
    },
  ],
});

export default router;
