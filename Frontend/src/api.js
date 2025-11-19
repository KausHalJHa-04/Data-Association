import axios from "axios";

const api = axios.create({
  baseURL: "https://data-association-backend.onrender.com",
  withCredentials: true
});

export default api;
