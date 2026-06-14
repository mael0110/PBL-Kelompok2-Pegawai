import { createRouter, createWebHistory } from "vue-router";

import Login from "../pages/login.vue";
import Dashboard from "../pages/dashboard.vue";
import Kelas from "../pages/kelas.vue";
import krs from "../pages/krs.vue";
import Biodata from "../pages/biodata.vue";
import detailSesi from "../pages/detail-sesi.vue";
import detailKelas from "../pages/detail-kelas.vue";
import aturanNilai from "../pages/aturan-nilai.vue"

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "halaman-login", component: Login },
  { path: "/dashboard", name: "dashboard", component: Dashboard },
  { path: "/kelas", name: "kelas", component: Kelas },
  { path: "/krs", name: "krs", component: krs },
  { path: "/biodata", name: "biodata", component: Biodata },
  { path: "/detail-sesi", name: "detail-sesi", component: detailSesi},
  { path: "/detail-kelas", name: "detail-kelas", component: detailKelas },
  { path: "/aturan-nilai", name: "aturan-nilai", component: aturanNilai}
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});
 
export default router;