import { useState } from "react";
import AQIBadge from "../ui/AQIBadge";
import { formatDateTime } from "../../utils/dateUtils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const COLUMNS = [
  { key: "time",           label: "Time",           sortable: true  },
  { key: "pm2_5_value",    label: "PM2.5 µg/m³",    sortable: true  },
  { key: "aqi_category",   label: "AQI Category",   sortable: false },
  { key: "aqi_color_name", label: "Colour Name",    sortable: false },
  { key: "city",           label: "City",           sortable: false },
  { key: "country",        label: "Country",        sortable: false },
  { key: "site_id",        label: "Site ID",        sortable: false },
  { key: "device_id",      label: "Device ID",      sortable: false },
];

export default function DataTable({ measurements }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("time");
  const [sortDir, setSortDir] = useState("desc");

  if (!measurements?.length) return null;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const handlePageSize = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const sorted = [...measurements].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (sortKey === "time") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Table header bar */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4"
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#94a3b8",
          }}
        >
          Measurements
        </p>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "#94a3b8",
          }}
          data-mono
        >
          {measurements.length.toLocaleString()} records
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-5 py-3 text-left border-b border-slate-100 whitespace-nowrap${
                    col.sortable ? " cursor-pointer select-none" : ""
                  }`}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: col.sortable && sortKey === col.key ? "#334155" : "#64748b",
                    transition: "color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    if (col.sortable) e.currentTarget.style.color = "#334155";
                  }}
                  onMouseLeave={(e) => {
                    if (col.sortable)
                      e.currentTarget.style.color =
                        sortKey === col.key ? "#334155" : "#64748b";
                  }}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span style={{ marginLeft: 4, opacity: 0.6 }}>
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={`${row.site_id}-${row.time}-${i}`}
                className="border-b border-slate-50 last:border-0"
                style={{ transition: "background 150ms" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12.5,
                    color: "#64748b",
                  }}
                  data-mono
                >
                  {formatDateTime(row.time)}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0f172a",
                  }}
                  data-mono
                >
                  {row.pm2_5_value}
                </td>
                <td className="px-5 py-3.5">
                  <AQIBadge
                    category={row.aqi_category}
                    color={row.aqi_color}
                    colorName={row.aqi_color_name}
                  />
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{ fontSize: 13, color: "#334155" }}
                >
                  {row.aqi_color_name || "—"}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{ fontSize: 13.5, color: "#334155" }}
                >
                  {row.city}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{ fontSize: 13.5, color: "#334155" }}
                >
                  {row.country}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11.5,
                    color: "#94a3b8",
                  }}
                  data-mono
                >
                  {row.site_id}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11.5,
                    color: "#94a3b8",
                  }}
                  data-mono
                >
                  {row.device_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer — always visible */}
      <div
        className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap"
      >
        {/* Left: rows-per-page + record range */}
        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={handlePageSize}
            style={{
              fontSize: 11,
              color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "4px 24px 4px 8px",
              backgroundColor: "#ffffff",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%2394a3b8' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#94a3b8",
            }}
            data-mono
          >
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, measurements.length)}
            <span style={{ margin: "0 5px", opacity: 0.4 }}>of</span>
            {measurements.length.toLocaleString()}
          </span>
        </div>

        {/* Right: prev / next */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              backgroundColor: "white",
              color: "#334155",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
              transition: "background 150ms, border-color 150ms",
            }}
            onMouseEnter={(e) => {
              if (page !== 1) e.currentTarget.style.backgroundColor = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              backgroundColor: "white",
              color: "#334155",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.4 : 1,
              transition: "background 150ms, border-color 150ms",
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) e.currentTarget.style.backgroundColor = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
