import { useState } from "react";
import { fetchMeasurements, fetchAggregation } from "../api";
import { validateDateRange } from "../utils/dateUtils";

export const useMeasurements = () => {
  const [measurements, setMeasurements] = useState([]);
  const [aggregation, setAggregation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasQueried, setHasQueried] = useState(false);

  const query = async (site_id, start_time, end_time) => {
    // Client-side validation before hitting the API
    const validationError = validateDateRange(start_time, end_time);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!site_id) {
      setError("Please select a site.");
      return;
    }

    setLoading(true);
    setError(null);
    setMeasurements([]);
    setAggregation(null);
    setHasQueried(true);

    try {
      // Fetch measurements and aggregation in parallel
      const [measurementsData, aggregationData] = await Promise.all([
        fetchMeasurements(site_id, start_time, end_time),
        fetchAggregation(site_id, start_time, end_time),
      ]);

      setMeasurements(measurementsData.measurements || []);
      setAggregation(aggregationData.aggregation || null);
    } catch (err) {
      setError(err.message || "Failed to fetch measurements.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMeasurements([]);
    setAggregation(null);
    setError(null);
    setHasQueried(false);
  };

  return {
    measurements,
    aggregation,
    loading,
    error,
    hasQueried,
    query,
    reset,
  };
};