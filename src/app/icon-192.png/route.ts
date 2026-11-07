import { ImageResponse } from "next/og";
import React from "react";

// PWA icon, 192×192 — the same artwork as src/app/icon.tsx (green
// primary-700 tile, white "A"), rendered at install-icon size.
// (createElement rather than JSX: route files are .ts, where JSX
// syntax is not allowed.)
export function GET() {
  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#117345",
          color: "#FFFFFF",
          fontSize: 112,
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: 36,
        },
      },
      "A"
    ),
    { width: 192, height: 192 }
  );
}
