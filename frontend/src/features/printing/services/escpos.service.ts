/**
 * Low-level ESC/POS encoder for generic thermal printers.
 * Pure functions — no state, no I/O.
 */

// CP437 code points for Spanish characters outside ASCII.
const CP437: Record<string, number> = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ü: 0x81,
  ñ: 0xa4,
  Ñ: 0xa5,
  Ü: 0x9a,
  "¿": 0xa8,
  "¡": 0xad,
  "°": 0xf8,
};

// CP437 has no uppercase accented vowels — transliterate them.
const TRANSLITERATE: Record<string, string> = {
  Á: "A",
  É: "E",
  Í: "I",
  Ó: "O",
  Ú: "U",
};

export const CMD = {
  INIT: new Uint8Array([0x1b, 0x40, 0x1b, 0x74, 0x00]), // reset + select CP437
  ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
  BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
  SIZE_DOUBLE: new Uint8Array([0x1d, 0x21, 0x11]),
  SIZE_NORMAL: new Uint8Array([0x1d, 0x21, 0x00]),
  CUT: new Uint8Array([0x1d, 0x56, 0x00]),
};

export function feed(lines: number): Uint8Array {
  return new Uint8Array([0x1b, 0x64, lines]);
}

/** Encodes a text line to CP437 bytes, ending with a line feed. */
export function encodeLine(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const ch = TRANSLITERATE[char] ?? char;
    if (ch in CP437) {
      bytes.push(CP437[ch]);
      continue;
    }
    const code = ch.charCodeAt(0);
    bytes.push(code >= 0x20 && code <= 0x7e ? code : 0x3f); // "?" if unmappable
  }
  bytes.push(0x0a);
  return new Uint8Array(bytes);
}

export function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function divider(width: number): string {
  return "-".repeat(width);
}

/** Word-wraps text to the given width, hard-splitting words longer than a line. */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    let rest = word;
    while (rest.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(rest.slice(0, width));
      rest = rest.slice(width);
    }
    const candidate = current ? `${current} ${rest}` : rest;
    if (candidate.length <= width) {
      current = candidate;
    } else {
      lines.push(current);
      current = rest;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/**
 * Lays out a label on the left and a value right-aligned on the same line,
 * wrapping the label when it does not fit.
 */
export function formatRow(left: string, right: string, width: number): string[] {
  const maxLeft = width - right.length - 1;
  if (left.length <= maxLeft) {
    return [left.padEnd(width - right.length) + right];
  }
  const lines = wrapText(left, width);
  const last = lines[lines.length - 1];
  if (last.length <= maxLeft) {
    lines[lines.length - 1] = last.padEnd(width - right.length) + right;
  } else {
    lines.push(right.padStart(width));
  }
  return lines;
}
