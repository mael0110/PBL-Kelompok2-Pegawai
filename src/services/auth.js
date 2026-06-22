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

  async function getProfile() {
    const token = localStorage.getItem("token");
    
    const defaultEmployeeId = "019eea91-3220-70da-820b-b7aaab9d6a13";

    const res = await axios.get(
      `https://api-pegawai-4a.akufarish.my.id:1234/api/employees/${defaultEmployeeId}`, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return res.data;
  }

  async function updateEmployee(id, payload) {
    const token = localStorage.getItem("token");

    const res = await axios.put(
      `https://api-pegawai-4a.akufarish.my.id:1234/api/employees/${id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  }

  return {
    login,
    logout,
    getProfile,
    updateEmployee
  };
}