import axios from "axios";

export function authService() {

  async function login(payload) {
    const res = await axios.post(
      "https://be.karlearn.site/api/auth/login",
      payload
    );

    console.log("Response login:", res.data);

    const token = res.data.data.access_token;

    if (token) {
      localStorage.setItem("token", token);
    }

    return res.data;
  }

  async function logout() {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        "https://be.karlearn.site/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log("Response logout:", res.data);

      localStorage.removeItem("token");

      return res.data;
    } catch (error) {
      console.log("Gagal logout API:", error.response?.data || error);

      localStorage.removeItem("token");

      return {
        success: true,
        message: "Logout lokal berhasil",
      };
    }
  }

  return {
    login,
    logout,
  };
}