import { useState, useEffect } from "react";
import { useSites } from "./hooks/useSites";
import { useMeasurements } from "./hooks/useMeasurements";
import { getDefaultDateRange } from "./utils/dateUtils";

const defaults = getDefaultDateRange();

import CountrySelector from "./components/controls/CountrySelector";
import SiteSelector from "./components/controls/SiteSelector";
import DateRangePicker from "./components/controls/DateRangePicker";
import AggregationPanel from "./components/dashboard/AggregationPanel";
import AQIChart from "./components/dashboard/AQIChart";
import DataTable from "./components/dashboard/DataTable";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBanner from "./components/ui/ErrorBanner";
import EmptyState from "./components/ui/EmptyState";

// AQI colours that need dark text
const NEEDS_DARK_TEXT = new Set(["#FFFF00", "#00E400", "#FF7E00"]);

/* ─── AQI Breakdown Panel ───────────────────────────────────────────────── */
function BreakdownPanel({ breakdown }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!breakdown?.length) return;
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [breakdown]);

  if (!breakdown?.length) return null;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#94a3b8",
          marginBottom: 16,
        }}
      >
        AQI Category Breakdown
      </p>

      <div>
        {breakdown.map((item) => {
          const textColor = NEEDS_DARK_TEXT.has(item.color?.toUpperCase())
            ? "#000000"
            : "#ffffff";
          return (
            <div
              key={item.category}
              className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
            >
              {/* Compact badge — fixed width, inner span handles truncation */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  backgroundColor: item.color,
                  padding: "2px 10px",
                  width: 148,
                  flexShrink: 0,
                }}
                title={item.category}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: textColor,
                    letterSpacing: "0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.category}
                </span>
              </span>

              {/* Progress bar */}
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: 6, backgroundColor: "#f1f5f9" }}
              >
                <div
                  style={{
                    height: "100%",
                    width: mounted ? `${item.percentage}%` : "0%",
                    backgroundColor: item.color,
                    borderRadius: 999,
                    transition: "width 600ms cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                />
              </div>

              {/* Percentage */}
              <span
                style={{
                  width: 36,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#334155",
                  textAlign: "right",
                  flexShrink: 0,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {item.percentage}%
              </span>

              {/* Count */}
              <span
                style={{
                  width: 32,
                  fontSize: 11,
                  color: "#94a3b8",
                  textAlign: "right",
                  flexShrink: 0,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── App ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [country, setCountry]     = useState("");
  const [siteId, setSiteId]       = useState("");
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate]     = useState(defaults.end);

  const { sites, loading: sitesLoading, error: sitesError } = useSites(country);

  const {
    measurements,
    aggregation,
    loading: measLoading,
    error: measError,
    hasQueried,
    query,
    reset,
  } = useMeasurements();

  const handleCountryChange = (val) => {
    setCountry(val);
    setSiteId("");
    reset();
  };

  const handleFetch = () => query(siteId, startDate, endDate);
  const selectedSite = sites.find((s) => s.site_id === siteId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fa" }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 h-16 flex items-center border-b border-slate-200"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 32, height: 32, backgroundColor: "#eff6ff" }}
            >
              <svg
                style={{ width: 16, height: 16, color: "#2563eb" }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
              </svg>
            </div>
            <div className="flex items-center">
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>AirWatch</span>
              <span style={{ fontSize: 14, color: "#cbd5e1", margin: "0 8px", fontWeight: 300 }} className="select-none">/</span>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}>West Africa</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Powered by</span>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>AirQo</span>
            <svg style={{ width: 11, height: 11, color: "#cbd5e1" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Filter bar ──────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-200 p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {/* Single grid row — all controls on same baseline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_2fr_auto] gap-4 items-start">

            <CountrySelector value={country} onChange={handleCountryChange} />

            <SiteSelector
              sites={sites}
              value={siteId}
              onChange={setSiteId}
              loading={sitesLoading}
              error={sitesError}
              onRetry={() => handleCountryChange(country)}
            />

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={({ startDate: s, endDate: e }) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />

            {/* Buttons */}
            <div className="flex flex-col">
              <span aria-hidden="true" style={{ fontSize: 11, display: "block", marginBottom: 6, visibility: "hidden" }}>—</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetch}
                  disabled={!siteId || measLoading}
                  style={{
                    backgroundColor: "#09090b",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "10px 20px",
                    borderRadius: 12,
                    border: "1px solid transparent",
                    cursor: !siteId || measLoading ? "not-allowed" : "pointer",
                    opacity: !siteId || measLoading ? 0.35 : 1,
                    transition: "background 150ms, transform 75ms",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#27272a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#09090b"; }}
                  onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {measLoading ? "Fetching…" : "Fetch Data"}
                </button>

                {hasQueried && (
                  <button
                    onClick={reset}
                    style={{
                      backgroundColor: "transparent",
                      color: "#475569",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #334155",
                      cursor: "pointer",
                      transition: "color 150ms, background 150ms, border-color 150ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0f172a";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = "#0f172a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.borderColor = "#334155";
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <p aria-hidden="true" style={{ fontSize: 11, marginTop: 4, visibility: "hidden" }}>—</p>
            </div>
          </div>

          {/* Site status strip */}
          {selectedSite && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  selectedSite.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                }`}
              />
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {selectedSite.is_online ? "Online" : "Offline"}
                <span style={{ margin: "0 6px", color: "#cbd5e1" }}>·</span>
                {selectedSite.name}
                <span style={{ margin: "0 6px", color: "#cbd5e1" }}>·</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{selectedSite.city}</span>
                <span style={{ margin: "0 6px", color: "#cbd5e1" }}>·</span>
                {selectedSite.country}
              </span>
            </div>
          )}
        </div>

        {/* ── Error ────────────────────────────────────────────────── */}
        {measError && <ErrorBanner message={measError} onRetry={handleFetch} />}

        {/* ── Loading ──────────────────────────────────────────────── */}
        {measLoading && <LoadingSpinner message="Fetching measurements…" />}

        {/* ── Results ──────────────────────────────────────────────── */}
        {!measLoading && hasQueried && !measError && (
          <>
            {measurements.length === 0 ? (
              <EmptyState
                title="No measurements found"
                description="No data available for this site and date range. Try a different site or expand the date range."
              />
            ) : (
              <div className="space-y-6">
                <AggregationPanel aggregation={aggregation} />
                <AQIChart measurements={measurements} />
                <BreakdownPanel breakdown={aggregation?.category_breakdown} />
                <DataTable measurements={measurements} />
              </div>
            )}
          </>
        )}

        {/* ── Initial empty state ──────────────────────────────────── */}
        {!hasQueried && !measLoading && (
          <EmptyState
            title="Select a site to get started"
            description="Choose a country, select a monitoring site, set your date range, then click Fetch Data."
          />
        )}
      </main>
    </div>
  );
}
