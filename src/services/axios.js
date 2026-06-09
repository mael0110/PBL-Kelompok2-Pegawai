import axios from "axios";

axios.defaults.baseURL = "http://localhost:1234/api";

export default axios;
import axios from "axios";

const api = axios.create({
  baseURL: "https://api-pegawai-4a.akufarish.my.id:1234/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;