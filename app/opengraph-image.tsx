import { ImageResponse } from "next/og";

export const alt = "AVCalc: kalkulator desain ruang AV";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0F1A2B",
          backgroundImage: "linear-gradient(#1C2D47 1px, transparent 1px), linear-gradient(90deg, #1C2D47 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          color: "#E5ECF6",
        }}
      >
        <div style={{ fontSize: 36, color: "#8DB2EE", display: "flex" }}>AVCalc</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>Kalkulator desain ruang AV</div>
          <div style={{ fontSize: 32, marginTop: 24, color: "#9FB0C8" }}>
            Ukuran layar, LED video wall, proyektor, kamera PTZ, speaker plafon
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 300, height: 4, background: "#3CC2B2" }} />
          <div style={{ fontSize: 28, color: "#3CC2B2" }}>80,3 inci → 86 inci</div>
        </div>
      </div>
    ),
    size,
  );
}
