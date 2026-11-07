import { ImageResponse } from "next/og";
import React from "react";

// PWA maskable icon, 512×512 — same green/white "A" artwork as
// src/app/icon.tsx, but full-bleed (no rounded corners: the OS applies
// its own mask) with the letter kept inside the maskable safe zone
// (central ~80% of the canvas), so no platform mask can clip it.
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
          fontSize: 230,
          fontWeight: 800,
          fontFamily: "sans-serif",
        },
      },
      "A"
    ),
    { width: 512, height: 512 }
  );
}
