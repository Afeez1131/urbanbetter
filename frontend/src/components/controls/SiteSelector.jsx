const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 500,
  color: "#64748b",
  marginBottom: 6,
  display: "block",
  letterSpacing: "0.01em",
};

const SELECT_STYLE = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  padding: "9px 12px",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

export default function SiteSelector({ sites, value, onChange, loading, error, onRetry }) {
  if (loading) {
    return (
      <div>
        <label style={LABEL_STYLE}>Site</label>
        <div
          className="flex items-center gap-2"
          style={{
            height: 40,
            paddingLeft: 12,
            paddingRight: 12,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div
            className="animate-spin rounded-full"
            style={{
              width: 14,
              height: 14,
              border: "2px solid #e2e8f0",
              borderTopColor: "#2563eb",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading sites…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <label style={LABEL_STYLE}>Site</label>
        <div
          className="flex items-center justify-between gap-2"
          style={{
            padding: "9px 12px",
            borderRadius: 12,
            border: "1px solid #fecaca",
            backgroundColor: "#fff5f5",
          }}
        >
          <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#dc2626",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 2,
                flexShrink: 0,
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const grouped = sites.reduce((acc, site) => {
    const city = site.city || "Other";
    if (!acc[city]) acc[city] = [];
    acc[city].push(site);
    return acc;
  }, {});

  return (
    <div>
      <label style={LABEL_STYLE}>
        Site
        {sites.length > 0 && (
          <span style={{ marginLeft: 6, fontWeight: 400, color: "#94a3b8" }}>
            ({sites.length})
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={sites.length === 0}
        style={{
          ...SELECT_STYLE,
          ...(sites.length === 0
            ? { backgroundColor: "#f8f9fa", color: "#94a3b8", cursor: "not-allowed" }
            : {}),
        }}
        onFocus={(e) => {
          if (sites.length > 0) {
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)";
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <option value="">Select a site…</option>
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([city, citySites]) => (
            <optgroup key={city} label={city}>
              {citySites.map((site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.name}
                  {site.is_online ? " ●" : " ○"}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
      {/* Always rendered — keeps height consistent for grid alignment */}
      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, visibility: sites.length > 0 ? "visible" : "hidden" }}>
        ● online &nbsp;○ offline
      </p>
    </div>
  );
}
