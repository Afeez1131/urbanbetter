import AQIBadge from "../ui/AQIBadge";

const LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#94a3b8",
};

const VALUE_STYLE = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 28,
  fontWeight: 600,
  color: "#0f172a",
  lineHeight: 1,
};

const SUB_STYLE = {
  fontSize: 11,
  color: "#94a3b8",
  marginTop: 4,
  fontWeight: 400,
};

function StatCard({ label, value, sub, children }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-6"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "border-color 200ms, box-shadow 200ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#cbd5e1";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
      }}
    >
      <p style={LABEL_STYLE} className="mb-3">{label}</p>
      {children || (
        <>
          <p style={VALUE_STYLE} data-mono>{value}</p>
          {sub && <p style={SUB_STYLE}>{sub}</p>}
        </>
      )}
    </div>
  );
}

export default function AggregationPanel({ aggregation }) {
  if (!aggregation) return null;

  const {
    total_datapoints,
    avg_pm25,
    worst_reading,
    best_reading,
    data_completeness,
    category_breakdown,
  } = aggregation;

  return (
    <div className="space-y-6">
      {/* ── KPI stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Readings"
          value={total_datapoints.toLocaleString()}
          sub="data points"
        />
        <StatCard
          label="Average PM2.5"
          value={avg_pm25 !== null ? `${avg_pm25}` : "—"}
          sub={avg_pm25 !== null ? "µg/m³ mean concentration" : undefined}
        />
        <StatCard
          label="Data Completeness"
          value={data_completeness}
          sub="of expected hourly readings"
        />
        <StatCard label="Dominant Category">
          {category_breakdown.length > 0 ? (
            <>
              <p style={VALUE_STYLE} data-mono>
                {category_breakdown[0].percentage}%
              </p>
              <div className="mt-2">
                <AQIBadge
                  category={category_breakdown[0].category}
                  color={category_breakdown[0].color}
                  colorName={category_breakdown[0].category}
                />
              </div>
            </>
          ) : (
            <p style={VALUE_STYLE} data-mono>—</p>
          )}
        </StatCard>
      </div>

      {/* ── Best / Worst readings ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {worst_reading && (() => {
          const color =
            category_breakdown.find((c) => c.category === worst_reading.aqi_category)?.color ||
            "#94a3b8";
          return (
            <div
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              style={{
                borderLeft: `5px solid #ef4444`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="p-6">
                <p style={LABEL_STYLE} className="mb-4">Worst Reading</p>
                <div
                  className="rounded-xl p-4 flex items-end justify-between gap-4"
                  style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 32,
                        fontWeight: 600,
                        color: "#0f172a",
                        lineHeight: 1,
                        marginBottom: 6,
                      }}
                      data-mono
                    >
                      {worst_reading.pm2_5_value}
                      <span
                        style={{ fontSize: 14, fontWeight: 400, color: "#64748b", marginLeft: 6 }}
                      >
                        µg/m³
                      </span>
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11.5,
                        color: "#94a3b8",
                      }}
                      data-mono
                    >
                      {new Date(worst_reading.time).toLocaleString()}
                    </p>
                  </div>
                  <AQIBadge
                    category={worst_reading.aqi_category}
                    color={color}
                    colorName={worst_reading.aqi_category}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {best_reading && (() => {
          const color =
            category_breakdown.find((c) => c.category === best_reading.aqi_category)?.color ||
            "#94a3b8";
          return (
            <div
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              style={{
                borderLeft: `5px solid #22c55e`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="p-6">
                <p style={LABEL_STYLE} className="mb-4">Best Reading</p>
                <div
                  className="rounded-xl p-4 flex items-end justify-between gap-4"
                  style={{ backgroundColor: "rgba(34,197,94,0.05)" }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 32,
                        fontWeight: 600,
                        color: "#0f172a",
                        lineHeight: 1,
                        marginBottom: 6,
                      }}
                      data-mono
                    >
                      {best_reading.pm2_5_value}
                      <span
                        style={{ fontSize: 14, fontWeight: 400, color: "#64748b", marginLeft: 6 }}
                      >
                        µg/m³
                      </span>
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11.5,
                        color: "#94a3b8",
                      }}
                      data-mono
                    >
                      {new Date(best_reading.time).toLocaleString()}
                    </p>
                  </div>
                  <AQIBadge
                    category={best_reading.aqi_category}
                    color={color}
                    colorName={best_reading.aqi_category}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
