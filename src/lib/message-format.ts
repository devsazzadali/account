// AccountStoreOne — support-message body format.
//
// The messages table stores a single text body (no attachment column).
// A message with a file attached carries ONE trailing marker line:
//
//     [[attach:<url>|<file name>]]
//
// The file itself is uploaded through the existing /api/upload route
// (bucket "messages") before the message is sent. Every surface that
// renders a message body (Communication Desk, Support Hub widget) must
// run it through parseMessageBody so the marker becomes a real image /
// file link instead of raw syntax. When the text part is empty, the
// message was sent as an attachment only.

export interface MessageAttachment {
  url: string;
  name: string;
}

export interface ParsedMessageBody {
  text: string;
  attachment: MessageAttachment | null;
}

const ATTACH_RE = /\[\[attach:([^\]|]+)\|([^\]]*)\]\]/;

export function formatMessageBody(text: string, attachment: MessageAttachment | null): string {
  const clean = (text || "").trim();
  if (!attachment) return clean;
  const marker = `[[attach:${attachment.url}|${attachment.name}]]`;
  return clean ? `${clean}\n${marker}` : marker;
}

export function parseMessageBody(body: string | null | undefined): ParsedMessageBody {
  const raw = body || "";
  const m = raw.match(ATTACH_RE);
  if (!m) return { text: raw, attachment: null };
  return {
    text: raw.replace(ATTACH_RE, "").replace(/\s+$/, ""),
    attachment: { url: m[1], name: m[2] || "Attachment" },
  };
}

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

export function isImageAttachment(a: MessageAttachment): boolean {
  const path = a.url.split("?")[0].toLowerCase();
  return IMAGE_EXTS.some((ext) => path.endsWith(ext));
}
