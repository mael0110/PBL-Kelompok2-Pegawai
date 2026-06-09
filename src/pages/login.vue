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
  <div class="min-h-screen bg-blue-900 flex items-center justify-center">
    <div class="w-[430px] bg-white rounded-xl shadow-lg px-20 py-14">
      <div class="text-center mb-10">
        <img :src="logo" alt="logo" class="w-20 h-20 object-contain mx-auto mb-2"/>

        <h1 class="text-2xl font-bold text-blue-900">
          Selamat Datang
        </h1>

        <p class="text-xs text-gray-600">
          Silahkan Login Untuk Melanjutkan
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <p v-if="errorMessage" class="bg-[#E74C3C] text-white text-sm px-4 py-3 rounded-md mb-3 flex items-center justify-between">
            {{ errorMessage }}
            <X class="w-5 h-5 cursor-pointer" />
          </p>
         
          <label class="text-xs text-gray-600">Username</label>
          <div class="flex items-center bg-white border border-gray-300 rounded h-8">
            <Mail class="w-4 h-4 mx-2 text-gray-400" />
            <input v-model="form.email" type="email" placeholder="Email" class="w-full outline-none text-xs px-2"/>
          </div>
        </div>

        <div>
          <label class="text-xs text-gray-600">Password</label>
          <div class="flex items-center bg-white border border-gray-300 rounded h-8">
            <LockKeyhole class="w-4 h-4 mx-2 text-gray-400" />
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Password" class="w-full outline-none text-xs px-2"/>
            <button type="button" @click="showPassword = !showPassword" class="px-2 text-gray-400">
              <Eye v-if="!showPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button type="submit" class="w-full bg-blue-900 text-white text-sm py-2 rounded hover:bg-blue-800">
          Masuk
        </button>
      </form>
    </div>
  </div>
</template>