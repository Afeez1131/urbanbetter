export default function ErrorBanner({ message, onRetry }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{
        border: "1px solid #fecaca",
        backgroundColor: "#fff5f5",
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 32, height: 32, backgroundColor: "#fee2e2" }}
      >
        <svg
          style={{ width: 15, height: 15, color: "#ef4444" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1">
        <p style={{ fontSize: 13, fontWeight: 500, color: "#991b1b", marginBottom: 2 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 12.5, color: "#b91c1c" }}>{message}</p>
      </div>

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 500,
            color: "#dc2626",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#991b1b"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#dc2626"; }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
