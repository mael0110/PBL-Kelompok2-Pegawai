<script setup>
import { ref, toRef } from "vue";
import logo from "../assets/logo.png";
import {Bell, LogOut, Menu, TriangleAlert, LayoutDashboard, BookOpen, CircleCheck, MonitorCheck,  UserRound} from "lucide-vue-next";
import { useRouter } from "vue-router";
import { authService } from "../services/auth";
import { profileStore } from "../assets/profile";

const showSidebar = ref(true);
const router = useRouter();
const showLogoutModal = ref(false);
const { logout } = authService();

const handleLogout = async () => {
  try {
    await logout();

    router.push("/login");
  } catch (error) {
    console.log("Gagal logout:", error.response?.data || error);

    localStorage.removeItem("token");
    router.push("/login");
  }
};

const goProfile = () => {
  router.push("/biodata");
};

const bukaLogoutModal = () => {
  showLogoutModal.value = true;
};

const tutupLogoutModal = () => {
  showLogoutModal.value = false;
};

</script>

<template>
  <div class="h-screen bg-gray-100 overflow-hidden flex flex-col">
    <header class="h-14 bg-blue-900 text-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-3">
        <img :src="logo" alt="logo" class="w-10 h-10 object-contain" />
        <h1 class="text-lg font-bold text-white">SABAR</h1>

        <button @click="showSidebar = !showSidebar" class="text-white ml-2">
          <Menu :size="20" />
        </button>
      </div>

      <div class="flex items-center gap-4">
        <button class="text-white">
          <Bell size="18" color="white" />
        </button>

        <div @click="goProfile" class="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-xs text-blue-900 font-bold cursor-pointer">
          <img  v-if="profileStore.photo" :src="profileStore.photo" class="w-full h-full object-cover rounded-full" />
          <div v-else class="w-full h-full bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside v-if="showSidebar" class="w-48 bg-blue-100 h-full p-3 flex flex-col">
        <nav class="space-y-1 flex-1">
          <RouterLink to="/dashboard" class="menu-link"><LayoutDashboard :size="14" /><span>Dashboard</span></RouterLink>
          <RouterLink to="/kelas" class="menu-link"><BookOpen :size="14" /><span>Kelas</span></RouterLink>
          <RouterLink to="/krs" class="menu-link"><MonitorCheck :size="14" /><span>Validasi KRS</span></RouterLink>
          <RouterLink to="/biodata" class="menu-link"><UserRound :size="14" /><span>Profile</span></RouterLink>
        </nav>

        <button
          @click="bukaLogoutModal"
          class="flex items-center gap-2 text-gray-700 hover:text-red-500 mt-auto px-2 py-2 transition text-[12px]"
        >
          <LogOut :size="15" />

          <span class="hover:underline decoration-red-400 underline-offset-4">
            Logout
          </span>
        </button>
      </aside>

      <main class="flex-1 overflow-hidden"> <section class="h-full overflow-y-auto p-5">
          <slot />
        </section>
      </main>
    </div>

    <div v-if="showLogoutModal" class="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
      <div class="bg-white w-[340px] rounded-xl border-2 border-red-400 p-6 text-center shadow-2xl">
        <div class="flex justify-center mb-4">
          <TriangleAlert class="text-red-500" :size="54" stroke-width="2.5" />
        </div>

        <h2 class="text-lg font-bold mb-4">Yakin Ingin Keluar?</h2>

        <div class="flex justify-center gap-3">
          <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs transition-colors">
            Yakin
          </button>
          <button @click="tutupLogoutModal" class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs transition-colors">
            Kembali
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ukuran font link menu diturunkan dari 14px ke 12px dan padding disesuaikan */
.menu-link {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  color: #1f2937;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 10px 14px;
  border-radius: 10px;

  color: #1f2937;
  font-size: 12px;
  text-decoration: none;

  transition: all 0.2s;
}

.router-link-active {
  background: #1e3a8a !important;
  color: white !important;
}
</style>