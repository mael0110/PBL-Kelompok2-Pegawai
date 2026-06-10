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
    <header class="h-20 bg-blue-900 text-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-3">
        <img :src="logo" alt="logo" class="w-16 h-16 object-contain" />
        <h1 class="text-2xl font-bold text-white">SABAR</h1>

        <button @click="showSidebar = !showSidebar" class="text-white ml-2">
          <Menu :size="28" />
        </button>
      </div>

      <div class="flex items-center gap-4">
        <button class="text-white">
          <Bell size="22" color="white" />
        </button>

        <div @click="goProfile" class="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-sm text-blue-900 font-bold">
          <img  v-if="profileStore.photo" :src="profileStore.photo" class="w-full h-full object-cover rounded-full" />
          <div v-else class="w-full h-full bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside v-if="showSidebar" class="w-56 bg-blue-100 h-full p-4 flex flex-col">
        <nav class="space-y-2 flex-1">
          <RouterLink to="/dashboard" class="menu-link"><LayoutDashboard :size="16" /><span>Dashboard</span></RouterLink>
          <RouterLink to="/kelas" class="menu-link"><BookOpen :size="16" /><span>Kelas</span></RouterLink>
          <RouterLink to="/penilaian" class="menu-link"><CircleCheck :size="16" /><span>Penilaian</span></RouterLink>
          <RouterLink to="/presensi" class="menu-link"><MonitorCheck :size="16" /><span>Presensi</span></RouterLink>
          <RouterLink to="/biodata" class="menu-link"><UserRound :size="16" /><span>Profile</span></RouterLink>
        </nav>

        <!-- Tambahkan pemicu logout agar fungsi tidak mubazir -->
        <button
  @click="bukaLogoutModal"
  class="flex items-center gap-2 text-gray-700 hover:text-red-500 mt-auto px-2 py-2 transition"
>
  <LogOut :size="18" />

  <span class="hover:underline decoration-red-400 underline-offset-4">
    Logout
  </span>
</button>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-hidden"> <!-- Perbaikan typo overflow -->
        <section class="h-full overflow-y-auto p-6">
          <slot />
        </section>
      </main>
    </div>

    <!-- Modal (Dipindah ke luar aside agar tetap tampil saat sidebar ditutup) -->
    <div v-if="showLogoutModal" class="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
      <div class="bg-white w-[420px] rounded-xl border-2 border-red-400 p-8 text-center shadow-2xl">
        <div class="flex justify-center mb-5">
          <TriangleAlert class="text-red-500" :size="80" stroke-width="2.5" />
        </div>

        <h2 class="text-2xl font-bold mb-6">Yakin Ingin Keluar?</h2>

        <div class="flex justify-center gap-3">
          <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm transition-colors">
            Yakin
          </button>
          <button @click="tutupLogoutModal" class="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm transition-colors">
            Kembali
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-link {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: #1f2937;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 12px 16px;
  border-radius: 12px;

  color: #1f2937;
  font-size: 14px;
  text-decoration: none;

  transition: all 0.2s;
}

.router-link-active {
  background: #1e3a8a !important;
  color: white !important;
}


</style>