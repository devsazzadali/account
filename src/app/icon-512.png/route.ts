import { ImageResponse } from "next/og";
import React from "react";

// PWA icon, 512×512 — identical artwork and geometry to src/app/icon.tsx
// (which serves this same size at /icon); this route exists so the web
// app manifest can reference explicit 192/512 install icons by name.
// (createElement rather than JSX: route files are .ts.)
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
          fontSize: 300,
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: 96,
        },
      },
      "A"
    ),
    { width: 512, height: 512 }
  );
}
