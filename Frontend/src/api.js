import axios from "axios";

const api = axios.create({
  baseURL: "https://data-association-backend.onrender.com/api",
  withCredentials: true
});

export default api;
