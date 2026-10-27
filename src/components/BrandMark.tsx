"use client";

import React from "react";

/** Shared store-identity rendering (Storefront CMS). When the admin has
 *  not customized the store name/logo, every surface renders the original
 *  built-in wordmark exactly as designed; a custom name renders in full
 *  with its last word accented, and a custom logo replaces the icon tile. */
export const DEFAULT_STORE_NAME = "Account Store One";

export function splitStoreName(name: string): { head: string; tail: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { head: "", tail: name.trim() };
  return { head: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}

export interface BrandInfo {
  name: string;
  logoUrl: string | null;
}

/** Wordmark text: built-in "Account*Store*" styling for the default name,
 *  otherwise the admin's full name with the last word accented. */
export function BrandWordmark({
  brand,
  accentClassName,
  builtin,
}: {
  brand?: BrandInfo;
  accentClassName: string;
  /** The exact built-in JSX for the default name on this surface. */
  builtin: React.ReactNode;
}) {
  if (!brand || brand.name === DEFAULT_STORE_NAME) return <>{builtin}</>;
  const { head, tail } = splitStoreName(brand.name);
  return (
    <>
      {head}
      {head ? " " : ""}
      <span className={accentClassName}>{tail}</span>
    </>
  );
}
