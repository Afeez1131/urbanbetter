import {
  getEarliestAllowedDate,
  getTodayDate,
  MAX_DAYS,
} from "../../utils/dateUtils";

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 500,
  color: "#64748b",
  marginBottom: 6,
  display: "block",
  letterSpacing: "0.01em",
};

const INPUT_STYLE = {
  flex: 1,
  minWidth: 0,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  padding: "9px 12px",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
  fontFamily: "'DM Mono', monospace",
};

const focusStyle = {
  borderColor: "#2563eb",
  boxShadow: "0 0 0 3px rgba(37,99,235,0.08)",
};

const blurStyle = {
  borderColor: "#e2e8f0",
  boxShadow: "none",
};

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const earliest = getEarliestAllowedDate();
  const today = getTodayDate();

  const handleStart = (e) => onChange({ startDate: e.target.value, endDate });
  const handleEnd   = (e) => onChange({ startDate, endDate: e.target.value });

  return (
    <div>
      <label style={LABEL_STYLE}>
        Date Range
        <span style={{ marginLeft: 6, fontWeight: 400, color: "#94a3b8" }}>
          (max {MAX_DAYS} days)
        </span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          min={earliest}
          max={endDate || today}
          onChange={handleStart}
          style={INPUT_STYLE}
          onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={(e)  => Object.assign(e.currentTarget.style, blurStyle)}
        />
        <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>to</span>
        <input
          type="date"
          value={endDate}
          min={startDate || earliest}
          max={today}
          onChange={handleEnd}
          style={INPUT_STYLE}
          onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={(e)  => Object.assign(e.currentTarget.style, blurStyle)}
        />
      </div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
        Available {earliest} — {today}
      </p>
    </div>
  );
}
