const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "#2563EB",
  Apparel: "#9333EA",
  "Home & Kitchen": "#059669",
  Books: "#D97706",
  "Sports & Outdoors": "#DC2626",
};

const DEFAULT_COLOR = "#334155";

export function colorForCategory(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

export function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapLabel(label: string, maxCharsPerLine: number): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }

  return lines;
}

export function buildPlaceholderImage(
  label: string,
  bgColor: string,
  width = 400,
  height = 400,
): string {
  const lines = wrapLabel(label, 18);
  const fontSize = 22;
  const lineHeight = fontSize + 6;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  const textElements = lines
    .map(
      (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bgColor}"/>${textElements}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
