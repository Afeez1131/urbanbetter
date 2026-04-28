export default function EmptyState({
  title = "No data found",
  description = "Try adjusting your filters and search again.",
  icon,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      {/* Icon well */}
      <div
        className="flex items-center justify-center rounded-2xl mb-5"
        style={{
          width: 56,
          height: 56,
          backgroundColor: "#f1f5f9",
        }}
      >
        {icon || (
          <svg
            style={{ width: 24, height: 24, color: "#94a3b8" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        )}
      </div>

      <h3
        style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 6 }}
      >
        {title}
      </h3>
      <p
        style={{ fontSize: 13.5, color: "#64748b", maxWidth: 360, lineHeight: 1.6 }}
      >
        {description}
      </p>
    </div>
  );
}
