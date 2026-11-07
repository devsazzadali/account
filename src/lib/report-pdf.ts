// AccountStoreOne — branded PDF renderer for admin reports + the buyer
// invoice (ধাপ ৫ঘ). Server-side, pdf-lib only (pure JS, no native deps).
//
// Branding follows the storefront theme: deep green band (#117345),
// bright green accents (#1dbf73), light surfaces. The store name comes
// from settings; a logo is embedded only when settings carry a logo URL
// that actually fetches as PNG/JPG — otherwise a clean text wordmark is
// drawn (no invented artwork).

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const DEEP = rgb(0x11 / 255, 0x73 / 255, 0x45 / 255); // #117345
const BRIGHT = rgb(0x1d / 255, 0xbf / 255, 0x73 / 255); // #1dbf73
const TOTALS_BG = rgb(0xd8 / 255, 0xf3 / 255, 0xe3 / 255);
const ZEBRA = rgb(0xf0 / 255, 0xfa / 255, 0xf4 / 255);
const INK = rgb(0.13, 0.16, 0.2);
const MUTED = rgb(0.45, 0.5, 0.56);
const WHITE = rgb(1, 1, 1);
const HAIRLINE = rgb(0.85, 0.89, 0.87);

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

export interface PdfColumn {
  title: string;
  /** Relative width weight. */
  w: number;
  align?: "left" | "right" | "center";
}

export interface PdfTable {
  heading?: string;
  columns: PdfColumn[];
  rows: string[][];
  /** Rendered bold on the totals background. */
  totalsRow?: string[];
}

export interface BrandedPdfInput {
  storeName: string;
  logoBytes?: Uint8Array | null;
  logoType?: "png" | "jpg" | null;
  title: string;
  metaLines: string[];
  tables: PdfTable[];
  footnote?: string;
  /** Wide tables (orders / wallet / inventory) render A4 landscape so
   *  codes, dates and money columns never truncate. */
  landscape?: boolean;
}

function fit(font: PDFFont, text: string, size: number, maxW: number): string {
  let t = text ?? "";
  if (font.widthOfTextAtSize(t, size) <= maxW) return t;
  while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxW) t = t.slice(0, -1);
  return t + "…";
}

