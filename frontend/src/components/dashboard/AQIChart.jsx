import ReactApexChart from "react-apexcharts";
import dayjs from "dayjs";

const EPA_THRESHOLDS = [
  { value: 12,    label: "Good",      color: "#16a34a" },
  { value: 35.4,  label: "Moderate",  color: "#a16207" },
  { value: 55.4,  label: "Sensitive", color: "#c2410c" },
  { value: 150.4, label: "Unhealthy", color: "#dc2626" },
];

export default function AQIChart({ measurements }) {
  if (!measurements?.length) return null;

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.time) - new Date(b.time)
  );

  const series = [
    {
      name: "PM2.5",
      data: sorted.map((m) => ({
        x: new Date(m.time).getTime(),
        y: m.pm2_5_value,
        aqi_category: m.aqi_category,
        aqi_color: m.aqi_color,
      })),
    },
  ];

  const options = {
    chart: {
      type: "line",
      fontFamily: "inherit",
      background: "transparent",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        autoSelected: "zoom",
      },
      zoom: {
        enabled: true,
        type: "x",
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 400,
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
      colors: ["#2563eb"],
    },
    markers: {
      size: 0,
      hover: { size: 5, sizeOffset: 2 },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          fontSize: "11px",
          colors: "#94a3b8",
          fontFamily: "'DM Mono', monospace",
        },
        datetimeUTC: false,
        datetimeFormatter: {
          year:   "yyyy",
          month:  "MMM yyyy",
          day:    "MMM d",
          hour:   "MMM d HH:mm",
          minute: "HH:mm",
        },
      },
      axisBorder: { show: false },
      axisTicks:  { show: false },
      tooltip:    { enabled: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "11px",
          colors: "#94a3b8",
          fontFamily: "'DM Mono', monospace",
        },
        formatter: (v) => `${v} µg`,
      },
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: "light",
      x: { format: "MMM d, yyyy HH:mm" },
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const point     = w.config.series[seriesIndex].data[dataPointIndex];
        const value     = series[seriesIndex][dataPointIndex];
        const category  = point.aqi_category ?? "—";
        const color     = point.aqi_color    ?? "#94a3b8";
        const time      = dayjs(point.x).format("MMM D, YYYY HH:mm");
        const darkText  = ["#FFFF00", "#00E400"].includes(color?.toUpperCase());
        const textColor = darkText ? "#000000" : "#ffffff";

        return `
          <div style="padding:10px 12px;min-width:160px;font-family:inherit;border-radius:12px;">
            <p style="font-family:'DM Mono',monospace;font-size:11px;color:#94a3b8;margin:0 0 6px;">
              ${time}
            </p>
            <p style="font-size:13px;color:#334155;margin:0 0 6px;">
              PM2.5 <strong style="font-family:'DM Mono',monospace;color:#0f172a;">${value} µg/m³</strong>
            </p>
            <span style="display:inline-flex;align-items:center;border-radius:999px;padding:2px 9px;
              background:${color};color:${textColor};font-size:10px;font-weight:600;letter-spacing:0.02em;">
              ${category}
            </span>
          </div>`;
      },
    },
    annotations: {
      yaxis: EPA_THRESHOLDS.map((t) => ({
        y: t.value,
        borderColor: t.color,
        borderWidth: 1,
        strokeDashArray: 4,
        opacity: 0.8,
        label: {
          text: t.label,
          position: "right",
          textAnchor: "end",
          offsetX: -4,
          style: {
            fontSize: "9.5px",
            fontWeight: 600,
            color: t.color,
            background: "transparent",
            border: "none",
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
          },
        },
      })),
    },
    dataLabels: { enabled: false },
    legend:     { show: false },
  };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="mb-4">
        <p style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
          PM2.5 Concentration Over Time
        </p>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          µg/m³ · use the toolbar to zoom, pan, or download
        </p>
      </div>

      <ReactApexChart
        type="line"
        series={series}
        options={options}
        height={360}
      />
    </div>
  );
}
