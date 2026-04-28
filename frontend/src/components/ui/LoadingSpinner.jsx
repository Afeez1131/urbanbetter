export default function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div
        className="rounded-full animate-spin"
        style={{
          width: 32,
          height: 32,
          border: "2.5px solid #e2e8f0",
          borderTopColor: "#2563eb",
        }}
      />
      <p style={{ fontSize: 13, color: "#64748b" }}>{message}</p>
    </div>
  );
}
