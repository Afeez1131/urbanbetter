import { useState, useEffect } from "react";
import { fetchSites } from "../api";

export const useSites = (country) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!country) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSites([]);

      try {
        const data = await fetchSites(country);
        setSites(data.sites || []);
      } catch (err) {
        setError(err.message || "Failed to load sites.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [country]);

  return { sites, loading, error };
};