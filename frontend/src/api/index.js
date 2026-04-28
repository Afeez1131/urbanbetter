import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response interceptor ──────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";

    const code = error.response?.data?.error?.code || "UNKNOWN_ERROR";

    const status = error.response?.status || 0;

    return Promise.reject({ message, code, status });
  }
);

// ── Sites ─────────────────────────────────────────────────────────────────
export const fetchSites = async (country = "both") => {
  const { data } = await api.get("/api/sites", {
    params: { country },
  });
  return data.data;
};

// ── Measurements ──────────────────────────────────────────────────────────
export const fetchMeasurements = async (site_id, start_time, end_time) => {
  const { data } = await api.get("/api/measurements", {
    params: { site_id, start_time, end_time },
  });
  return data.data;
};

// ── Aggregation ───────────────────────────────────────────────────────────
export const fetchAggregation = async (site_id, start_time, end_time) => {
  const { data } = await api.get("/api/measurements/aggregate", {
    params: { site_id, start_time, end_time },
  });
  return data.data;
};
