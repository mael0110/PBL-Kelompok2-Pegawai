import axios from "axios";

export function materiService() {
  const BASE_URL = "https://api-pegawai-4a.akufarish.my.id:1234/api";

async function uploadFiles(fileList) {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  for (let i = 0; i < fileList.length; i++) {
    formData.append("files[]", fileList[i]);
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/file-uploads`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("upload: ", res.data.data);

    return res.data.data;

  } catch (error) {
    console.error("Upload gagal:", error.response?.data || error);
    throw error;
  }
}

  async function tambahMateri(classSessionId, fileUuids) {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${BASE_URL}/class-sessions/${classSessionId}/learning-materials`,
        {
          file_uuids: fileUuids,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;

    } catch (error) {
      console.error(error.response?.data || error);
      throw error;
    }
  }

  async function getFileUploads() {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(`${BASE_URL}/file-uploads`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      console.log("Berhasil ambil file: ", res.data.data)

      return res.data.data; 
    } catch (error) {
      console.error("Gagal mengambil file uploads:", error.response?.data || error);
      throw error;
    }
  }

  async function downloadFileApi(fileUploadId) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(
      `${BASE_URL}/file-uploads/${fileUploadId}/download`, // Sesuai endpoint API
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        responseType: "blob", // 🔥 CRITICAL: Wajib blob untuk mendownload file biner lewat Axios
      }
    );
    return res.data;
  } catch (error) {
    console.error("Gagal mendownload file:", error.response?.data || error);
    throw error;
  }
}

  async function deleteFileApi(uuidsArray) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.post(
      `${BASE_URL}/file-uploads/delete`,
      {
        uuids: uuidsArray, // Mengirimkan body parameter ["uuid-1", "uuid-2"]
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Gagal menghapus file di server:", error.response?.data || error);
    throw error;
  }
}

async function getSesiPengampu(pengampuId, page = 1) {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(
        `${BASE_URL}/class-sessions/pengampu/${pengampuId}`,
        {
          params: {
            page
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log("Response API sesi pengampu:", res.data);
      return res.data.data || [];

    } catch (error) {
      console.error("Gagal ambil sesi pengampu:", error.response?.data || error);
      return [];
    }
  }

async function hapusMateri(classSessionId, learningMaterialIds) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.post(
      `https://api-pegawai-4a.akufarish.my.id:1234/api/class-sessions/${classSessionId}/learning-materials/delete`,
      {
        // SINKRONISASI: Gunakan 'learningMaterialIds' sesuai dengan nama parameter di atas
        file_uuids: learningMaterialIds 
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Gagal menghapus materi:", error.response?.data || error);
    throw error;
  }
}

  return {
    uploadFiles,
    tambahMateri,
    getFileUploads, 
    downloadFileApi,
    deleteFileApi,
    getSesiPengampu,
    hapusMateri
  };
}