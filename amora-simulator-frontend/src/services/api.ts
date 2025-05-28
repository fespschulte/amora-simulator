import axios from "axios";
import { SimulationCreate, SimulationUpdate } from "../types/simulation";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    console.log("Login Response Data:", response.data);
    localStorage.setItem("auth_token", response.data.access_token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    console.log("Token stored:", localStorage.getItem("auth_token"));
    console.log("Is Authenticated after login:", authAPI.isAuthenticated());
    return response.data;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("auth_token");
  },
};

// Simulations API
export const simulationsAPI = {
  getAll: async () => {
    const response = await api.get("/simulations");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/simulations/${id}`);
    return response.data;
  },

  create: async (simulationData: SimulationCreate) => {
    const response = await api.post("/simulations", simulationData);
    return response.data;
  },

  update: async (id: string, simulationData: SimulationUpdate) => {
    const response = await api.put(`/simulations/${id}`, simulationData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/simulations/${id}`);
    return response.data;
  },
};

export default api;
