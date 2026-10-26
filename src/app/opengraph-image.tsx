import { ImageResponse } from "next/og";

export const alt = "Account Store One — Premium Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0C2254 0%, #123069 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, color: "#F4751F", fontWeight: 700 }}>
          ACCOUNT STORE ONE
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          Premium Digital Accounts,
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.1 }}>
          Delivered Instantly.
        </div>
        <div style={{ fontSize: 29, color: "#B9C6E4", marginTop: 28 }}>
          Streaming, Music, IPTV and Gaming Accounts — Escrow Protected
        </div>
        <div style={{ width: 120, height: 8, background: "#F4751F", marginTop: 42 }} />
      </div>
    ),
    { ...size }
  );
}
