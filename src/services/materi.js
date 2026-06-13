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
      console.log("Berhasil ambil file: ", res.data.data);
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
        `${BASE_URL}/file-uploads/${fileUploadId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          responseType: "blob",
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
          uuids: uuidsArray,
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
          params: { page },
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
        `${BASE_URL}/class-sessions/${classSessionId}/learning-materials/delete`,
        {
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

  async function tambahTugas(classSessionId, payload) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${BASE_URL}/class-sessions/${classSessionId}/assignments`,
        {
          file_uuids: payload.file_uuids,
          title: payload.title,
          description: payload.description,
          deadline: payload.deadline
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
      console.error("Gagal menambah tugas:", error.response?.data || error);
      throw error;
    }
  }

  // 🔥 PERBAIKAN: Mengganti 'api.post' ke 'axios.post' & menambahkan header keamanan token
  async function hapusTugas(classSessionId, assignmentUuids) {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/class-sessions/${classSessionId}/assignments/delete`, 
        {
          assignment_uuids: assignmentUuids 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("API Error hapusTugas:", error.response?.data || error);
      throw error;
    }
  }

  // 🔥 PERBAIKAN: Mengganti 'api.get' ke 'axios.get' & melampirkan token otentikasi
  async function getMahasiswaMengumpulTugas(studentAssignmentId) {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${BASE_URL}/assignments/${studentAssignmentId}/submission`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      );
      console.log("mahasiswa mengumpul tugas: ", response.data)
      return response.data;
    } catch (error) {
      console.error("API Error getMahasiswaMengumpulTugas:", error.response?.data || error);
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
    hapusMateri,
    tambahTugas,
    hapusTugas,
    getMahasiswaMengumpulTugas
  };
}