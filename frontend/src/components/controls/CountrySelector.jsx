const COUNTRIES = [
  { value: "Nigeria", label: "Nigeria" },
  { value: "Ghana",   label: "Ghana"   },
  { value: "both",    label: "Nigeria & Ghana" },
];

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 500,
  color: "#64748b",
  marginBottom: 6,
  display: "block",
  letterSpacing: "0.01em",
};

const INPUT_STYLE = {
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

export default function CountrySelector({ value, onChange }) {
  return (
    <div>
      <label style={LABEL_STYLE}>Country</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...INPUT_STYLE, color: value ? "#0f172a" : "#94a3b8" }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#2563eb";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <option value="" disabled>Select country…</option>
        {COUNTRIES.map((c) => (
          <option key={c.value} value={c.value} style={{ color: "#0f172a" }}>
            {c.label}
          </option>
        ))}
      </select>
      {/* Phantom spacer — matches sub-text height in SiteSelector/DateRangePicker so inputs align */}
      <p aria-hidden="true" style={{ fontSize: 11, marginTop: 4, visibility: "hidden" }}>—</p>
    </div>
  );
}
