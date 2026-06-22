<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Mail, LockKeyhole, Eye, EyeOff, X } from "lucide-vue-next";
import logo from "../assets/logo.png";
import { authService } from "../services/auth";

const router = useRouter();
const showPassword = ref(false);
const errorMessage = ref("");

const form = reactive({
  email: "",
  password: "",
});

const { login } = authService();

const handleLogin = async () => {
  errorMessage.value = "";
  if(!form.email) {
    errorMessage.value = "Username tidak boleh kosong!";
    return;
  }

  if (!form.password){
    errorMessage.value = "Password tidak boleh kosong!";
    return;
  }

  try {
    await login({
      email: form.email,
      password: form.password,
    });

    router.push("/dashboard");
  } catch (error) {
    errorMessage.value = "Email atau password salah!";
  }
};
</script>

<template>
  <div class="min-h-screen bg-blue-900 flex items-center justify-center p-4">
    <div class="w-full max-w-[360px] bg-white rounded-xl shadow-lg px-8 py-10">
      
      <div class="text-center mb-6">
        <img :src="logo" alt="logo" class="w-16 h-16 object-contain mx-auto mb-2"/>

        <h1 class="text-xl font-bold text-blue-900 leading-tight">
          Selamat Datang
        </h1>
        <p class="text-[11px] text-gray-500 mt-0.5">
          Silahkan Login Untuk Melanjutkan
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-3.5">
        <div v-if="errorMessage">
          <p class="bg-[#E74C3C] text-white text-[11px] px-3 py-2 rounded mb-2 flex items-center justify-between">
            {{ errorMessage }}
            <X class="w-4 h-4 cursor-pointer" @click="errorMessage = ''" />
          </p>
        </div>

        <div>
          <label class="text-[11px] font-medium text-gray-600 block mb-1">Username</label>
          <div class="flex items-center bg-white border border-gray-300 rounded h-8 transition-focus focus-within:border-blue-500">
            <Mail class="w-3.5 h-3.5 mx-2 text-gray-400 shrink-0" />
            <input v-model="form.email" type="email" placeholder="Email" class="w-full outline-none text-[11px] pr-2 bg-transparent"/>
          </div>
        </div>

        <div>
          <label class="text-[11px] font-medium text-gray-600 block mb-1">Password</label>
          <div class="flex items-center bg-white border border-gray-300 rounded h-8 transition-focus focus-within:border-blue-500">
            <LockKeyhole class="w-3.5 h-3.5 mx-2 text-gray-400 shrink-0" />
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Password" class="w-full outline-none text-[11px] bg-transparent"/>
            <button type="button" @click="showPassword = !showPassword" class="px-2 text-gray-400 hover:text-gray-600 focus:outline-none">
              <Eye v-if="!showPassword" class="w-3.5 h-3.5" />
              <EyeOff v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button type="submit" class="w-full bg-blue-900 text-white text-xs py-2 rounded font-semibold hover:bg-blue-800 transition duration-150 mt-2">
          Masuk
        </button>
      </form>
    </div>
  </div>
</template>