export async function renderBrandedPdf(input: BrandedPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  if (input.logoBytes && input.logoType === "png") logo = await doc.embedPng(input.logoBytes).catch(() => null);
  if (input.logoBytes && input.logoType === "jpg") logo = await doc.embedJpg(input.logoBytes).catch(() => null);

  const PAGE_W = input.landscape ? A4_H : A4_W;
  const PAGE_H = input.landscape ? A4_W : A4_H;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const generated = new Date().toUTCString();
  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let pageNo = 1;
  let y = PAGE_H;

  const footer = () => {
    page.drawText(`Page ${pageNo}`, {
      x: PAGE_W - MARGIN - bold.widthOfTextAtSize(`Page ${pageNo}`, 8),
      y: 22,
      size: 8,
      font: bold,
      color: MUTED,
    });
    page.drawText(`${input.storeName} — generated ${generated}`, { x: MARGIN, y: 22, size: 8, font, color: MUTED });
  };

  const header = (first: boolean) => {
    if (first) {
      page.drawRectangle({ x: 0, y: PAGE_H - 62, width: PAGE_W, height: 62, color: DEEP });
      let tx = MARGIN;
      if (logo) {
        const lh = 34;
        const lw = Math.min(120, (logo.width / logo.height) * lh);
        page.drawImage(logo, { x: MARGIN, y: PAGE_H - 48, width: lw, height: lh });
        tx = MARGIN + lw + 12;
      }
      page.drawText(fit(bold, input.storeName, 17, PAGE_W - tx - MARGIN), {
        x: tx,
        y: PAGE_H - 40,
        size: 17,
        font: bold,
        color: WHITE,
      });
      y = PAGE_H - 62 - 26;
      page.drawText(input.title, { x: MARGIN, y, size: 15, font: bold, color: DEEP });
      y -= 16;
      for (const line of input.metaLines) {
        page.drawText(fit(font, line, 9, CONTENT_W), { x: MARGIN, y, size: 9, font, color: MUTED });
        y -= 12;
      }
      y -= 6;
    } else {
      page.drawRectangle({ x: 0, y: PAGE_H - 30, width: PAGE_W, height: 30, color: DEEP });
      page.drawText(fit(bold, `${input.storeName} — ${input.title}`, 10, CONTENT_W), {
        x: MARGIN,
        y: PAGE_H - 20,
        size: 10,
        font: bold,
        color: WHITE,
      });
      y = PAGE_H - 30 - 18;
    }
  };

  const newPage = () => {
    footer();
    page = doc.addPage([PAGE_W, PAGE_H]);
    pageNo += 1;
    header(false);
  };

  header(true);

  const drawTable = (table: PdfTable) => {
    const totalW = table.columns.reduce((s, c) => s + c.w, 0);
    const widths = table.columns.map((c) => (c.w / totalW) * CONTENT_W);
    const rowH = 15;
    const headH = 17;

    const drawHead = () => {
      if (y - headH < 48) newPage();
      page.drawRectangle({ x: MARGIN, y: y - headH, width: CONTENT_W, height: headH, color: BRIGHT });
      let x = MARGIN;
      table.columns.forEach((c, i) => {
        const t = fit(bold, c.title, 8, widths[i] - 8);
        const tw = bold.widthOfTextAtSize(t, 8);
        const cx = c.align === "right" ? x + widths[i] - tw - 4 : c.align === "center" ? x + (widths[i] - tw) / 2 : x + 4;
        page.drawText(t, { x: cx, y: y - 12, size: 8, font: bold, color: WHITE });
        x += widths[i];
      });
      y -= headH;
    };

    const drawRow = (cells: string[], isTotals: boolean, idx: number) => {
      if (y - rowH < 48) {
        newPage();
        drawHead();
      }
      if (isTotals) page.drawRectangle({ x: MARGIN, y: y - rowH, width: CONTENT_W, height: rowH, color: TOTALS_BG });
      else if (idx % 2 === 1) page.drawRectangle({ x: MARGIN, y: y - rowH, width: CONTENT_W, height: rowH, color: ZEBRA });
      const f = isTotals ? bold : font;
      let x = MARGIN;
      table.columns.forEach((c, i) => {
        const t = fit(f, cells[i] ?? "", 8, widths[i] - 8);
        const tw = f.widthOfTextAtSize(t, 8);
        const cx = c.align === "right" ? x + widths[i] - tw - 4 : c.align === "center" ? x + (widths[i] - tw) / 2 : x + 4;
        page.drawText(t, { x: cx, y: y - 11, size: 8, font: f, color: INK });
        x += widths[i];
      });
      y -= rowH;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_W, y }, thickness: 0.4, color: HAIRLINE });
    };

    if (table.heading) {
      if (y - 16 < 48) newPage();
      page.drawText(table.heading, { x: MARGIN, y: y - 4, size: 11, font: bold, color: DEEP });
      y -= 20;
    }
    drawHead();
    table.rows.forEach((r, i) => drawRow(r, false, i));
    if (table.totalsRow) drawRow(table.totalsRow, true, 0);
    y -= 14;
  };

  for (const t of input.tables) drawTable(t);

  if (input.footnote) {
    if (y - 24 < 48) newPage();
    page.drawText(fit(font, input.footnote, 8.5, CONTENT_W), { x: MARGIN, y: y - 6, size: 8.5, font, color: MUTED });
  }
  footer();

  return doc.save();
}

/** Fetch a settings logo for embedding; null on any failure (wordmark). */
export async function fetchLogo(logoUrl: string | null | undefined): Promise<{ bytes: Uint8Array; type: "png" | "jpg" } | null> {
  const url = (logoUrl || "").trim();
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (ct.includes("png") || url.toLowerCase().endsWith(".png")) return { bytes, type: "png" };
    if (ct.includes("jpeg") || ct.includes("jpg") || /\.jpe?g$/i.test(url)) return { bytes, type: "jpg" };
    return null;
  } catch {
    return null;
  }
}
