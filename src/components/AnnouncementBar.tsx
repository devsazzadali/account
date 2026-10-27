"use client";

import React from "react";
import type { StorefrontSettings } from "@/src/lib/store-types";

/** Top announcement strip (Storefront CMS). Renders only when the admin
 *  has enabled it and given it text. Styled with the brand navy so it
 *  sits naturally above the header. */
export function AnnouncementBar({
  announcement,
}: {
  announcement: StorefrontSettings["announcement"];
}) {
  if (!announcement.enabled || !announcement.text) return null;
  return (
    <div className="bg-[#0C2254] text-white text-center px-4 py-2 relative z-[60]">
      {announcement.link ? (
        <a
          href={announcement.link}
          className="text-[13px] font-semibold tracking-wide hover:underline underline-offset-4 decoration-[#F4751F] decoration-2"
        >
          {announcement.text}
        </a>
      ) : (
        <span className="text-[13px] font-semibold tracking-wide">{announcement.text}</span>
      )}
    </div>
  );
}
