const NEEDS_DARK_TEXT = new Set(["#FFFF00", "#00E400"]);

export default function AQIBadge({ category, color, colorName }) {
  const darkText = NEEDS_DARK_TEXT.has(color?.toUpperCase());

  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap"
      style={{
        paddingLeft: 9,
        paddingRight: 9,
        paddingTop: 3,
        paddingBottom: 3,
        backgroundColor: color,
        color: darkText ? "#000000" : "#ffffff",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
      title={colorName ? `${category} — ${colorName}` : category}
    >
      {category}
    </span>
  );
}
