import axios from "axios";

const currentHost =
  window.location.hostname;

const backendHost =
  currentHost === "localhost"
    ? "127.0.0.1"
    : currentHost;

const localApiUrl =
  `http://${backendHost}:5000/api`;

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    localApiUrl,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "pizzaDeliveryToken"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

export default api;