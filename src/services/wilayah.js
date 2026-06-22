import axios from "axios";
import { ref } from "vue";

export function wilayahService() {

  const countries = ref([]);
  const provinces = ref([]);
  const cities = ref([]);
  const districts = ref([]);
  const villages = ref([]);

  async function getCountries() {
    try {

      let allCountries = [];
      let currentPage = 1;
      let lastPage = 1;

      do {

        const res = await axios.get(
          `https://api-pegawai-4a.akufarish.my.id:1234/api/countries?page=${currentPage}`
        );

        allCountries = [
          ...allCountries,
          ...res.data.data,
        ];

        lastPage = res.data.meta.last_page;
        currentPage++;

      } while (currentPage <= lastPage);

      countries.value = allCountries;

      console.log("countries:", countries.value);

    } catch (error) {
      console.log("Gagal mengambil countries:", error);
    }
  }

  async function getProvinces() {
    try {

      let allProvinces = [];
      let currentPage = 1;
      let lastPage = 1;

      do {

        const res = await axios.get(
          `https://api-pegawai-4a.akufarish.my.id:1234/api/provinces?page=${currentPage}`
        );

        allProvinces = [
          ...allProvinces,
          ...res.data.data,
        ];

        lastPage = res.data.meta.last_page;
        currentPage++;

      } while (currentPage <= lastPage);

      provinces.value = allProvinces;

      console.log("provinces:", provinces.value);

    } catch (error) {
      console.log("Gagal mengambil provinces:", error);
    }
  }

  async function getCities(provinceCode) {
    try {

      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/cities/${provinceCode}`
      );

      cities.value = res.data.data;

      console.log("cities:", cities.value);

    } catch (error) {
      console.log("Gagal mengambil cities:", error);
    }
  }

  async function getDistricts(cityCode) {
    try {

      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/districts/${cityCode}`
      );

      districts.value = res.data.data;

      console.log("districts:", districts.value);

    } catch (error) {
      console.log("Gagal mengambil districts:", error);
    }
  }

  async function getVillages(districtCode) {
    try {

      const res = await axios.get(
        `https://api-pegawai-4a.akufarish.my.id:1234/api/villages/${districtCode}`
      );

      villages.value = res.data.data;

      console.log("villages:", villages.value);

    } catch (error) {
      console.log("Gagal mengambil villages:", error);
    }
  }

  return {
    countries,
    provinces,
    cities,
    districts,
    villages,

    getCountries,
    getProvinces,
    getCities,
    getDistricts,
    getVillages,
  };
}